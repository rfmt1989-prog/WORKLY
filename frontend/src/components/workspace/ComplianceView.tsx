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
import type { Certificate, DemoDocument, LanguageCode } from "@/src/demo/types";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  MetricCard,
  ModalPanel,
  SectionTitle,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type ComplianceStatus = "fit" | "attention" | "blocked";
type ComplianceIssue = { kind: "document" | "certificate"; code: string; severity: "warning" | "critical" | "blocked"; requirement: string; label: string; expires_at: string | null; days_remaining: number | null };
type ComplianceRow = { worker_id: string; worker_name: string; worker_profession: string; worker_avatar?: string; project_id: string; project_name: string; status: ComplianceStatus; fit_for_check_in: boolean; score: number; issues: ComplianceIssue[]; requirements: { documents: string[]; certificates: string[] } };
type CompliancePayload = { summary: { total: number; fit: number; attention: number; blocked: number }; rows: ComplianceRow[] };
type SourceRecord = { kind: "document"; item: DemoDocument } | { kind: "certificate"; item: Certificate };

type Copy = {
  title: string; subtitleCompany: string; subtitleWorker: string; fit: string; attention: string; blocked: string; compliant: string; checkInAllowed: string; checkInBlocked: string; issues: string; requirements: string; noIssues: string; noRows: string; loading: string; retry: string; missing: string; expired: string; expiring: string; document: string; certificate: string; days: string; configure: string; configureTitle: string; configureSubtitle: string; requiredDocuments: string; requiredCertificates: string; onePerLine: string; save: string; close: string; openRecord: string; sourceRecord: string; file: string; issuer: string; statusLabel: string; expiry: string; noExpiry: string;
};

const copy: Record<LanguageCode, Copy> = {
  pt: { title: "Centro de Conformidade", subtitleCompany: "Aptidão documental e certificações por trabalhador e obra.", subtitleWorker: "Estado da tua documentação e certificações para cada obra.", fit: "Apto", attention: "Atenção", blocked: "Bloqueado", compliant: "Conformidade", checkInAllowed: "Check-in permitido", checkInBlocked: "Check-in bloqueado", issues: "Pendências", requirements: "Requisitos", noIssues: "Sem pendências.", noRows: "Sem dados de conformidade.", loading: "A calcular conformidade...", retry: "Tentar novamente", missing: "Em falta", expired: "Expirado", expiring: "A expirar", document: "Documento", certificate: "Certificado", days: "dias", configure: "Configurar", configureTitle: "Requisitos da obra", configureSubtitle: "Define apenas o que é obrigatório para entrar nesta obra.", requiredDocuments: "Documentos obrigatórios", requiredCertificates: "Certificados obrigatórios", onePerLine: "Um requisito por linha", save: "Guardar requisitos", close: "Fechar", openRecord: "Ver registo", sourceRecord: "Registo associado", file: "Ficheiro", issuer: "Entidade emissora", statusLabel: "Estado", expiry: "Validade", noExpiry: "Sem validade definida" },
  en: { title: "Compliance Center", subtitleCompany: "Document and certification fitness by worker and site.", subtitleWorker: "Your document and certification status for each site.", fit: "Fit", attention: "Attention", blocked: "Blocked", compliant: "Compliance", checkInAllowed: "Check-in allowed", checkInBlocked: "Check-in blocked", issues: "Issues", requirements: "Requirements", noIssues: "No issues.", noRows: "No compliance data.", loading: "Calculating compliance...", retry: "Try again", missing: "Missing", expired: "Expired", expiring: "Expiring", document: "Document", certificate: "Certificate", days: "days", configure: "Configure", configureTitle: "Site requirements", configureSubtitle: "Define only what is mandatory before entering this site.", requiredDocuments: "Required documents", requiredCertificates: "Required certificates", onePerLine: "One requirement per line", save: "Save requirements", close: "Close", openRecord: "View record", sourceRecord: "Linked record", file: "File", issuer: "Issuer", statusLabel: "Status", expiry: "Expiry", noExpiry: "No expiry defined" },
  fr: { title: "Centre de conformité", subtitleCompany: "Aptitude documentaire et certifications par travailleur et chantier.", subtitleWorker: "État de vos documents et certifications pour chaque chantier.", fit: "Apte", attention: "Attention", blocked: "Bloqué", compliant: "Conformité", checkInAllowed: "Pointage autorisé", checkInBlocked: "Pointage bloqué", issues: "Écarts", requirements: "Exigences", noIssues: "Aucun écart.", noRows: "Aucune donnée de conformité.", loading: "Calcul de la conformité...", retry: "Réessayer", missing: "Manquant", expired: "Expiré", expiring: "Expire bientôt", document: "Document", certificate: "Certificat", days: "jours", configure: "Configurer", configureTitle: "Exigences du chantier", configureSubtitle: "Définissez uniquement les éléments obligatoires avant l'accès au chantier.", requiredDocuments: "Documents obligatoires", requiredCertificates: "Certificats obligatoires", onePerLine: "Une exigence par ligne", save: "Enregistrer", close: "Fermer", openRecord: "Voir le dossier", sourceRecord: "Dossier associé", file: "Fichier", issuer: "Organisme émetteur", statusLabel: "Statut", expiry: "Validité", noExpiry: "Aucune date d'expiration" },
  es: { title: "Centro de Cumplimiento", subtitleCompany: "Aptitud documental y certificaciones por trabajador y obra.", subtitleWorker: "Estado de tus documentos y certificaciones para cada obra.", fit: "Apto", attention: "Atención", blocked: "Bloqueado", compliant: "Cumplimiento", checkInAllowed: "Check-in permitido", checkInBlocked: "Check-in bloqueado", issues: "Pendientes", requirements: "Requisitos", noIssues: "Sin pendientes.", noRows: "Sin datos de cumplimiento.", loading: "Calculando cumplimiento...", retry: "Intentar de nuevo", missing: "Falta", expired: "Caducado", expiring: "Próximo a caducar", document: "Documento", certificate: "Certificado", days: "días", configure: "Configurar", configureTitle: "Requisitos de la obra", configureSubtitle: "Define solo lo obligatorio antes de entrar en esta obra.", requiredDocuments: "Documentos obligatorios", requiredCertificates: "Certificados obligatorios", onePerLine: "Un requisito por línea", save: "Guardar requisitos", close: "Cerrar", openRecord: "Ver registro", sourceRecord: "Registro asociado", file: "Archivo", issuer: "Entidad emisora", statusLabel: "Estado", expiry: "Validez", noExpiry: "Sin caducidad definida" },
  ro: { title: "Centru de Conformitate", subtitleCompany: "Conformitate documentară și certificări pe lucrător și șantier.", subtitleWorker: "Starea documentelor și certificărilor tale pentru fiecare șantier.", fit: "Apt", attention: "Atenție", blocked: "Blocat", compliant: "Conformitate", checkInAllowed: "Check-in permis", checkInBlocked: "Check-in blocat", issues: "Probleme", requirements: "Cerințe", noIssues: "Fără probleme.", noRows: "Nu există date de conformitate.", loading: "Se calculează conformitatea...", retry: "Încearcă din nou", missing: "Lipsește", expired: "Expirat", expiring: "Expiră curând", document: "Document", certificate: "Certificat", days: "zile", configure: "Configurează", configureTitle: "Cerințele șantierului", configureSubtitle: "Definește doar cerințele obligatorii înainte de accesul pe șantier.", requiredDocuments: "Documente obligatorii", requiredCertificates: "Certificate obligatorii", onePerLine: "O cerință pe linie", save: "Salvează cerințele", close: "Închide", openRecord: "Vezi înregistrarea", sourceRecord: "Înregistrare asociată", file: "Fișier", issuer: "Emitent", statusLabel: "Stare", expiry: "Valabilitate", noExpiry: "Fără termen definit" },
  de: { title: "Compliance-Zentrale", subtitleCompany: "Dokumenten- und Zertifikatsstatus je Mitarbeiter und Baustelle.", subtitleWorker: "Status deiner Dokumente und Zertifikate für jede Baustelle.", fit: "Geeignet", attention: "Achtung", blocked: "Gesperrt", compliant: "Compliance", checkInAllowed: "Check-in erlaubt", checkInBlocked: "Check-in gesperrt", issues: "Offene Punkte", requirements: "Anforderungen", noIssues: "Keine offenen Punkte.", noRows: "Keine Compliance-Daten.", loading: "Compliance wird berechnet...", retry: "Erneut versuchen", missing: "Fehlt", expired: "Abgelaufen", expiring: "Läuft bald ab", document: "Dokument", certificate: "Zertifikat", days: "Tage", configure: "Konfigurieren", configureTitle: "Baustellenanforderungen", configureSubtitle: "Nur Pflichtanforderungen für den Zutritt zu dieser Baustelle festlegen.", requiredDocuments: "Pflichtdokumente", requiredCertificates: "Pflichtzertifikate", onePerLine: "Eine Anforderung pro Zeile", save: "Anforderungen speichern", close: "Schließen", openRecord: "Datensatz öffnen", sourceRecord: "Verknüpfter Datensatz", file: "Datei", issuer: "Aussteller", statusLabel: "Status", expiry: "Gültigkeit", noExpiry: "Keine Gültigkeit festgelegt" },
  nl: { title: "Compliancecentrum", subtitleCompany: "Document- en certificeringsstatus per werknemer en project.", subtitleWorker: "Status van je documenten en certificaten voor elk project.", fit: "Geschikt", attention: "Aandacht", blocked: "Geblokkeerd", compliant: "Compliance", checkInAllowed: "Check-in toegestaan", checkInBlocked: "Check-in geblokkeerd", issues: "Aandachtspunten", requirements: "Vereisten", noIssues: "Geen aandachtspunten.", noRows: "Geen compliancegegevens.", loading: "Compliance berekenen...", retry: "Opnieuw proberen", missing: "Ontbreekt", expired: "Verlopen", expiring: "Verloopt binnenkort", document: "Document", certificate: "Certificaat", days: "dagen", configure: "Configureren", configureTitle: "Projectvereisten", configureSubtitle: "Definieer alleen wat verplicht is voor toegang tot dit project.", requiredDocuments: "Verplichte documenten", requiredCertificates: "Verplichte certificaten", onePerLine: "Eén vereiste per regel", save: "Vereisten opslaan", close: "Sluiten", openRecord: "Record bekijken", sourceRecord: "Gekoppeld record", file: "Bestand", issuer: "Uitgever", statusLabel: "Status", expiry: "Geldigheid", noExpiry: "Geen vervaldatum ingesteld" },
};

export function complianceNavLabel(language: LanguageCode) { return copy[language].title; }
function statusColor(status: ComplianceStatus) { return status === "fit" ? workspaceColors.green : status === "attention" ? workspaceColors.yellow : workspaceColors.redSoft; }
function issueLabel(issue: ComplianceIssue, text: Copy) { return issue.code === "missing" ? text.missing : issue.code === "expired" ? text.expired : issue.code === "expiring" ? text.expiring : issue.code; }
function compactText(value: string | undefined) { return (value ?? "").trim().toLowerCase().replace(/\s+/g, " "); }
function parseRequirementInput(value: string) {
  const seen = new Set<string>();
  return value.split(/[\n,;]+/).map((item) => item.trim()).filter((item) => { if (!item) return false; const key = compactText(item); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 30);
}

export function ComplianceView() {
  const { user } = useAuth();
  const { state, language, updateProject } = useWorklyData();
  const { width } = useWindowDimensions();
  const [payload, setPayload] = useState<CompliancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [documentsInput, setDocumentsInput] = useState("");
  const [certificatesInput, setCertificatesInput] = useState("");
  const [savingRequirements, setSavingRequirements] = useState(false);
  const [sourceRecord, setSourceRecord] = useState<SourceRecord | null>(null);
  const text = copy[language];
  const compact = width < 760;
  const accent = roleAccent(user?.role ?? "worker");
  const canManageRequirements = Boolean(user?.role === "company" && user.permissions?.includes("projects.manage"));

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setPayload(await api.get<CompliancePayload>("/compliance")); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "WORKLY"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const selectedRow = useMemo(() => !payload?.rows.length ? null : payload.rows.find((row) => `${row.worker_id}:${row.project_id}` === selected) ?? payload.rows[0], [payload, selected]);
  const selectedWorker = useMemo(() => state?.workers.find((worker) => worker.id === selectedRow?.worker_id), [selectedRow?.worker_id, state?.workers]);
  const findSourceRecord = useCallback((issue: ComplianceIssue): SourceRecord | null => {
    if (!selectedWorker || issue.code === "missing") return null;
    if (issue.kind === "document") {
      const item = selectedWorker.documents.find((document) => compactText(document.category) === compactText(issue.requirement));
      return item ? { kind: "document", item } : null;
    }
    const required = compactText(issue.requirement);
    const item = selectedWorker.certificates.find((certificate) => { const name = compactText(certificate.name); return name.includes(required) || required.includes(name); });
    return item ? { kind: "certificate", item } : null;
  }, [selectedWorker]);

  const openRequirements = () => {
    if (!selectedRow) return;
    setDocumentsInput(selectedRow.requirements.documents.join("\n"));
    setCertificatesInput(selectedRow.requirements.certificates.join("\n"));
    setRequirementsOpen(true);
  };
  const saveRequirements = async () => {
    if (!selectedRow || savingRequirements) return;
    setSavingRequirements(true);
    try {
      await updateProject(selectedRow.project_id, { compliance_requirements: { documents: parseRequirementInput(documentsInput), certificates: parseRequirementInput(certificatesInput) } });
      await load(); setRequirementsOpen(false);
    } finally { setSavingRequirements(false); }
  };

  if (loading && !payload) return <View style={styles.center}><ActivityIndicator color={accent} size="large" /><Text style={styles.muted}>{text.loading}</Text></View>;
  if (error && !payload) return <View style={styles.center}><Ionicons name="warning-outline" color={workspaceColors.redSoft} size={30} /><Text style={styles.muted}>{error}</Text><Pressable onPress={() => void load()} style={[styles.retry, { borderColor: accent }]}><Text style={{ color: accent, fontWeight: "800" }}>{text.retry}</Text></Pressable></View>;
  if (!payload) return null;

  const summary = payload.summary;
  return <>
    <ScrollView contentContainerStyle={[styles.page, compact ? styles.pageCompact : null]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View style={{ flex: 1 }}><Text style={sharedStyles.title}>{text.title}</Text><Text style={sharedStyles.subtitle}>{user?.role === "company" ? text.subtitleCompany : text.subtitleWorker}</Text></View></View>
      <View style={styles.metrics}>
        <MetricCard icon="shield-checkmark-outline" label={text.fit} value={summary.fit} detail={text.checkInAllowed} accent={workspaceColors.green} />
        <MetricCard icon="warning-outline" label={text.attention} value={summary.attention} detail={text.compliant} accent={workspaceColors.yellow} />
        <MetricCard icon="close-circle-outline" label={text.blocked} value={summary.blocked} detail={text.checkInBlocked} accent={workspaceColors.redSoft} />
        <MetricCard icon="people-outline" label={text.compliant} value={`${summary.fit}/${summary.total}`} detail={`${summary.total}`} accent={accent} />
      </View>
      {!payload.rows.length ? <Card><EmptyState icon="shield-outline" title={text.noRows} /></Card> : <View style={[styles.grid, compact ? styles.gridCompact : null]}>
        <Card style={styles.listCard}><SectionTitle title={user?.role === "company" ? text.compliant : text.requirements} /><View style={{ gap: 8, marginTop: 14 }}>{payload.rows.map((row) => { const key = `${row.worker_id}:${row.project_id}`; const active = selectedRow ? key === `${selectedRow.worker_id}:${selectedRow.project_id}` : false; const color = statusColor(row.status); return <Pressable key={key} onPress={() => setSelected(key)} style={[styles.row, active ? { borderColor: `${color}88`, backgroundColor: `${color}0E` } : null]}><Avatar name={row.worker_name} size={38} accent={color} /><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.name} numberOfLines={1}>{row.worker_name}</Text><Text style={styles.meta} numberOfLines={1}>{row.project_name}</Text></View><View style={styles.score}><Text style={[styles.scoreValue, { color }]}>{row.score}%</Text><Text style={[styles.status, { color }]}>{text[row.status]}</Text></View></Pressable>; })}</View></Card>
        {selectedRow ? <Card accent={statusColor(selectedRow.status)} style={styles.detailCard}>
          <View style={styles.detailHeader}><View style={{ flex: 1 }}><Text style={styles.detailTitle}>{selectedRow.worker_name}</Text><Text style={styles.meta}>{selectedRow.worker_profession} · {selectedRow.project_name}</Text></View><View style={[styles.bigStatus, { borderColor: statusColor(selectedRow.status) }]}><Ionicons name={selectedRow.fit_for_check_in ? "shield-checkmark-outline" : "close-circle-outline"} size={18} color={statusColor(selectedRow.status)} /><Text style={{ color: statusColor(selectedRow.status), fontWeight: "900", fontSize: 11 }}>{selectedRow.fit_for_check_in ? text.checkInAllowed : text.checkInBlocked}</Text></View></View>
          <View style={styles.divider} /><SectionTitle title={text.issues} subtitle={`${selectedRow.score}%`} />
          <View style={{ gap: 8, marginTop: 12 }}>{selectedRow.issues.length ? selectedRow.issues.map((issue, index) => { const color = issue.severity === "blocked" ? workspaceColors.redSoft : workspaceColors.yellow; const source = findSourceRecord(issue); return <Pressable key={`${issue.kind}-${issue.requirement}-${index}`} disabled={!source} onPress={() => source && setSourceRecord(source)} style={({ pressed }) => [styles.issue, source ? styles.issueInteractive : null, pressed ? { opacity: 0.72 } : null]}><Ionicons name={issue.kind === "certificate" ? "ribbon-outline" : "document-text-outline"} size={18} color={color} /><View style={{ flex: 1 }}><Text style={styles.issueTitle}>{issue.label}</Text><Text style={styles.meta}>{issue.kind === "certificate" ? text.certificate : text.document} · {issueLabel(issue, text)}{issue.days_remaining !== null ? ` · ${issue.days_remaining} ${text.days}` : ""}{issue.expires_at ? ` · ${new Date(issue.expires_at).toLocaleDateString(localeForLanguage(language))}` : ""}</Text></View>{source ? <View style={styles.recordLink}><Text style={[styles.recordLinkText, { color }]}>{text.openRecord}</Text><Ionicons name="chevron-forward" size={15} color={color} /></View> : null}</Pressable>; }) : <View style={styles.okBox}><Ionicons name="checkmark-circle-outline" size={20} color={workspaceColors.green} /><Text style={{ color: workspaceColors.green, fontWeight: "800" }}>{text.noIssues}</Text></View>}</View>
          <View style={styles.divider} /><View style={styles.requirementsHeader}><SectionTitle title={text.requirements} />{canManageRequirements ? <Button compact label={text.configure} icon="options-outline" accent={accent} onPress={openRequirements} /> : null}</View>
          <View style={styles.requirements}>{selectedRow.requirements.documents.map((item) => <View key={`d-${item}`} style={styles.req}><Ionicons name="document-outline" size={14} color={workspaceColors.textSoft} /><Text style={styles.reqText}>{item}</Text></View>)}{selectedRow.requirements.certificates.map((item) => <View key={`c-${item}`} style={styles.req}><Ionicons name="ribbon-outline" size={14} color={workspaceColors.textSoft} /><Text style={styles.reqText}>{item}</Text></View>)}</View>
        </Card> : null}
      </View>}
    </ScrollView>
    <ModalPanel visible={requirementsOpen} onClose={() => setRequirementsOpen(false)} title={text.configureTitle} subtitle={selectedRow ? `${selectedRow.project_name} · ${text.configureSubtitle}` : text.configureSubtitle} footer={<><Button label={text.close} variant="ghost" onPress={() => setRequirementsOpen(false)} /><Button label={text.save} icon="checkmark" accent={accent} loading={savingRequirements} onPress={() => void saveRequirements()} /></>}><View style={styles.editorBody}><Field label={`${text.requiredDocuments} · ${text.onePerLine}`} multiline value={documentsInput} onChangeText={setDocumentsInput} /><Field label={`${text.requiredCertificates} · ${text.onePerLine}`} multiline value={certificatesInput} onChangeText={setCertificatesInput} /></View></ModalPanel>
    <ModalPanel visible={Boolean(sourceRecord)} onClose={() => setSourceRecord(null)} title={text.sourceRecord} subtitle={sourceRecord?.kind === "certificate" ? text.certificate : text.document} footer={<Button label={text.close} variant="secondary" onPress={() => setSourceRecord(null)} />}>{sourceRecord ? <SourceRecordView record={sourceRecord} text={text} language={language} /> : null}</ModalPanel>
  </>;
}

function SourceRecordView({ record, text, language }: { record: SourceRecord; text: Copy; language: LanguageCode }) {
  const item = record.item; const expiry = record.kind === "certificate" ? record.item.expires_at : undefined; const title = record.kind === "certificate" ? record.item.name : record.item.title;
  return <View style={styles.sourceBody}><Text style={styles.sourceTitle}>{title}</Text><InfoLine label={text.file} value={record.item.file_name} /><InfoLine label={text.statusLabel} value={item.status} />{record.kind === "certificate" ? <InfoLine label={text.issuer} value={record.item.issuer} /> : null}<InfoLine label={text.expiry} value={expiry ? new Date(expiry).toLocaleDateString(localeForLanguage(language)) : text.noExpiry} />{record.kind === "document" && record.item.demo_content ? <View style={styles.preview}><Text style={styles.previewText}>{record.item.demo_content}</Text></View> : null}</View>;
}
function InfoLine({ label, value }: { label: string; value: string }) { return <View style={styles.infoLine}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value || "—"}</Text></View>; }

const styles = StyleSheet.create({
  page: { padding: 22, paddingBottom: 150, gap: 18 }, pageCompact: { paddingHorizontal: 14, paddingTop: 16 }, header: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, grid: { flexDirection: "row", gap: 14, alignItems: "flex-start" }, gridCompact: { flexDirection: "column" }, listCard: { flex: 0.9, minWidth: 300 }, detailCard: { flex: 1.15, minWidth: 0 }, row: { minHeight: 60, borderRadius: 13, borderWidth: 1, borderColor: workspaceColors.line, padding: 10, flexDirection: "row", alignItems: "center", gap: 10 }, name: { color: workspaceColors.text, fontSize: 13, fontWeight: "800" }, meta: { color: workspaceColors.muted, fontSize: 11, lineHeight: 16 }, score: { alignItems: "flex-end", gap: 1 }, scoreValue: { fontSize: 14, fontWeight: "900" }, status: { fontSize: 9, fontWeight: "800", textTransform: "uppercase" }, detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, detailTitle: { color: workspaceColors.text, fontSize: 18, lineHeight: 24, fontWeight: "900" }, bigStatus: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, minHeight: 34, flexDirection: "row", alignItems: "center", gap: 6 }, divider: { height: 1, backgroundColor: workspaceColors.line, marginVertical: 16 }, issue: { borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 12, padding: 11, flexDirection: "row", alignItems: "center", gap: 10 }, issueInteractive: { backgroundColor: "rgba(255,255,255,0.018)" }, issueTitle: { color: workspaceColors.textSoft, fontSize: 12, lineHeight: 17, fontWeight: "800" }, recordLink: { flexDirection: "row", alignItems: "center", gap: 3 }, recordLinkText: { fontSize: 10, fontWeight: "800" }, okBox: { borderWidth: 1, borderColor: `${workspaceColors.green}44`, backgroundColor: `${workspaceColors.green}0D`, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }, requirementsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, requirements: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }, req: { borderRadius: 999, borderWidth: 1, borderColor: workspaceColors.line, paddingHorizontal: 9, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 5 }, reqText: { color: workspaceColors.textSoft, fontSize: 10, fontWeight: "700" }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }, muted: { color: workspaceColors.muted, fontSize: 12, textAlign: "center" }, retry: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8 }, editorBody: { gap: 14 }, sourceBody: { gap: 10 }, sourceTitle: { color: workspaceColors.text, fontSize: 17, fontWeight: "900", marginBottom: 4 }, infoLine: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: workspaceColors.line }, infoLabel: { color: workspaceColors.muted, fontSize: 11, fontWeight: "700" }, infoValue: { color: workspaceColors.textSoft, fontSize: 11, fontWeight: "700", textAlign: "right", flex: 1 }, preview: { marginTop: 6, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 12, padding: 12, backgroundColor: "rgba(255,255,255,0.018)" }, previewText: { color: workspaceColors.textSoft, fontSize: 12, lineHeight: 19 },
});
