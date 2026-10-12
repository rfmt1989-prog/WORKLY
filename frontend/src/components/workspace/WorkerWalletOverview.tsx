import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { openWorklyFile } from "@/src/api/documentFiles";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { localeForLanguage } from "@/src/demo/fullUi";
import { levelText, professionalText } from "@/src/demo/professionalI18n";
import type { LanguageCode, WalletRequirement, Worker } from "@/src/demo/types";
import { Button, ModalPanel } from "./primitives";
import { DocumentUploadButton } from "./DocumentUploadButton";
import { workerFormationNodes } from "./WorkerFormationPath";
import type { AchievementNode } from "./workerCertificateTree";
import type { WorkerCompetencyAssessment } from "./workerCompetencyEngine";
import { requirementStatus, requirementTitle, walletText } from "./walletI18n";

const blue = "#83BDFF";
const green = "#7DD5AC";
const amber = "#E5C57D";
const red = "#F49C9C";

export function walletStatusColor(status: string) {
  return status === "verified" || status === "fit" || status === "ready" ? green : ["expired", "rejected", "invalid", "blocked", "unfit", "conditional"].includes(status) ? red : amber;
}

export function WorkerWalletOverview({ worker, assessment, language, onOpenJourney, onOpenAttendance, onOpenProjects, onOpenDocuments, onFormationNode }: {
  worker: Worker;
  assessment: WorkerCompetencyAssessment | null;
  language: LanguageCode;
  onOpenJourney?: () => void;
  onOpenAttendance?: () => void;
  onOpenProjects?: () => void;
  onOpenDocuments?: () => void;
  onFormationNode: (node: AchievementNode) => void;
}) {
  const { state, notify } = useWorklyData();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const wallet = worker.professional_wallet;
  const t = (key: Parameters<typeof walletText>[1]) => walletText(language, key);
  if (!wallet) return <ActivityIndicator color={blue} />;
  const project = state?.projects.find(item => item.id === wallet.project_id);
  const nodes = workerFormationNodes(worker, language);
  const selected = wallet.requirements.find(item => `${item.kind}:${item.requirement}` === selectedKey);
  const selectedTitle = selected ? requirementTitle(language, selected) : "";
  const date = (value: string) => new Date(value).toLocaleDateString(localeForLanguage(language), { day: "2-digit", month: "short", year: "numeric" });
  const openFile = async (fileId: string) => {
    try { await openWorklyFile(fileId); }
    catch { notify(t("fileFailed"), "error"); }
  };

  return <View style={styles.overview} testID="worker-wallet-overview">
    <View style={styles.panel} testID="wallet-journey-summary">
      <View style={styles.heading}>
        <View style={styles.headingCopy}><Text style={styles.eyebrow}>{t("journey")}</Text><Text style={styles.title}>{assessment ? levelText(language, assessment.levelId, assessment.levelLabel, assessment.levelLabelEn) : t("foundation")}</Text></View>
        <Pressable accessibilityRole="button" onPress={onOpenJourney} style={styles.value}><Text style={styles.score}>{assessment?.score ?? 0}<Text style={styles.maximum}>/100</Text></Text><Text style={styles.valueLabel}>WORKLY VALUE</Text></Pressable>
      </View>
      <View style={styles.foundation}>
        {nodes.map((node, index) => <Pressable key={node.id} accessibilityRole="button" accessibilityLabel={`${index === 0 ? t("course") : t("internship")}: ${node.status === "verified" ? t("verified") : node.certificate ? t("review") : t("missing")}`} onPress={() => onFormationNode(node)} style={({ pressed }) => [styles.foundationRow, pressed && styles.pressed]}>
          <Ionicons name={node.status === "verified" ? "checkmark-circle-outline" : node.icon} size={19} color={node.status === "verified" ? green : blue} />
          <View style={styles.rowCopy}><Text style={styles.rowTitle}>{index === 0 ? t("course") : t("internship")}</Text><Text style={styles.rowHint}>{node.status === "verified" ? t("verified") : node.certificate ? t("review") : t("missing")}</Text></View>
          <Ionicons name="chevron-forward" size={15} color="#6E8BA4" />
        </Pressable>)}
      </View>
      <View style={styles.metrics}>
        <Metric value={`${wallet.verified_hours} h`} label={t("hours")} />
        <Metric value={String(wallet.completed_projects)} label={t("works")} />
        <Metric value={String(wallet.check_in_count)} label={t("checkins")} />
      </View>
      {wallet.pending_hours > 0 ? <Text style={styles.note}>{t("pendingHours")}: {wallet.pending_hours} h</Text> : null}
      <Text style={styles.note}>{t("historyNote")}</Text>
      {!worker.profession ? <Text style={styles.note}>{t("chooseProfession")}</Text> : null}
      <Link label={professionalText(language, "Abrir percurso", "Open journey")} onPress={onOpenJourney} />
    </View>

    <View style={styles.panel} testID="wallet-site-summary">
      <View style={styles.heading}><Ionicons name="business-outline" size={23} color={blue} /><View style={styles.headingCopy}><Text style={styles.eyebrow}>{t("activeSite")}</Text><Text style={styles.title}>{project?.name || t("noSite")}</Text></View>{wallet.active_attendance_id ? <View style={styles.liveDot} /> : null}</View>
      {project ? <>
        <Text style={styles.note}>{project.location}</Text>
        <Text style={[styles.siteStatus, { color: walletStatusColor(wallet.status) }]}>{project.status !== "active" ? t("siteInactive") : t(wallet.status)}</Text>
        {wallet.check_in_at ? <Text style={styles.note}>{t("session")} {new Date(wallet.check_in_at).toLocaleString(localeForLanguage(language), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text> : null}
        <Button label={wallet.active_attendance_id ? t("checkout") : t("openCheckin")} icon={wallet.active_attendance_id ? "exit-outline" : "location-outline"} onPress={onOpenAttendance || (() => {})} accent="#387FF4" testID="wallet-open-checkin" />
      </> : <Text style={styles.note}>{t("assignedNote")}</Text>}
      <Link label={t("allWorks")} onPress={onOpenProjects} />
    </View>

    <View style={styles.panel} testID="wallet-document-checklist">
      <View style={styles.heading}><Ionicons name="shield-checkmark-outline" size={23} color={blue} /><View style={styles.headingCopy}><Text style={styles.eyebrow}>{t("documents")}</Text><Text style={styles.title}>{wallet.valid_count}/{wallet.total_count} <Text style={styles.counterLabel}>{t("confirmed")}</Text></Text></View></View>
      <View style={styles.requirements}>
        {wallet.requirements.map(item => <RequirementRow key={`${item.kind}:${item.requirement}`} item={item} language={language} onPress={() => setSelectedKey(`${item.kind}:${item.requirement}`)} />)}
      </View>
      <Text style={styles.note}>{t("contextNote")}</Text>
      <Link label={t("allDocs")} onPress={onOpenDocuments} />
    </View>

    <ModalPanel visible={Boolean(selected)} onClose={() => setSelectedKey(null)} title={selectedTitle} subtitle={selected ? requirementStatus(language, selected.status) : undefined} footer={selected ? <>
      {selected.file_id ? <Button label={t("openFile")} icon="open-outline" onPress={() => void openFile(selected.file_id!)} /> : null}
      {selected.kind === "document" ? <DocumentUploadButton key={selected.requirement} ownerType="worker" ownerId={worker.id} language={language} accent="#387FF4" initialCategory={selected.requirement} initialTitle={selectedTitle} label={t("addDocument")} onSaved={() => setSelectedKey(null)} /> : <Button label={t("addCertificate")} icon="git-branch-outline" variant="secondary" onPress={() => { setSelectedKey(null); onOpenJourney?.(); }} />}
    </> : undefined}>
      {selected ? <View style={{ gap: 12 }}>
        <Text style={styles.detailText}>{selected.file_name || t("missing")}</Text>
        {selected.expires_at ? <Text style={styles.detailText}>{t("expiry")}: {date(selected.expires_at)}</Text> : null}
        <Text style={styles.detailText}>{selected.requirement === "medical" ? t("medicalNote") : t("reviewNote")}</Text>
        <Text style={styles.note}>{t("contextNote")}</Text>
      </View> : null}
    </ModalPanel>
  </View>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Link({ label, onPress }: { label: string; onPress?: () => void }) {
  if (!onPress) return null;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={styles.linkText}>{label}</Text><Ionicons name="arrow-forward-outline" size={15} color={blue} /></Pressable>;
}

function RequirementRow({ item, language, onPress }: { item: WalletRequirement; language: LanguageCode; onPress: () => void }) {
  const color = walletStatusColor(item.status);
  const confirmed = item.status === "verified" || item.status === "expiring";
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.requirement, pressed && styles.pressed]} testID={`wallet-requirement-${item.requirement}`}>
    <Ionicons name={confirmed ? "checkmark-circle-outline" : item.status === "missing" ? "add-circle-outline" : "alert-circle-outline"} size={21} color={item.status === "missing" ? "#67859D" : color} />
    <View style={styles.rowCopy}><Text style={styles.rowTitle}>{requirementTitle(language, item)}</Text><Text style={[styles.rowHint, { color }]}>{requirementStatus(language, item.status)}{item.expires_at ? ` · ${new Date(item.expires_at).toLocaleDateString(localeForLanguage(language))}` : ""}</Text></View>
    <Ionicons name="chevron-forward" size={15} color="#6E8BA4" />
  </Pressable>;
}

const styles = StyleSheet.create({
  overview: { flex: 1, minWidth: 0, width: "100%", gap: 16 },
  panel: { backgroundColor: "#07131EEB", borderColor: "#203D54", borderWidth: 1, borderRadius: 18, padding: 20, gap: 15 },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  headingCopy: { flex: 1, minWidth: 0, gap: 5 },
  eyebrow: { color: "#8DA8BF", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  title: { color: "#E6EFF7", fontSize: 22, lineHeight: 29, fontWeight: "700" },
  value: { alignItems: "flex-end", padding: 3 },
  score: { color: blue, fontSize: 29, lineHeight: 33, fontWeight: "700" },
  maximum: { color: "#768FA5", fontSize: 13 },
  valueLabel: { color: "#849CB1", fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  foundation: { borderColor: "#213B4F", borderWidth: 1, borderRadius: 12 },
  foundationRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, minHeight: 65 },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { color: "#D8E5F0", fontSize: 12, lineHeight: 18, fontWeight: "600" },
  rowHint: { color: "#859EB3", fontSize: 10, lineHeight: 16 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 3 },
  metric: { flex: 1, minWidth: 75, gap: 4 },
  metricValue: { color: "#DEEBF5", fontSize: 21, lineHeight: 27, fontWeight: "600" },
  metricLabel: { color: "#829BB0", fontSize: 10, lineHeight: 15 },
  note: { color: "#89A1B6", fontSize: 11, lineHeight: 18 },
  link: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 40, gap: 8, borderTopWidth: 1, borderTopColor: "#1D3548", paddingTop: 10 },
  linkText: { color: blue, fontSize: 11, lineHeight: 16, fontWeight: "600", flex: 1 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: green },
  siteStatus: { fontSize: 11, lineHeight: 17, fontWeight: "600" },
  counterLabel: { fontSize: 12, fontWeight: "400", color: "#95AFC3" },
  requirements: { gap: 2 },
  requirement: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 12, minHeight: 64, borderBottomWidth: 1, borderBottomColor: "#183244" },
  detailText: { color: "#C8D8E6", fontSize: 13, lineHeight: 21 },
  pressed: { opacity: .7 },
});
