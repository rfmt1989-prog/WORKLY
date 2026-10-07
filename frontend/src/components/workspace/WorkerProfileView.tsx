import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { openWorklyFile } from "@/src/api/documentFiles";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";
import { uiText } from "@/src/demo/fullUi";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { LanguageCode } from "@/src/demo/types";
import { Avatar, Button, ModalPanel, StatusPill, workspaceColors } from "./primitives";
import { WorkerProfileBackdrop } from "./WorkerProfileBackdrop";
import { WorkerCertificateEditor, WorkerIdentityEditor } from "./WorkerProfileEditors";
import { WorkerProgressPath } from "./WorkerProgressPath";
import { JourneyStatus, JourneySymbol, WorkerJourneyTree } from "./WorkerJourneyTree";
import { buildProfessionTrees, buildWorkerCertificateNodes, isCompleted, type AchievementNode } from "./workerCertificateTree";

const accent = workspaceColors.blue;
const serif = Platform.OS === "android" ? "serif" : "Georgia";

export function WorkerProfileView() {
  const { user } = useAuth();
  const { state, language, error } = useWorklyData();
  const { width } = useWindowDimensions();
  const compact = width < 960;
  const narrow = width < 600;
  const [selected, setSelected] = useState<AchievementNode | null>(null);
  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState(false);
  const [rules, setRules] = useState(false);
  const [certificateTarget, setCertificateTarget] = useState<{ professionId: string; node?: AchievementNode } | null>(null);
  const worker = state?.workers.find(item => item.id === user?.id);
  const achievements = useMemo(() => worker ? buildWorkerCertificateNodes(worker) : [], [worker]);
  const trees = useMemo(() => worker ? buildProfessionTrees(worker, achievements) : [], [worker, achievements]);
  const byId = useMemo(() => new Map([...achievements, ...trees.flatMap(tree => [tree.root, ...tree.nodes])].map(node => [node.id, node])), [achievements, trees]);
  const text = (pt: string, en: string) => uiText(language, pt, en);
  if (!worker) return <View style={styles.loading}><ActivityIndicator color={accent} /><Text style={styles.muted}>{error || copy[language].loading}</Text></View>;
  const primaryTree = trees[0];
  const identity = worker.professional_identity;
  const education = achievements.find(node => node.id === "course" && isCompleted(node.status) && !primaryTree?.certifications.some(item => item.id === node.id));

  return (
    <View style={styles.root} testID="worker-profile">
      <WorkerProfileBackdrop />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, compact && styles.contentCompact]}>
        <View style={[styles.layout, compact && styles.layoutCompact]}>
          <View style={[styles.identity, compact && styles.identityCompact]} testID="worker-identification">
            <View style={[styles.identityHero, compact && styles.heroCompact]}>
              <Avatar name={worker.name} source={worker.avatar} size={compact ? 72 : 104} />
              <View style={[styles.identityHeading, compact && styles.headingCompact]}>
                <Text style={styles.eyebrow}>{text("Identidade profissional", "Professional identity")}</Text>
                <Text style={[styles.name, compact && styles.nameCompact]}>{worker.name}</Text>
                <Text style={[styles.profession, compact && styles.professionCompact]}>{localizeDemoText(language, worker.profession)}</Text>
                <StatusPill status={worker.status} label={worker.status === "on_site" ? copy[language].onSite : worker.status === "contracted" ? copy[language].contracted : copy[language].available} />
              </View>
            </View>
            <View style={styles.divider}><View style={styles.dividerLine} /><View style={styles.dividerDiamond} /><View style={styles.dividerLine} /></View>
            <View style={[styles.identityRows, compact && styles.identityRowsCompact]}>
              <IdentityRow icon="construct-outline" label={text("Experiência", "Experience")} value={`${worker.experience_years} ${text("anos", "years")}`} />
              <IdentityRow icon="location-outline" label={text("Localização", "Location")} value={`${worker.flag} ${worker.location}`} />
              <IdentityRow icon="language-outline" label={text("Idiomas", "Languages")} value={worker.languages.map(item => localizeDemoText(language, item)).join(" · ") || "—"} />
              <IdentityRow icon="calendar-outline" label={text("Novas obras", "New projects")} value={worker.availability ? text("Disponível", "Available") : text("Indisponível", "Unavailable")} />
            </View>
            <Button label={text("Editar perfil", "Edit profile")} icon="create-outline" variant="secondary" onPress={() => setEditing(true)} style={styles.editButton} testID="edit-worker-profile" />
            <Pressable accessibilityRole="button" onPress={() => setAbout(true)} style={({ pressed }) => [styles.aboutButton, pressed && styles.pressed]}><Text style={styles.aboutLabel}>{text("Sobre e contactos", "About and contacts")}</Text><Ionicons name="arrow-forward-outline" size={14} color="#89A5BC" /></Pressable>
            <Text style={styles.identityCode}>ID · {worker.id}</Text>
          </View>
          <View style={styles.main}>
            <View style={[styles.mainHeader, narrow && styles.mainHeaderNarrow]}>
              <View style={styles.headingWrap}><Text style={styles.eyebrow}>{text("A tua evolução", "Your progression")}</Text><Text style={[styles.title, narrow && styles.titleCompact]}>{text("Percurso profissional", "Professional journey")}</Text></View>
              {identity ? <View style={styles.scoreBadge}><Text style={styles.scoreValue}>{identity.score}<Text style={styles.scoreMaximum}>/100</Text></Text><Text style={styles.scoreLabel}>{text("Valor profissional", "Professional value")}</Text></View> : null}
            </View>
            {identity ? <WorkerProgressPath identity={identity} language={language} vertical={narrow} onRules={() => setRules(true)} /> : null}
            <View style={styles.journey}>
              <View style={styles.actionRow}>
                <Text style={styles.journeyHint}>
                  {text(
                    "Certificações e competências ligadas à tua profissão, numa única linha de evolução.",
                    "Certifications and skills connected to your profession in one progression line.",
                  )}
                </Text>
                <Button
                  label={text("Adicionar comprovativo", "Add evidence")}
                  icon="add-outline"
                  variant="secondary"
                  onPress={() =>
                    setCertificateTarget({
                      professionId: primaryTree?.id || "professional",
                    })
                  }
                  style={styles.addButton}
                  testID="add-worker-certificate"
                />
              </View>
              {primaryTree ? (
                <WorkerJourneyTree
                  key={primaryTree.id}
                  tree={primaryTree}
                  language={language}
                  stacked={width < 720}
                  onNode={setSelected}
                />
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
      {rules && identity ? <ModalPanel visible onClose={() => setRules(false)} title={text("Como evoluir", "How to progress")} subtitle={text("A confirmação dos comprovativos atribui pontos.", "Confirmed evidence earns points.")}>
        <View style={styles.ruleList}>{identity.components.map(part => <View key={part.id} style={styles.ruleItem}><Text style={styles.ruleTitle}>{text(part.label, part.label_en)}</Text><Text style={styles.ruleValue}>{part.points}/{part.maximum}</Text><Text style={styles.detailNote}>{part.count} {text("confirmados", "confirmed")} · {part.points_each} {text("pontos por registo", "points per record")}</Text></View>)}<Text style={styles.detailNote}>{text("Só contam comprovativos verificados, dentro da validade e ligados à profissão principal. O nível Workly é uma classificação interna.", "Only verified, current evidence in the primary trade counts. The Workly level is an internal classification.")}</Text></View>
      </ModalPanel> : null}
      {about ? <ModalPanel visible onClose={() => setAbout(false)} title={text("Sobre e contactos", "About and contacts")}><View style={styles.detailContent}>
        <Text style={styles.detailText}>{localizeDemoText(language, worker.bio)}</Text>
        {education ? <Pressable accessibilityRole="button" onPress={() => { setAbout(false); setSelected(education); }} style={styles.education}><Ionicons name="school-outline" size={20} color="#8ABAED" /><Text style={styles.detailText}>{localizeDemoText(language, education.title)}</Text><Ionicons name="chevron-forward-outline" size={14} color="#8ABAED" /></Pressable> : null}
        <DetailRow label="Email" value={worker.email} /><DetailRow label={text("Telefone", "Phone")} value={worker.phone || "—"} />
      </View></ModalPanel> : null}
      {selected ? <CertificateDetails node={selected} byId={byId} language={language} onClose={() => setSelected(null)} onAssociate={() => { setCertificateTarget({ professionId: primaryTree?.id || "professional", node: selected }); setSelected(null); }} /> : null}
      {editing ? <WorkerIdentityEditor worker={worker} onClose={() => setEditing(false)} /> : null}
      {certificateTarget ? <WorkerCertificateEditor worker={worker} {...certificateTarget} onClose={() => setCertificateTarget(null)} /> : null}
    </View>
  );
}

function IdentityRow({ icon, label, value }: { icon: AchievementNode["icon"]; label: string; value: string }) {
  return <View style={styles.identityRow}><Ionicons name={icon} size={16} color="#80B2E5" /><View style={styles.identityField}><Text style={styles.identityLabel}>{label}</Text><Text style={styles.identityValue}>{value}</Text></View></View>;
}

function CertificateDetails({
  node,
  byId,
  language,
  onClose,
  onAssociate,
}: {
  node: AchievementNode;
  byId: Map<string, AchievementNode>;
  language: LanguageCode;
  onClose: () => void;
  onAssociate: () => void;
}) {
  const { notify } = useWorklyData();
  const fileId = node.certificate?.file_id || node.evidence?.file_id;
  const text = (pt: string, en: string) => uiText(language, pt, en);
  const openFile = async () => {
    try {
      await openWorklyFile(fileId!);
    } catch {
      notify(
        text(
          "Não foi possível abrir o comprovativo.",
          "Could not open the evidence file.",
        ),
        "error",
      );
    }
  };
  const related = (node.dependsOn || [])
    .map((id) => byId.get(id)?.title)
    .filter(Boolean);
  return (
    <ModalPanel
      visible
      onClose={onClose}
      title={localizeDemoText(language, node.title)}
      subtitle={localizeDemoText(language, node.subtitle)}
      footer={
        <>
          {fileId ? (
            <Button
              label={text("Abrir comprovativo", "Open evidence")}
              icon="open-outline"
              onPress={() => void openFile()}
            />
          ) : null}
          <Button
            label={text("Associar certificado", "Associate certificate")}
            icon="attach-outline"
            variant="secondary"
            onPress={onAssociate}
          />
        </>
      }
    >
      <View style={styles.detailContent}>
        <View style={styles.detailSymbol}>
          <JourneySymbol node={node} large />
          <JourneyStatus node={node} language={language} />
        </View>
        <Text style={styles.sectionLabel}>{text("Âmbito", "Scope")}</Text>
        <Text style={styles.detailText}>
          {localizeDemoText(language, node.scope)}
        </Text>
        {node.certificate ? (
          <View style={styles.detailsGrid}>
            <DetailRow
              label={text("Entidade", "Issuer")}
              value={node.certificate.issuer || "—"}
            />
            <DetailRow
              label={text("Emissão", "Issued")}
              value={node.certificate.issued_at || "—"}
            />
            <DetailRow
              label={text("Validade", "Expiry")}
              value={node.certificate.expires_at || "—"}
            />
            <DetailRow
              label={text("Ficheiro", "File")}
              value={node.certificate.file_name || "—"}
            />
          </View>
        ) : null}
        {!node.certificate &&
          node.meta?.map((item) => (
            <Text key={item} style={styles.detailText}>
              {localizeDemoText(language, item)}
            </Text>
          ))}
        {node.verificationNote ? (
          <Text style={styles.detailNote}>
            {localizeDemoText(language, node.verificationNote)}
          </Text>
        ) : null}
        {related.length ? (
          <View style={styles.related}>
            <Text style={styles.sectionLabel}>
              {text("Percurso associado", "Related journey")}
            </Text>
            <Text style={styles.detailText}>{related.join(" · ")}</Text>
            <Text style={styles.detailNote}>
              {text(
                "A sequência visual organiza a formação e não substitui os requisitos da entidade emissora.",
                "The visual sequence organizes training and does not replace issuer requirements.",
              )}
            </Text>
          </View>
        ) : null}
      </View>
    </ModalPanel>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.identityLabel}>{label}</Text>
      <Text style={styles.identityValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: "#080E15" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  content: { padding: 28, paddingBottom: 32 },
  contentCompact: { padding: 16, paddingBottom: 24 },
  layout: { width: "100%", maxWidth: 1600, alignSelf: "center", flexDirection: "row", alignItems: "flex-start", gap: 28 },
  layoutCompact: { flexDirection: "column", gap: 24 },
  identity: { width: 284, flexShrink: 0, padding: 22, borderWidth: 1, borderColor: "#1D3A52", backgroundColor: "#08131CE8", borderRadius: 18, shadowColor: "#2388FF", shadowOpacity: .08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  identityCompact: { width: "100%", padding: 18, borderRadius: 16 },
  identityHero: { alignItems: "center", gap: 18 },
  heroCompact: { flexDirection: "row", alignItems: "center", gap: 18 },
  identityHeading: { width: "100%", alignItems: "center", gap: 8 },
  headingCompact: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  eyebrow: { color: "#78A9D8", fontSize: 10, lineHeight: 16, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: "600" },
  name: { color: "#ECE8DF", fontFamily: serif, fontSize: 26, lineHeight: 34, textAlign: "center" },
  nameCompact: { fontSize: 23, lineHeight: 30, textAlign: "left" },
  profession: { color: "#B1C2D2", fontSize: 12, lineHeight: 19, textAlign: "center", flexShrink: 1 },
  professionCompact: { textAlign: "left" },
  divider: { marginVertical: 22, flexDirection: "row", gap: 8, alignItems: "center" },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#20394E" },
  dividerDiamond: { width: 5, height: 5, borderWidth: 1, borderColor: "#7998B5", transform: [{ rotate: "45deg" }] },
  identityRows: { gap: 18 },
  identityRowsCompact: { flexDirection: "row", flexWrap: "wrap", columnGap: 18, rowGap: 16 },
  identityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, flexShrink: 1, minWidth: 100 },
  identityField: { flex: 1, minWidth: 0, gap: 4 },
  identityLabel: { color: "#7D98B0", fontSize: 10, lineHeight: 15, minWidth: 60 },
  identityValue: { color: "#BDCCDA", fontSize: 12, lineHeight: 19, flexShrink: 1 },
  identityCode: { color: "#6C869E", fontSize: 10, lineHeight: 17, textAlign: "center", marginTop: 12, letterSpacing: .5 },
  editButton: { marginTop: 24, borderRadius: 6, borderColor: "#355875", minHeight: 42 },
  aboutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, minHeight: 42, marginTop: 4 },
  aboutLabel: { color: "#8BA5BC", fontSize: 11 },
  main: { flex: 1, minWidth: 0, width: "100%", gap: 18 },
  mainHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 },
  mainHeaderNarrow: { flexWrap: "nowrap", gap: 10 },
  headingWrap: { flexGrow: 1, flexShrink: 1, gap: 4 },
  title: { color: "#ECE8DF", fontFamily: serif, fontSize: 34, lineHeight: 44 },
  titleCompact: { fontSize: 27, lineHeight: 35 },
  scoreBadge: { alignItems: "flex-end", gap: 3, paddingVertical: 6, paddingLeft: 16, borderLeftWidth: 1, borderColor: "#284965" },
  scoreValue: { color: "#8FC1F8", fontSize: 30, lineHeight: 36, fontWeight: "600" },
  scoreMaximum: { color: "#7F9BB4", fontSize: 15 },
  scoreLabel: { color: "#90A7BC", fontSize: 10, lineHeight: 15 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 20, borderBottomWidth: 1, borderColor: "#293F53" },
  tab: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, paddingHorizontal: 2, borderBottomWidth: 2, borderColor: "transparent" },
  tabActive: { borderColor: "#438ED8" },
  tabText: { color: "#8298AC", fontSize: 12 },
  tabTextActive: { color: "#DAE8F6" },
  journey: { gap: 15 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 },
  journeyHint: { color: "#879EB1", fontSize: 12, lineHeight: 19, flexShrink: 1 },
  addButton: { minHeight: 40, borderRadius: 6 },
  portfolio: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  portfolioItem: { width: "100%", flexGrow: 1, minWidth: 0, padding: 20, gap: 12, borderRadius: 9, borderWidth: 1, borderColor: "#2B4054", backgroundColor: "#0C1925DB" },
  projectHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  portfolioTitle: { flex: 1, minWidth: 0, color: "#E0E8F0", fontFamily: serif, fontSize: 22, lineHeight: 29 },
  projectYear: { color: "#91ADC6", fontSize: 13 },
  projectLocation: { color: "#8CA4BA", fontSize: 12, lineHeight: 19 },
  projectSummary: { color: "#B3C3D2", fontSize: 13, lineHeight: 22 },
  projectStatus: { flexDirection: "row", alignItems: "center", gap: 7, borderTopWidth: 1, borderColor: "#253E55", paddingTop: 12 },
  muted: { color: workspaceColors.muted, fontSize: 12, lineHeight: 19 },
  pressed: { opacity: .72 },
  ruleList: { gap: 16 },
  ruleItem: { padding: 16, gap: 8, borderWidth: 1, borderColor: "#2B4055", borderRadius: 8, backgroundColor: "#0B1928" },
  ruleTitle: { color: "#BFCEDF", fontSize: 13, lineHeight: 20 },
  ruleValue: { color: "#8FC0F6", fontSize: 24, fontWeight: "600" },
  detailContent: { gap: 18 },
  detailSymbol: { alignItems: "center", gap: 8, paddingBottom: 12 },
  sectionLabel: { color: "#BDCADA", fontSize: 11, lineHeight: 17, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  detailText: { color: "#BCCCDC", fontSize: 13, lineHeight: 22 },
  detailNote: { color: "#8FA4B9", fontSize: 12, lineHeight: 20 },
  detailsGrid: { gap: 14, padding: 16, borderWidth: 1, borderColor: "#2A3F54", borderRadius: 7 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  related: { gap: 10, borderTopWidth: 1, borderColor: "#2A3F54", paddingTop: 18 },
  education: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46, paddingVertical: 10, flexWrap: "wrap" },
});
