import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { localeForLanguage } from "@/src/demo/fullUi";
import type { LanguageCode } from "@/src/demo/types";

import {
  Avatar,
  Card,
  EmptyState,
  MetricCard,
  SectionTitle,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type ComplianceStatus = "fit" | "attention" | "blocked";
type ComplianceIssue = {
  kind: "document" | "certificate";
  code: string;
  severity: "warning" | "critical" | "blocked";
  requirement: string;
  label: string;
  expires_at: string | null;
  days_remaining: number | null;
};
type ComplianceRow = {
  worker_id: string;
  worker_name: string;
  worker_profession: string;
  worker_avatar?: string;
  project_id: string;
  project_name: string;
  status: ComplianceStatus;
  fit_for_check_in: boolean;
  score: number;
  issues: ComplianceIssue[];
  requirements: { documents: string[]; certificates: string[] };
};
type CompliancePayload = {
  summary: { total: number; fit: number; attention: number; blocked: number };
  rows: ComplianceRow[];
};

type Copy = {
  title: string;
  subtitleCompany: string;
  subtitleWorker: string;
  fit: string;
  attention: string;
  blocked: string;
  compliant: string;
  checkInAllowed: string;
  checkInBlocked: string;
  issues: string;
  requirements: string;
  noIssues: string;
  noRows: string;
  loading: string;
  retry: string;
  missing: string;
  expired: string;
  expiring: string;
  document: string;
  certificate: string;
  days: string;
};

const copy: Record<LanguageCode, Copy> = {
  pt: { title: "Centro de Conformidade", subtitleCompany: "Aptidão documental e certificações por trabalhador e obra.", subtitleWorker: "Estado da tua documentação e certificações para cada obra.", fit: "Apto", attention: "Atenção", blocked: "Bloqueado", compliant: "Conformidade", checkInAllowed: "Check-in permitido", checkInBlocked: "Check-in bloqueado", issues: "Pendências", requirements: "Requisitos", noIssues: "Sem pendências.", noRows: "Sem dados de conformidade.", loading: "A calcular conformidade...", retry: "Tentar novamente", missing: "Em falta", expired: "Expirado", expiring: "A expirar", document: "Documento", certificate: "Certificado", days: "dias" },
  en: { title: "Compliance Center", subtitleCompany: "Document and certification fitness by worker and site.", subtitleWorker: "Your document and certification status for each site.", fit: "Fit", attention: "Attention", blocked: "Blocked", compliant: "Compliance", checkInAllowed: "Check-in allowed", checkInBlocked: "Check-in blocked", issues: "Issues", requirements: "Requirements", noIssues: "No issues.", noRows: "No compliance data.", loading: "Calculating compliance...", retry: "Try again", missing: "Missing", expired: "Expired", expiring: "Expiring", document: "Document", certificate: "Certificate", days: "days" },
  fr: { title: "Centre de conformité", subtitleCompany: "Aptitude documentaire et certifications par travailleur et chantier.", subtitleWorker: "État de vos documents et certifications pour chaque chantier.", fit: "Apte", attention: "Attention", blocked: "Bloqué", compliant: "Conformité", checkInAllowed: "Pointage autorisé", checkInBlocked: "Pointage bloqué", issues: "Écarts", requirements: "Exigences", noIssues: "Aucun écart.", noRows: "Aucune donnée de conformité.", loading: "Calcul de la conformité...", retry: "Réessayer", missing: "Manquant", expired: "Expiré", expiring: "Expire bientôt", document: "Document", certificate: "Certificat", days: "jours" },
  es: { title: "Centro de Cumplimiento", subtitleCompany: "Aptitud documental y certificaciones por trabajador y obra.", subtitleWorker: "Estado de tus documentos y certificaciones para cada obra.", fit: "Apto", attention: "Atención", blocked: "Bloqueado", compliant: "Cumplimiento", checkInAllowed: "Check-in permitido", checkInBlocked: "Check-in bloqueado", issues: "Pendientes", requirements: "Requisitos", noIssues: "Sin pendientes.", noRows: "Sin datos de cumplimiento.", loading: "Calculando cumplimiento...", retry: "Intentar de nuevo", missing: "Falta", expired: "Caducado", expiring: "Próximo a caducar", document: "Documento", certificate: "Certificado", days: "días" },
  ro: { title: "Centru de Conformitate", subtitleCompany: "Conformitate documentară și certificări pe lucrător și șantier.", subtitleWorker: "Starea documentelor și certificărilor tale pentru fiecare șantier.", fit: "Apt", attention: "Atenție", blocked: "Blocat", compliant: "Conformitate", checkInAllowed: "Check-in permis", checkInBlocked: "Check-in blocat", issues: "Probleme", requirements: "Cerințe", noIssues: "Fără probleme.", noRows: "Nu există date de conformitate.", loading: "Se calculează conformitatea...", retry: "Încearcă din nou", missing: "Lipsește", expired: "Expirat", expiring: "Expiră curând", document: "Document", certificate: "Certificat", days: "zile" },
  de: { title: "Compliance-Zentrale", subtitleCompany: "Dokumenten- und Zertifikatsstatus je Mitarbeiter und Baustelle.", subtitleWorker: "Status deiner Dokumente und Zertifikate für jede Baustelle.", fit: "Geeignet", attention: "Achtung", blocked: "Gesperrt", compliant: "Compliance", checkInAllowed: "Check-in erlaubt", checkInBlocked: "Check-in gesperrt", issues: "Offene Punkte", requirements: "Anforderungen", noIssues: "Keine offenen Punkte.", noRows: "Keine Compliance-Daten.", loading: "Compliance wird berechnet...", retry: "Erneut versuchen", missing: "Fehlt", expired: "Abgelaufen", expiring: "Läuft bald ab", document: "Dokument", certificate: "Zertifikat", days: "Tage" },
  nl: { title: "Compliancecentrum", subtitleCompany: "Document- en certificeringsstatus per werknemer en project.", subtitleWorker: "Status van je documenten en certificaten voor elk project.", fit: "Geschikt", attention: "Aandacht", blocked: "Geblokkeerd", compliant: "Compliance", checkInAllowed: "Check-in toegestaan", checkInBlocked: "Check-in geblokkeerd", issues: "Aandachtspunten", requirements: "Vereisten", noIssues: "Geen aandachtspunten.", noRows: "Geen compliancegegevens.", loading: "Compliance berekenen...", retry: "Opnieuw proberen", missing: "Ontbreekt", expired: "Verlopen", expiring: "Verloopt binnenkort", document: "Document", certificate: "Certificaat", days: "dagen" },
};

export function complianceNavLabel(language: LanguageCode) {
  return copy[language].title;
}

function statusColor(status: ComplianceStatus) {
  if (status === "fit") return workspaceColors.green;
  if (status === "attention") return workspaceColors.yellow;
  return workspaceColors.redSoft;
}

function issueLabel(issue: ComplianceIssue, text: Copy) {
  if (issue.code === "missing") return text.missing;
  if (issue.code === "expired") return text.expired;
  if (issue.code === "expiring") return text.expiring;
  return issue.code;
}

export function ComplianceView() {
  const { user } = useAuth();
  const { language } = useWorklyData();
  const { width } = useWindowDimensions();
  const [payload, setPayload] = useState<CompliancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const text = copy[language];
  const compact = width < 760;
  const accent = roleAccent(user?.role ?? "worker");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPayload(await api.get<CompliancePayload>("/compliance"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "WORKLY");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectedRow = useMemo(() => {
    if (!payload?.rows.length) return null;
    return payload.rows.find((row) => `${row.worker_id}:${row.project_id}` === selected) ?? payload.rows[0];
  }, [payload, selected]);

  if (loading && !payload) {
    return <View style={styles.center}><ActivityIndicator color={accent} size="large" /><Text style={styles.muted}>{text.loading}</Text></View>;
  }
  if (error && !payload) {
    return <View style={styles.center}><Ionicons name="warning-outline" color={workspaceColors.redSoft} size={30} /><Text style={styles.muted}>{error}</Text><Pressable onPress={() => void load()} style={[styles.retry, { borderColor: accent }]}><Text style={{ color: accent, fontWeight: "800" }}>{text.retry}</Text></Pressable></View>;
  }
  if (!payload) return null;

  const summary = payload.summary;
  return (
    <ScrollView contentContainerStyle={[styles.page, compact ? styles.pageCompact : null]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>{text.title}</Text>
          <Text style={sharedStyles.subtitle}>{user?.role === "company" ? text.subtitleCompany : text.subtitleWorker}</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <MetricCard icon="shield-checkmark-outline" label={text.fit} value={summary.fit} detail={text.checkInAllowed} accent={workspaceColors.green} />
        <MetricCard icon="warning-outline" label={text.attention} value={summary.attention} detail={text.compliant} accent={workspaceColors.yellow} />
        <MetricCard icon="close-circle-outline" label={text.blocked} value={summary.blocked} detail={text.checkInBlocked} accent={workspaceColors.redSoft} />
        <MetricCard icon="people-outline" label={text.compliant} value={`${summary.fit}/${summary.total}`} detail={`${summary.total}`} accent={accent} />
      </View>

      {!payload.rows.length ? <Card><EmptyState icon="shield-outline" title={text.noRows} /></Card> : (
        <View style={[styles.grid, compact ? styles.gridCompact : null]}>
          <Card style={styles.listCard}>
            <SectionTitle title={user?.role === "company" ? text.compliant : text.requirements} />
            <View style={{ gap: 8, marginTop: 14 }}>
              {payload.rows.map((row) => {
                const key = `${row.worker_id}:${row.project_id}`;
                const active = selectedRow ? key === `${selectedRow.worker_id}:${selectedRow.project_id}` : false;
                const color = statusColor(row.status);
                return (
                  <Pressable key={key} onPress={() => setSelected(key)} style={[styles.row, active ? { borderColor: `${color}88`, backgroundColor: `${color}0E` } : null]}>
                    <Avatar name={row.worker_name} size={38} accent={color} />
                    <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.name} numberOfLines={1}>{row.worker_name}</Text><Text style={styles.meta} numberOfLines={1}>{row.project_name}</Text></View>
                    <View style={styles.score}><Text style={[styles.scoreValue, { color }]}>{row.score}%</Text><Text style={[styles.status, { color }]}>{text[row.status]}</Text></View>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {selectedRow ? <Card accent={statusColor(selectedRow.status)} style={styles.detailCard}>
            <View style={styles.detailHeader}><View><Text style={styles.detailTitle}>{selectedRow.worker_name}</Text><Text style={styles.meta}>{selectedRow.worker_profession} · {selectedRow.project_name}</Text></View><View style={[styles.bigStatus, { borderColor: statusColor(selectedRow.status) }]}><Ionicons name={selectedRow.fit_for_check_in ? "shield-checkmark-outline" : "close-circle-outline"} size={18} color={statusColor(selectedRow.status)} /><Text style={{ color: statusColor(selectedRow.status), fontWeight: "900", fontSize: 11 }}>{selectedRow.fit_for_check_in ? text.checkInAllowed : text.checkInBlocked}</Text></View></View>
            <View style={styles.divider} />
            <SectionTitle title={text.issues} subtitle={`${selectedRow.score}%`} />
            <View style={{ gap: 8, marginTop: 12 }}>
              {selectedRow.issues.length ? selectedRow.issues.map((issue, index) => {
                const color = issue.severity === "blocked" ? workspaceColors.redSoft : workspaceColors.yellow;
                return <View key={`${issue.kind}-${issue.requirement}-${index}`} style={styles.issue}><Ionicons name={issue.kind === "certificate" ? "ribbon-outline" : "document-text-outline"} size={18} color={color} /><View style={{ flex: 1 }}><Text style={styles.issueTitle}>{issue.label}</Text><Text style={styles.meta}>{issue.kind === "certificate" ? text.certificate : text.document} · {issueLabel(issue, text)}{issue.days_remaining !== null ? ` · ${issue.days_remaining} ${text.days}` : ""}{issue.expires_at ? ` · ${new Date(issue.expires_at).toLocaleDateString(localeForLanguage(language))}` : ""}</Text></View></View>;
              }) : <View style={styles.okBox}><Ionicons name="checkmark-circle-outline" size={20} color={workspaceColors.green} /><Text style={{ color: workspaceColors.green, fontWeight: "800" }}>{text.noIssues}</Text></View>}
            </View>
            <View style={styles.divider} />
            <SectionTitle title={text.requirements} />
            <View style={styles.requirements}>{selectedRow.requirements.documents.map((item) => <View key={`d-${item}`} style={styles.req}><Ionicons name="document-outline" size={14} color={workspaceColors.textSoft} /><Text style={styles.reqText}>{item}</Text></View>)}{selectedRow.requirements.certificates.map((item) => <View key={`c-${item}`} style={styles.req}><Ionicons name="ribbon-outline" size={14} color={workspaceColors.textSoft} /><Text style={styles.reqText}>{item}</Text></View>)}</View>
          </Card> : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 22, paddingBottom: 150, gap: 18 }, pageCompact: { paddingHorizontal: 14, paddingTop: 16 }, header: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, grid: { flexDirection: "row", gap: 14, alignItems: "flex-start" }, gridCompact: { flexDirection: "column" }, listCard: { flex: 0.9, minWidth: 300 }, detailCard: { flex: 1.1, minWidth: 0 }, row: { borderWidth: 1, borderColor: "#1B2431", borderRadius: 12, padding: 10, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#090C12" }, name: { color: workspaceColors.text, fontSize: 12, fontWeight: "800" }, meta: { color: workspaceColors.muted, fontSize: 10, marginTop: 2 }, score: { alignItems: "flex-end" }, scoreValue: { fontSize: 14, fontWeight: "900" }, status: { fontSize: 9, fontWeight: "800", textTransform: "uppercase" }, detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }, detailTitle: { color: workspaceColors.text, fontSize: 18, fontWeight: "900" }, bigStatus: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", gap: 6, alignItems: "center" }, divider: { height: 1, backgroundColor: "#18202B", marginVertical: 16 }, issue: { borderWidth: 1, borderColor: "#1B2431", borderRadius: 11, padding: 10, flexDirection: "row", gap: 9, alignItems: "center" }, issueTitle: { color: workspaceColors.text, fontSize: 11, fontWeight: "800" }, okBox: { borderWidth: 1, borderColor: "#173628", borderRadius: 11, padding: 12, flexDirection: "row", gap: 8, alignItems: "center" }, requirements: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }, req: { borderWidth: 1, borderColor: "#202A39", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, flexDirection: "row", gap: 5, alignItems: "center" }, reqText: { color: workspaceColors.textSoft, fontSize: 9, fontWeight: "700" }, center: { flex: 1, minHeight: 360, alignItems: "center", justifyContent: "center", gap: 10 }, muted: { color: workspaceColors.muted, fontSize: 11 }, retry: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }
});
