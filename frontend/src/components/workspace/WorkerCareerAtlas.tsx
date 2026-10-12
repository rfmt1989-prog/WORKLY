import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { professionalText } from "@/src/demo/professionalI18n";
import type { LanguageCode, Worker } from "@/src/demo/types";
import { worklyLevelGates } from "./competencyFramework";
import { workerFormationNodes } from "./WorkerFormationPath";
import type { WorkerCompetencyAssessment } from "./workerCompetencyEngine";
import type { AchievementNode } from "./workerCertificateTree";

const MILESTONES = [
  { title: "Aprendizagem", en: "Apprenticeship", icon: "school-outline" as const },
  { title: "Júnior", en: "Junior", icon: "hammer-outline" as const },
  { title: "Profissional", en: "Professional", icon: "construct-outline" as const },
  { title: "Especialista", en: "Specialist", icon: "ribbon-outline" as const },
  { title: "Master", en: "Master", icon: "diamond-outline" as const },
];

export function WorkerCareerAtlas({
  worker, assessment, language, onNode, onAddEvidence, onRules,
}: {
  worker: Worker;
  assessment: WorkerCompetencyAssessment;
  language: LanguageCode;
  onNode: (node: AchievementNode) => void;
  onAddEvidence: () => void;
  onRules: () => void;
}) {
  const tr = (pt: string, en: string) => professionalText(language, pt, en);
  const { width } = useWindowDimensions();
  const compact = width < 680;
  const foundation = useMemo(() => workerFormationNodes(worker, language), [worker, language]);
  const foundationVerified = foundation.filter(node => node.status === "verified").length;
  const currentIndex = Math.max(0, worklyLevelGates.findIndex(level => level.id === assessment.levelId));
  const [selected, setSelected] = useState<number | null>(foundationVerified < foundation.length ? 0 : currentIndex < 4 ? currentIndex + 1 : 4);
  useEffect(() => { setSelected(foundationVerified < foundation.length ? 0 : currentIndex < 4 ? currentIndex + 1 : 4); }, [assessment.professionId]);
  const next = worklyLevelGates[currentIndex + 1];
  const focus = selected === null ? null : worklyLevelGates[selected];
  const satisfied = (index: number) => index === 0 ? foundationVerified === foundation.length : index <= currentIndex;
  const remaining = focus && selected !== null && selected > currentIndex
    ? [
        assessment.score < focus.minimum ? tr("Valor WORKLY", "WORKLY value") : null,
        assessment.coreCoverage < focus.coreCoverage ? tr("Competências essenciais", "Essential competences") : null,
        assessment.verifiedProjects < focus.verifiedProjects ? tr("Obras verificadas", "Verified projects") : null,
        assessment.verifiedExperienceHours < focus.verifiedExperienceHours ? tr("Horas de experiência verificadas", "Verified experience hours") : null,
        assessment.responsibilityEvidence < focus.responsibilityEvidence ? tr("Provas de responsabilidade", "Responsibility evidence") : null,
      ].filter((item): item is string => Boolean(item))
    : [];

  return (
    <View style={styles.shell} testID="worker-career-atlas">
      <View style={styles.intro}>
        <View style={styles.introCopy}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDash} />
            <Text style={styles.kicker}>{tr("MAPA DE CARREIRA · WORKLY", "CAREER MAP · WORKLY")}</Text>
          </View>
          <Text style={[styles.heading, compact && styles.headingCompact]}>{tr("O teu próximo capítulo", "Your next chapter")}</Text>
          <Text style={styles.description}>
            {next
              ? tr("Cada etapa é desbloqueada com provas reais. Explora o próximo nível e vê o que falta para lá chegares.",
                   "Real evidence unlocks each stage. Explore the next level and see what is required.")
              : tr("Alcançaste o último marco do percurso Workly. Continua a documentar a tua experiência.",
                   "You have reached the final Workly milestone. Keep documenting your experience.")}
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onRules} style={({ pressed }) => [styles.scoreModule, pressed && styles.pressed]} testID="career-score-details">
          <Text style={styles.scoreLabel}>WORKLY VALUE</Text>
          <View style={styles.scoreNumbers}>
            <Text style={styles.scoreNumber}>{assessment.score}</Text>
            <Text style={styles.scoreTotal}>/100</Text>
          </View>
          <View style={styles.scoreTrack}><View style={[styles.scoreFill, { width: String(Math.max(0, Math.min(100, assessment.score))) + "%" }]} /></View>
          <Text style={styles.scoreAction}>{tr("Ver avaliação", "View assessment")} ↗</Text>
        </Pressable>
      </View>

      <View style={styles.atlas} testID="career-level-map">
        {worklyLevelGates.map((level, index) => {
          const reached = satisfied(index);
          const active = currentIndex === index;
          const opened = selected === index;
          const item = MILESTONES[index];
          return (
            <Pressable
              key={level.id}
              accessibilityRole="button"
              accessibilityLabel={tr("Nível", "Level") + " " + level.label + " · " + tr(item.title, item.en)}
              accessibilityState={{ expanded: opened, selected: opened }}
              onPress={() => setSelected(opened ? null : index)}
              style={({ pressed }) => [styles.milestone, compact && styles.milestoneCompact, opened && styles.milestoneSelected, pressed && styles.pressed]}
              testID={"career-level-" + level.label}
            >
              {index < 4 && !compact ? <View style={[styles.connector, reached && styles.connectorReached]} /> : null}
              <View style={[styles.milestoneGlyph, reached && styles.milestoneGlyphReached, opened && styles.milestoneGlyphSelected]}>
                <Ionicons name={reached ? "checkmark-outline" : item.icon} size={18} color={opened ? "#FFFFFF" : reached ? "#B14B36" : "#7F8C91"} />
              </View>
              <Text style={[styles.roman, opened && styles.romanSelected]}>{level.label}</Text>
              <Text style={[styles.milestoneName, opened && styles.milestoneNameSelected]} numberOfLines={2}>{tr(item.title, item.en)}</Text>
              <Text style={[styles.milestoneState, active && styles.milestoneStateActive]}>
                {reached ? tr("Validado", "Validated") : active ? tr("Em progresso", "In progress") : tr("Por conquistar", "To unlock")}
              </Text>
              {opened ? <View style={styles.selectionBar} /> : null}
            </Pressable>
          );
        })}
      </View>

      {focus && selected !== null ? (
        <View style={styles.chapter} testID="career-expanded-level">
          <View style={styles.chapterHead}>
            <View style={styles.chapterNumber}><Text style={styles.chapterNumberText}>{focus.label}</Text></View>
            <View style={styles.chapterCopy}>
              <Text style={styles.chapterEyebrow}>{tr("CAPÍTULO", "CHAPTER")} {selected + 1} / 5</Text>
              <Text style={styles.chapterTitle}>{tr(MILESTONES[selected].title, MILESTONES[selected].en)}</Text>
              <Text style={styles.chapterStatus}>
                {satisfied(selected)
                  ? tr("Requisitos verificados", "Requirements verified")
                  : tr("Prepara as provas necessárias para avançar", "Prepare the evidence needed to progress")}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={tr("Recolher nível", "Collapse level")} onPress={() => setSelected(null)} style={styles.closeChapter}>
              <Ionicons name="chevron-up-outline" color="#66767C" size={18} />
            </Pressable>
          </View>
          {selected === 0 ? (
            <View style={styles.evidenceList}>
              <Text style={styles.requirementsTitle}>{tr("A base da tua profissão", "The foundation of your trade")} · {foundationVerified}/2</Text>
              {foundation.map((node, index) => (
                <Pressable key={node.id} accessibilityRole="button" onPress={() => onNode(node)} style={({ pressed }) => [styles.evidenceRow, pressed && styles.pressed]} testID={"career-foundation-" + index}>
                  <View style={styles.evidenceIndex}><Text style={styles.evidenceIndexText}>{index + 1}</Text></View>
                  <View style={styles.evidenceCopy}>
                    <Text style={styles.evidenceTitle}>{node.title}</Text>
                    <Text style={styles.evidenceSubtitle}>{node.subtitle}</Text>
                  </View>
                  <Ionicons name={node.status === "verified" ? "checkmark-circle" : "add-circle-outline"} size={22} color={node.status === "verified" ? "#347B59" : "#B84A35"} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.requirements}>
              <Text style={styles.requirementsTitle}>{tr("Marcos necessários", "Required milestones")}</Text>
              <View style={styles.metrics}>
                <Metric label={tr("Valor", "Value")} actual={assessment.score} required={focus.minimum} unit="/100" />
                <Metric label={tr("Competências", "Competences")} actual={assessment.coreCoverage} required={focus.coreCoverage} unit="%" />
                {focus.verifiedProjects > 0 ? <Metric label={tr("Obras", "Projects")} actual={assessment.verifiedProjects} required={focus.verifiedProjects} unit="" /> : null}
                {focus.verifiedExperienceHours > 0 ? <Metric label={tr("Horas", "Hours")} actual={assessment.verifiedExperienceHours} required={focus.verifiedExperienceHours} unit=" h" /> : null}
                {focus.responsibilityEvidence > 0 ? <Metric label={tr("Responsabilidade", "Responsibility")} actual={assessment.responsibilityEvidence} required={focus.responsibilityEvidence} unit="" /> : null}
              </View>
              {remaining.length ? <Text style={styles.remaining}>{tr("Por validar", "Still needed")}: {remaining.join(" · ")}</Text> : null}
            </View>
          )}
          <Pressable accessibilityRole="button" onPress={onAddEvidence} style={({ pressed }) => [styles.addEvidence, pressed && styles.pressed]} testID="career-add-evidence">
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addEvidenceText}>{tr("Associar comprovativo", "Attach evidence")}</Text>
            <Ionicons name="arrow-forward-outline" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.collapsedHint}><Ionicons name="hand-left-outline" size={15} color="#69777C" /><Text style={styles.hintText}>{tr("Escolhe um nível para explorar os seus requisitos", "Select a level to explore its requirements")}</Text></View>
      )}
    </View>
  );
}

function Metric({ label, actual, required, unit }: { label: string; actual: number; required: number; unit: string }) {
  const ok = actual >= required;
  return (
    <View style={[styles.metric, ok && styles.metricMet]}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Ionicons name={ok ? "checkmark-circle" : "ellipse-outline"} size={16} color={ok ? "#35795C" : "#B68165"} />
      </View>
      <Text style={styles.metricValue}>{Math.round(actual)}<Text style={styles.metricTotal}> / {required}{unit}</Text></Text>
      <View style={styles.metricTrack}><View style={[styles.metricFill, ok && styles.metricFillMet, { width: String(required === 0 ? 100 : Math.max(0, Math.min(100, (actual / required) * 100))) + "%" }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderWidth: 1, borderColor: "#E3DCD1", borderRadius: 24, backgroundColor: "#FFFDF8", padding: 22, gap: 22, shadowColor: "#1A2830", shadowOpacity: .07, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  intro: { flexDirection: "row", alignItems: "flex-start", flexWrap: "wrap", gap: 18 },
  introCopy: { flex: 1, minWidth: 220, gap: 8 },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  kickerDash: { width: 21, height: 2, backgroundColor: "#BD5B42" },
  kicker: { color: "#996851", fontSize: 10, letterSpacing: 1.7, fontWeight: "800" },
  heading: { color: "#1D2C32", fontSize: 29, lineHeight: 36, fontWeight: "800", letterSpacing: -.7 },
  headingCompact: { fontSize: 24, lineHeight: 31 },
  description: { color: "#617078", fontSize: 12, lineHeight: 19, maxWidth: 540 },
  scoreModule: { width: 174, borderRadius: 17, padding: 14, gap: 5, backgroundColor: "#24343C" },
  scoreLabel: { color: "#DABCB0", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  scoreNumbers: { flexDirection: "row", alignItems: "baseline" },
  scoreNumber: { fontSize: 40, lineHeight: 46, fontWeight: "800", color: "#FFFFFF" },
  scoreTotal: { color: "#AEC0C5", fontSize: 12 },
  scoreTrack: { height: 5, borderRadius: 5, backgroundColor: "#526169", overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 5, backgroundColor: "#E7A47E" },
  scoreAction: { color: "#F0D8C7", fontSize: 10, marginTop: 4 },
  atlas: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "stretch", justifyContent: "space-between" },
  milestone: { flex: 1, minWidth: 108, minHeight: 151, borderWidth: 1, borderColor: "#E5DFD8", backgroundColor: "#F8F6F0", borderRadius: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, paddingVertical: 11, gap: 4, position: "relative" },
  milestoneCompact: { minWidth: 102, minHeight: 138 },
  milestoneSelected: { borderColor: "#BD654C", backgroundColor: "#F8EDE4" },
  connector: { position: "absolute", right: -10, top: 40, width: 11, height: 2, backgroundColor: "#D3D0C8", zIndex: 2 },
  connectorReached: { backgroundColor: "#CA765D" },
  milestoneGlyph: { height: 33, width: 33, borderRadius: 16.5, backgroundColor: "#E9E9E4", alignItems: "center", justifyContent: "center" },
  milestoneGlyphReached: { backgroundColor: "#FAE6D8" },
  milestoneGlyphSelected: { backgroundColor: "#B8523B" },
  roman: { color: "#67777C", fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: 1 },
  romanSelected: { color: "#AD4B35" },
  milestoneName: { textAlign: "center", color: "#394B52", fontWeight: "700", fontSize: 11, lineHeight: 15 },
  milestoneNameSelected: { color: "#1E3036" },
  milestoneState: { color: "#829092", fontSize: 9, lineHeight: 13, textAlign: "center" },
  milestoneStateActive: { color: "#A9513B", fontWeight: "800" },
  selectionBar: { position: "absolute", bottom: 0, left: 22, right: 22, height: 3, backgroundColor: "#B8523B", borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chapter: { borderWidth: 1, borderColor: "#DFD8CE", backgroundColor: "#F6F5F0", borderRadius: 18, padding: 18, gap: 18 },
  chapterHead: { flexDirection: "row", alignItems: "center", gap: 13 },
  chapterNumber: { width: 57, height: 57, borderWidth: 1, borderColor: "#DCC2B5", backgroundColor: "#F4E6DD", borderRadius: 13, alignItems: "center", justifyContent: "center" },
  chapterNumberText: { color: "#A84F3C", fontSize: 31, fontWeight: "800" },
  chapterCopy: { flex: 1, minWidth: 0, gap: 2 },
  chapterEyebrow: { color: "#A47B69", letterSpacing: 1.1, fontWeight: "800", fontSize: 9 },
  chapterTitle: { color: "#24363C", fontSize: 20, lineHeight: 26, fontWeight: "800" },
  chapterStatus: { color: "#788589", fontSize: 11, lineHeight: 16 },
  closeChapter: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  requirements: { gap: 12 },
  requirementsTitle: { color: "#3A4D54", fontSize: 12, fontWeight: "800", letterSpacing: .2 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { minWidth: 126, flexGrow: 1, flexBasis: 130, borderWidth: 1, borderColor: "#E4DFD7", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, gap: 6 },
  metricMet: { borderColor: "#C5DDCB" },
  metricTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 },
  metricLabel: { color: "#687B81", fontSize: 10, fontWeight: "600" },
  metricValue: { color: "#263A40", fontSize: 23, fontWeight: "800" },
  metricTotal: { color: "#839095", fontSize: 11, fontWeight: "600" },
  metricTrack: { height: 4, backgroundColor: "#EAEAE6", borderRadius: 4, overflow: "hidden" },
  metricFill: { height: "100%", backgroundColor: "#C8785E" },
  metricFillMet: { backgroundColor: "#45916A" },
  remaining: { color: "#9D573F", fontSize: 11, lineHeight: 19 },
  evidenceList: { gap: 10 },
  evidenceRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4DED4" },
  evidenceIndex: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#F3E5D9", alignItems: "center", justifyContent: "center" },
  evidenceIndexText: { color: "#AE523B", fontSize: 13, fontWeight: "800" },
  evidenceCopy: { flex: 1, minWidth: 0, gap: 2 },
  evidenceTitle: { color: "#283C43", fontSize: 12, fontWeight: "700" },
  evidenceSubtitle: { color: "#7F8D90", fontSize: 10, lineHeight: 16 },
  addEvidence: { minHeight: 45, borderRadius: 12, backgroundColor: "#B8523B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 16 },
  addEvidenceText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  collapsedHint: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  hintText: { color: "#687B81", fontSize: 11 },
  pressed: { opacity: .78 },
});
