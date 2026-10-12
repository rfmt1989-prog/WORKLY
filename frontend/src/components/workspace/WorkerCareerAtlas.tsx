import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.atlas, compact && styles.atlasCompact]} testID="career-level-map">
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
              {index < 4 ? <View style={[styles.connector, reached && styles.connectorReached]} /> : null}
              <View style={[styles.milestoneGlyph, reached && styles.milestoneGlyphReached, opened && styles.milestoneGlyphSelected]}>
                <Ionicons name={reached ? "checkmark-outline" : item.icon} size={18} color={opened || reached ? "#91C9DD" : "#AEC2CB"} />
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
      </ScrollView>

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
              <Ionicons name="chevron-up-outline" color="#AEC2CB" size={18} />
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
                  <Ionicons name={node.status === "verified" ? "checkmark-circle" : "add-circle-outline"} size={22} color={node.status === "verified" ? "#91C9DD" : "#91C9DD"} />
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
            <Ionicons name="add-circle-outline" size={20} color="#91C9DD" />
            <Text style={styles.addEvidenceText}>{tr("Associar comprovativo", "Attach evidence")}</Text>
            <Ionicons name="arrow-forward-outline" size={16} color="#91C9DD" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.collapsedHint}><Ionicons name="hand-left-outline" size={15} color="#AEC2CB" /><Text style={styles.hintText}>{tr("Escolhe um nível para explorar os seus requisitos", "Select a level to explore its requirements")}</Text></View>
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
        <Ionicons name={ok ? "checkmark-circle" : "ellipse-outline"} size={16} color={ok ? "#91C9DD" : "#AEC2CB"} />
      </View>
      <Text style={styles.metricValue}>{Math.round(actual)}<Text style={styles.metricTotal}> / {required}{unit}</Text></Text>
      <View style={styles.metricTrack}><View style={[styles.metricFill, ok && styles.metricFillMet, { width: String(required === 0 ? 100 : Math.max(0, Math.min(100, (actual / required) * 100))) + "%" }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderWidth: 1, borderColor: "#40596A", borderRadius: 25, backgroundColor: "#152636", padding: 24, gap: 24, shadowColor: "#263844", shadowOpacity: .07, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  intro: { flexDirection: "row", alignItems: "flex-start", flexWrap: "wrap", gap: 18 },
  introCopy: { flex: 1, minWidth: 220, gap: 8 },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  kickerDash: { width: 21, height: 2, backgroundColor: "#91C9DD" },
  kicker: { color: "#91C9DD", fontSize: 10, letterSpacing: 1.7, fontWeight: "800" },
  heading: { color: "#EDF5F7", fontSize: 29, lineHeight: 36, fontWeight: "800", letterSpacing: -.7 },
  headingCompact: { fontSize: 24, lineHeight: 31 },
  description: { color: "#AEC2CB", fontSize: 12, lineHeight: 19, maxWidth: 540 },
  scoreModule: { width: 174, borderRadius: 17, padding: 14, gap: 5, borderWidth: 1, borderColor: "#456678", backgroundColor: "#284354" },
  scoreLabel: { color: "#91C9DD", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  scoreNumbers: { flexDirection: "row", alignItems: "baseline" },
  scoreNumber: { fontSize: 40, lineHeight: 46, fontWeight: "800", color: "#EDF5F7" },
  scoreTotal: { color: "#AEC2CB", fontSize: 12 },
  scoreTrack: { height: 5, borderRadius: 5, backgroundColor: "#405D6F", overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 5, backgroundColor: "#91C9DD" },
  scoreAction: { color: "#91C9DD", fontSize: 10, marginTop: 4 },
  atlas: { flexDirection: "row", gap: 12, alignItems: "stretch", paddingVertical: 8, paddingHorizontal: 3 },
  atlasCompact: { paddingBottom: 14 },
  milestone: { width: 156, flexShrink: 0, minHeight: 169, borderWidth: 1, borderColor: "#46677A", backgroundColor: "#182C3A", borderRadius: 24, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, paddingVertical: 18, gap: 6, position: "relative" },
  milestoneCompact: { width: 130, minHeight: 158 },
  milestoneSelected: { borderColor: "#91C9DD", backgroundColor: "#29475A", transform: [{ translateY: -3 }] },
  connector: { position: "absolute", right: -14, top: 63, width: 15, height: 2, backgroundColor: "#527080", zIndex: 2 },
  connectorReached: { backgroundColor: "#91C9DD" },
  milestoneGlyph: { height: 48, width: 48, borderRadius: 24, borderWidth: 1, borderColor: "#547184", backgroundColor: "#213949", alignItems: "center", justifyContent: "center", marginBottom: 3 },
  milestoneGlyphReached: { backgroundColor: "#284354" },
  milestoneGlyphSelected: { backgroundColor: "#345668" },
  roman: { color: "#C9DCE5", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: 1.4 },
  romanSelected: { color: "#91C9DD" },
  milestoneName: { textAlign: "center", color: "#EDF5F7", fontWeight: "700", fontSize: 11, lineHeight: 15 },
  milestoneNameSelected: { color: "#EDF5F7" },
  milestoneState: { color: "#AEC2CB", fontSize: 9, lineHeight: 13, textAlign: "center" },
  milestoneStateActive: { color: "#91C9DD", fontWeight: "800" },
  selectionBar: { position: "absolute", bottom: 0, left: 22, right: 22, height: 3, backgroundColor: "#91C9DD", borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chapter: { borderWidth: 1, borderColor: "#40596A", backgroundColor: "#1B2B39", borderRadius: 18, padding: 18, gap: 18 },
  chapterHead: { flexDirection: "row", alignItems: "center", gap: 13 },
  chapterNumber: { width: 57, height: 57, borderWidth: 1, borderColor: "#55788C", backgroundColor: "#284354", borderRadius: 13, alignItems: "center", justifyContent: "center" },
  chapterNumberText: { color: "#91C9DD", fontSize: 31, fontWeight: "800" },
  chapterCopy: { flex: 1, minWidth: 0, gap: 2 },
  chapterEyebrow: { color: "#91C9DD", letterSpacing: 1.1, fontWeight: "800", fontSize: 9 },
  chapterTitle: { color: "#EDF5F7", fontSize: 20, lineHeight: 26, fontWeight: "800" },
  chapterStatus: { color: "#AEC2CB", fontSize: 11, lineHeight: 16 },
  closeChapter: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  requirements: { gap: 12 },
  requirementsTitle: { color: "#EDF5F7", fontSize: 12, fontWeight: "800", letterSpacing: .2 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { minWidth: 126, flexGrow: 1, flexBasis: 130, borderWidth: 1, borderColor: "#40596A", backgroundColor: "#172736", borderRadius: 12, padding: 12, gap: 6 },
  metricMet: { borderColor: "#64869A" },
  metricTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 },
  metricLabel: { color: "#AEC2CB", fontSize: 10, fontWeight: "600" },
  metricValue: { color: "#EDF5F7", fontSize: 23, fontWeight: "800" },
  metricTotal: { color: "#AEC2CB", fontSize: 11, fontWeight: "600" },
  metricTrack: { height: 4, backgroundColor: "#344E5D", borderRadius: 4, overflow: "hidden" },
  metricFill: { height: "100%", backgroundColor: "#91C9DD" },
  metricFillMet: { backgroundColor: "#91C9DD" },
  remaining: { color: "#91C9DD", fontSize: 11, lineHeight: 19 },
  evidenceList: { gap: 10 },
  evidenceRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 13, backgroundColor: "#172736", borderWidth: 1, borderColor: "#40596A" },
  evidenceIndex: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#284354", alignItems: "center", justifyContent: "center" },
  evidenceIndexText: { color: "#91C9DD", fontSize: 13, fontWeight: "800" },
  evidenceCopy: { flex: 1, minWidth: 0, gap: 2 },
  evidenceTitle: { color: "#EDF5F7", fontSize: 12, fontWeight: "700" },
  evidenceSubtitle: { color: "#AEC2CB", fontSize: 10, lineHeight: 16 },
  addEvidence: { minHeight: 45, borderRadius: 12, borderWidth: 1, borderColor: "#6D95A8", backgroundColor: "#284354", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 16 },
  addEvidenceText: { color: "#91C9DD", fontSize: 12, fontWeight: "800" },
  collapsedHint: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  hintText: { color: "#AEC2CB", fontSize: 11 },
  pressed: { opacity: .78 },
});
