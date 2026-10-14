import Ionicons from "./WorklyIcon";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, useWindowDimensions, View } from "react-native";
import { professionalText } from "@/src/demo/professionalI18n";
import type { LanguageCode, Worker } from "@/src/demo/types";
import { worklyLevelGates } from "./competencyFramework";
import { workerFormationNodes } from "./WorkerFormationPath";
import { Avatar } from "./primitives";
import type { WorkerCompetencyAssessment } from "./workerCompetencyEngine";
import type { AchievementNode } from "./workerCertificateTree";

const LEVELS = [
  { pt: "Aprendiz", en: "Apprentice", icon: "school-outline" as const },
  { pt: "Júnior", en: "Junior", icon: "construct-outline" as const },
  { pt: "Técnico", en: "Technician", icon: "hardware-chip-outline" as const },
  { pt: "Sénior", en: "Senior", icon: "shield-checkmark-outline" as const },
  { pt: "Master", en: "Master", icon: "diamond-outline" as const },
];
const INK = "#233844";
const ACCENT = "#4B7E91";
const MUTED = "#657C88";
const BORDER = "#DDE7EA";
const SURFACE = "#FFFFFF";
const PALE = "#EAF2F4";

type AtlasProps = {
  worker: Worker;
  assessment: WorkerCompetencyAssessment;
  language: LanguageCode;
  onNode: (node: AchievementNode) => void;
  onAddEvidence: () => void;
  onRules: () => void;
  onReveal?: (y: number, height: number) => void;
  collapseKey?: string | null;
  onLevelChange?: () => void;
};

function Glyph({ icon, size = 20 }: { icon: React.ComponentProps<typeof Ionicons>["name"]; size?: number }) {
  return <View style={styles.glyph}><Ionicons name={icon} color={ACCENT} size={size} /></View>;
}

function RankBadge({ numeral, current, completed }: { numeral: string; current: boolean; completed: boolean }) {
  return (
    <View style={[styles.rankFrame, current && styles.rankFrameCurrent, completed && styles.rankFrameCompleted]}>
      <View style={[styles.rankDiamond, current && styles.rankDiamondCurrent]} />
      <Text style={[styles.rankNumeral, current && styles.rankNumeralCurrent]}>{numeral}</Text>
      {completed && !current ? <View style={styles.rankCheck}><Ionicons name="checkmark" size={9} color={SURFACE} /></View> : null}
    </View>
  );
}

function Requirement({ label, actual, required, unit, icon }: { label: string; actual: number; required: number; unit: string; icon: React.ComponentProps<typeof Ionicons>["name"] }) {
  const done = actual >= required;
  const percent = required ? Math.min(100, Math.max(0, actual / required * 100)) : 100;
  return (
    <View style={styles.requirement}>
      <Glyph icon={icon} size={17} />
      <View style={styles.requirementBody}>
        <View style={styles.requirementHead}>
          <Text style={styles.requirementName}>{label}</Text>
          <Text style={styles.requirementNumbers}>{Math.round(actual)} / {required}{unit}</Text>
        </View>
        <View style={styles.track}><View style={[styles.trackFill, { width: (String(percent) + "%") as `${number}%` }]} /></View>
      </View>
      <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} color={done ? ACCENT : "#9AACB4"} size={19} />
    </View>
  );
}

export function WorkerCareerAtlas({ worker, assessment, language, onNode, onAddEvidence, onRules, onReveal, collapseKey, onLevelChange }: AtlasProps) {
  const tr = (pt: string, en: string) => professionalText(language, pt, en);
  const { height } = useWindowDimensions();
  const foundation = useMemo(() => workerFormationNodes(worker, language), [worker, language]);
  const foundationVerified = foundation.filter(node => node.status === "verified").length;
  const currentIndex = Math.max(0, worklyLevelGates.findIndex(level => level.id === assessment.levelId));
  const current = worklyLevelGates[currentIndex];
  // Details are deliberately closed by default. Only one level can open at a time.
  const [selected, setSelected] = useState<number | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);
  const animateLayout = () => { if (Platform.OS !== "web") LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); };
  const revealKey = useRef<string | null>(null);
  const openAnimation = useRef(new Animated.Value(0)).current;
  const detailRef = useRef<View>(null);
  useEffect(() => {
    setSelected(null);
    setShowEvidence(false);
  }, [assessment.professionId]);
  useEffect(() => { if (collapseKey) { setSelected(null); setShowEvidence(false); } }, [collapseKey]);
  useEffect(() => {
    openAnimation.setValue(0);
    if (selected !== null) {
      Animated.timing(openAnimation, { toValue: 1, duration: 230, useNativeDriver: true }).start();
    }
  }, [selected, openAnimation]);
  const detail = selected === null ? null : worklyLevelGates[selected];
  const reached = (idx: number) => idx === 0 ? foundationVerified === foundation.length : idx <= currentIndex;
  const essentialBadges = assessment.competencies.filter(item => item.competency.relation === "essential");
  const verifiedBadgeCount = essentialBadges.filter(item => item.proficiency >= 2).length;
  const documentedFunctions = assessment.competencies.filter(item => (item.evidenceByType.work_record || 0) > 0).length;
  const stageOfSkill = (item: typeof essentialBadges[number], index: number) => {
    if (item.competency.dimension === "knowledge") return 1;
    if (item.competency.dimension === "responsibility") return 3;
    if (item.competency.dimension === "diagnostic") return 2;
    return index <= 2 ? 1 : 2;
  };
  const badgesForStage = (stage: number) => essentialBadges.filter((item, index) => stage === 4 || stageOfSkill(item, index) === stage);
  const openCompetency = (item: typeof essentialBadges[number], stage: number) => {
    const complete = item.proficiency >= 2;
    const status = complete ? "verified" : item.evidenceState === "pending" ? "pending" : item.evidenceState === "none" ? "available" : "recorded";
    onNode({
      id: item.competency.id,
      title: tr(item.competency.title, item.competency.titleEn),
      subtitle: tr(item.competency.description, item.competency.descriptionEn),
      icon: item.competency.icon,
      status,
      stage: stage === 1 ? "base" : stage === 3 ? "responsibility" : stage === 4 ? "master" : "technical",
      family: "main-profession",
      scope: tr("Badge essencial da profissão", "Essential badge of this trade"),
      certificate: item.certificate,
      kind: "skill",
      meta: [tr("Exige trabalho prático ou avaliação técnica comprovada e validada por entidade independente.", "Requires demonstrable practical work or technical assessment approved by an independent reviewer.")],
    });
  };
  const nextGate = worklyLevelGates[currentIndex + 1];
  const nextChecks = nextGate ? [
    { ok: foundationVerified === foundation.length, label: tr("Formação", "Training") },
    { ok: assessment.score >= nextGate.minimum, label: "Value" },
    { ok: assessment.coreCoverage >= nextGate.coreCoverage, label: tr("Badges", "Badges") },
    { ok: assessment.verifiedExperienceHours >= nextGate.verifiedExperienceHours, label: tr("Horas", "Hours") },
    { ok: assessment.verifiedProjects >= nextGate.verifiedProjects, label: tr("Obras", "Projects") },
    { ok: assessment.responsibilityEvidence >= nextGate.responsibilityEvidence, label: tr("Autonomia", "Autonomy") },
  ] : [];
  const nextCompleted = nextChecks.filter(item => item.ok).length;
  const nextPercent = nextChecks.length ? Math.round(nextCompleted / nextChecks.length * 100) : 100;
  const openLevel = (idx: number) => {
    onLevelChange?.();
    animateLayout();
    revealKey.current = null;
    setShowEvidence(false);
    setSelected(value => value === idx ? null : idx);
  };
  const reveal = () => {
    if (selected === null || !onReveal) return;
    const key = assessment.professionId + ":" + selected;
    if (revealKey.current === key) return;
    revealKey.current = key;
    requestAnimationFrame(() => {
      detailRef.current?.measureInWindow((_x, y, _w, h) => onReveal(y, h));
    });
  };
  return (
    <View style={styles.shell} testID="worker-career-atlas">
      <View style={styles.intro}>
        <View style={styles.introBrand}>
          <View style={styles.brandMark}><Text style={styles.brandW}>W</Text></View>
          <View style={styles.introText}>
            <Text style={styles.kicker}>WORKLY / {tr("CARREIRA", "CAREER")}</Text>
            <Text style={styles.heading}>{tr("Evolução", "Progress")}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onRules} style={({ pressed }) => [styles.valueButton, pressed && styles.pressed]} testID="career-score-details">
            <Text style={styles.valueLabel}>VALUE</Text>
            <Text style={styles.valueScore}>{assessment.score}<Text style={styles.valueTotal}>/100</Text></Text>
            <Ionicons name="chevron-forward-outline" size={13} color={ACCENT} />
          </Pressable>
        </View>
        <View style={styles.workerStrip}>
          <Avatar name={worker.name || "Worker"} source={worker.avatar} size={49} accent={ACCENT} />
          <View style={styles.workerCopy}>
            <Text style={styles.workerName} numberOfLines={1}>{worker.name || tr("Profissional", "Professional")}</Text>
            <Text style={styles.workerTrade} numberOfLines={1}>{worker.profession || tr("Profissão por definir", "Trade not set")}</Text>
          </View>
          <View style={styles.workerCurrent}>
            <Text style={styles.currentTiny}>{tr("ATUAL", "CURRENT")}</Text>
            <Text style={styles.currentNumber}>{current.label}</Text>
          </View>
        </View>
      </View>

      <Pressable onPress={onRules} accessibilityRole="button" style={({ pressed }) => [styles.scoreMeter, pressed && styles.pressed]} testID="workly-value-meter">
        <View style={styles.meterCopy}>
          <View style={styles.meterTitleRow}><Ionicons name="analytics-outline" color={ACCENT} size={19} /><Text style={styles.meterTitle}>WORKLY VALUE</Text><Text style={styles.meterNumber}>{assessment.score}<Text style={styles.meterDenominator}>/100</Text></Text></View>
          <View style={styles.meterTrack}><View style={[styles.meterFill, { width: (String(Math.max(0, Math.min(100, assessment.score))) + "%") as `${number}%` }]} /></View>
          <Text style={styles.meterCaption}>{tr("Técnica 45 · Obras e horas 25 · Formação 15 · Validação 15", "Skills 45 · Projects & hours 25 · Training 15 · Verification 15")}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={17} color={ACCENT} />
      </Pressable>
      <View style={styles.treeHeader}>
        <Text style={styles.groupTitle}>{tr("Níveis", "Levels")}</Text>
        <Text style={styles.groupHint}>{verifiedBadgeCount}/{essentialBadges.length} {tr("badges essenciais", "essential badges")}</Text>
      </View>
      <View style={styles.levels} testID="career-level-map">
        <View pointerEvents="none" style={styles.levelRail} />
        {worklyLevelGates.map((level, idx) => {
          const currentStage = idx === currentIndex;
          const open = selected === idx;
          const achieved = reached(idx);
          return (
            <Pressable
              key={level.id}
              accessibilityRole="button"
              accessibilityLabel={tr("Nível", "Level") + " " + level.label + " · " + tr(LEVELS[idx].pt, LEVELS[idx].en)}
              accessibilityState={{ selected: open, expanded: open }}
              onPress={() => openLevel(idx)}
              style={({ pressed }) => [styles.levelButton, open && styles.levelButtonOpen, pressed && styles.pressed]}
              testID={"career-level-" + level.label}
            >
              <RankBadge numeral={level.label} current={currentStage && achieved} completed={achieved} />
              <Text style={[styles.levelName, (open || currentStage) && styles.levelNameCurrent]} numberOfLines={1}>{tr(LEVELS[idx].pt, LEVELS[idx].en)}</Text>
              {open ? <View style={styles.activeTick} /> : null}
            </Pressable>
          );
        })}
      </View>
      {nextGate ? <View style={styles.nextProgress}>
        <View style={styles.nextRow}><Text style={styles.nextName}>{tr("Próximo", "Next")} {nextGate.label}</Text><Text style={styles.nextRatio}>{nextCompleted}/{nextChecks.length} {tr("condições", "conditions")}</Text></View>
        <View style={styles.nextTrack}><View style={[styles.nextFill, { width: (String(nextPercent) + "%") as `${number}%` }]} /></View>
      </View> : null}
      <View style={styles.treeFooter}>
        <View style={styles.legend}><View style={styles.legendDot} /><Text style={styles.legendText}>{tr("Nível atual", "Current level")}: {current.label}</Text></View>
        <Text style={styles.legendText}>{foundationVerified}/{foundation.length} {tr("base verificada", "foundation verified")}</Text>
      </View>

      {detail !== null && selected !== null ? (
        <Animated.View
          ref={detailRef}
          onLayout={reveal}
          style={[styles.detail, { opacity: openAnimation, transform: [{ translateY: openAnimation.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
          testID="career-expanded-level"
        >
          <View style={styles.detailHeader}>
            <RankBadge numeral={detail.label} current={reached(selected)} completed={reached(selected)} />
            <View style={styles.detailCopy}>
              <Text style={styles.detailKicker}>{tr("NÍVEL", "LEVEL")} {detail.label} / V</Text>
              <Text style={styles.detailTitle}>{tr(LEVELS[selected].pt, LEVELS[selected].en)}</Text>
              <Text style={styles.detailCaption}>{reached(selected) ? tr("Requisitos verificados", "Requirements verified") : tr("Provas necessárias para avançar", "Evidence needed to progress")}</Text>
            </View>
            <Pressable onPress={() => { animateLayout(); setSelected(null); }} accessibilityRole="button" accessibilityLabel={tr("Fechar", "Close")} style={styles.close}>
              <Ionicons name="close" size={19} color={INK} />
            </Pressable>
          </View>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator style={{ maxHeight: Math.max(190, Math.min(height * 0.48, 460)) }} contentContainerStyle={styles.detailScroll}>
            {selected === 0 ? (
              <View style={styles.foundation}>
                <Text style={styles.detailSection}>{tr("Formação", "Training")} · {foundationVerified}/{foundation.length}</Text>
                {foundation.map((node, i) => (
                  <Pressable key={node.id} onPress={() => onNode(node)} accessibilityRole="button" style={({ pressed }) => [styles.foundationRow, pressed && styles.pressed]} testID={"career-foundation-" + i}>
                    <Glyph icon={i === 0 ? "school-outline" : "briefcase-outline"} size={19} />
                    <View style={styles.foundationText}><Text style={styles.foundationTitle}>{node.title}</Text><Text style={styles.foundationSub}>{node.subtitle}</Text></View>
                    <Ionicons name={node.status === "verified" ? "checkmark-circle" : "add-circle-outline"} size={20} color={ACCENT} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.requirements}>
                <Text style={styles.detailSection}>{tr("Badges", "Badges")} · {badgesForStage(selected).filter(item => item.proficiency >= 2).length}/{badgesForStage(selected).length}</Text>
                <View style={styles.coreBadgeGrid}>
                  {badgesForStage(selected).map(item => {
                    const verified = item.proficiency >= 2;
                    return (
                      <Pressable key={item.competency.id} onPress={() => openCompetency(item, selected)} accessibilityRole="button"
                        accessibilityLabel={tr(item.competency.title, item.competency.titleEn)} style={({ pressed }) => [styles.coreBadge, verified && styles.coreBadgeVerified, pressed && styles.pressed]}
                        testID={"career-core-" + item.competency.id}>
                        <Glyph icon={item.competency.icon} size={18} />
                        <Text style={styles.coreBadgeTitle} numberOfLines={2}>{tr(item.competency.title, item.competency.titleEn)}</Text>
                        <Ionicons name={verified ? "checkmark-circle" : item.evidenceState === "pending" ? "time-outline" : "add-circle-outline"} size={18} color={verified ? ACCENT : "#9AACB4"} />
                      </Pressable>
                    );
                  })}
                </View>
                {selected === 4 ? <View style={styles.foundationNotice}><Ionicons name="shield-checkmark-outline" color={ACCENT} size={16} /><Text style={styles.foundationNoticeText}>{tr("Master exige TODOS os badges essenciais validados, além de experiência e autonomia comprovadas.", "Master requires ALL essential badges verified plus proven experience and autonomy.")}</Text></View> : null}
                <Text style={styles.detailSection}>{tr("Condições", "Conditions")}</Text>
                {foundationVerified < foundation.length ? <View style={styles.foundationNotice}><Ionicons name="alert-circle-outline" size={16} color={ACCENT} /><Text style={styles.foundationNoticeText}>{tr("Primeiro, valida o curso e o estágio do nível I.", "First verify the training and internship in level I.")}</Text></View> : null}
                <Requirement label={tr("Valor", "Value")} icon="analytics-outline" actual={assessment.score} required={detail.minimum} unit="" />
                <Requirement label={tr("Badges essenciais", "Core badges")} icon="construct-outline" actual={assessment.coreCoverage} required={detail.coreCoverage} unit="%" />
                {detail.verifiedProjects > 0 ? <Requirement label={tr("Obras", "Projects")} icon="business-outline" actual={assessment.verifiedProjects} required={detail.verifiedProjects} unit="" /> : null}
                {detail.verifiedExperienceHours > 0 ? <Requirement label={tr("Horas", "Hours")} icon="time-outline" actual={assessment.verifiedExperienceHours} required={detail.verifiedExperienceHours} unit=" h" /> : null}
                {detail.responsibilityEvidence > 0 ? <Requirement label={tr("Autonomia", "Autonomy")} icon="shield-checkmark-outline" actual={assessment.responsibilityEvidence} required={detail.responsibilityEvidence} unit="" /> : null}
              </View>
            )}
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showEvidence }} onPress={() => { animateLayout(); setShowEvidence(value => !value); }} style={({ pressed }) => [styles.evidenceToggle, pressed && styles.pressed]}>
              <Text style={styles.evidenceToggleText}>{tr("Provas", "Evidence")}</Text>
              <Ionicons name={showEvidence ? "chevron-up" : "chevron-down"} size={16} color={ACCENT} />
            </Pressable>
            {showEvidence ? (
              <View style={styles.evidenceGrid}>
                <View style={styles.evidenceMetric}><Glyph icon="time-outline" /><Text style={styles.evidenceNumber}>{Math.round(assessment.verifiedExperienceHours)} h</Text><Text style={styles.evidenceCaption}>{tr("Horas validadas", "Verified hours")}</Text></View>
                <View style={styles.evidenceMetric}><Glyph icon="build-outline" /><Text style={styles.evidenceNumber}>{documentedFunctions}</Text><Text style={styles.evidenceCaption}>{tr("Funções registadas", "Recorded tasks")}</Text></View>
                <View style={styles.evidenceMetric}><Glyph icon="business-outline" /><Text style={styles.evidenceNumber}>{assessment.verifiedProjects}</Text><Text style={styles.evidenceCaption}>{tr("Obras validadas", "Verified projects")}</Text></View>
                <View style={styles.evidenceMetric}><Glyph icon="ribbon-outline" /><Text style={styles.evidenceNumber}>{assessment.verifiedQualifications}</Text><Text style={styles.evidenceCaption}>{tr("Qualificações", "Qualifications")}</Text></View>
              </View>
            ) : null}
          </ScrollView>
          <Pressable onPress={onAddEvidence} accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && styles.pressed]} testID="career-add-evidence">
            <Ionicons name="add-circle-outline" size={19} color={ACCENT} />
            <Text style={styles.actionText}>{tr("Registar prova", "Add evidence")}</Text>
            <Ionicons name="arrow-forward-outline" size={17} color={ACCENT} />
          </Pressable>
        </Animated.View>
      ) : (
        <Text style={styles.tip}>{tr("Seleciona um emblema para abrir os critérios.", "Select an emblem to view its criteria.")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { width: "100%", backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 20, padding: 16, gap: 14 },
  intro: { gap: 14 },
  introBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 38, height: 38, borderWidth: 1, borderColor: "#BFD4DC", backgroundColor: PALE, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  brandW: { fontWeight: "900", fontSize: 22, color: ACCENT },
  introText: { flex: 1, minWidth: 0, gap: 1 },
  kicker: { color: MUTED, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  heading: { color: INK, fontSize: 25, lineHeight: 32, fontWeight: "800" },
  valueButton: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: BORDER, backgroundColor: "#F5F9FA", borderRadius: 10, padding: 9 },
  valueLabel: { fontSize: 9, color: MUTED, fontWeight: "800" },
  valueScore: { fontSize: 18, color: INK, fontWeight: "800" },
  valueTotal: { fontSize: 10, color: MUTED },
  workerStrip: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#F6F9FA", borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 10 },
  workerCopy: { flex: 1, minWidth: 0, gap: 2 },
  workerName: { fontWeight: "800", fontSize: 14, color: INK },
  workerTrade: { fontSize: 11, color: MUTED },
  workerCurrent: { minWidth: 46, alignItems: "center", borderLeftWidth: 1, borderLeftColor: BORDER, paddingLeft: 10 },
  currentTiny: { fontSize: 8, letterSpacing: 0.7, fontWeight: "800", color: MUTED },
  currentNumber: { fontSize: 21, color: ACCENT, fontWeight: "900" },
  scoreMeter: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#F7FAFB", borderWidth: 1, borderColor: BORDER, borderRadius: 13, padding: 11 },
  meterCopy: { flex: 1, gap: 9, minWidth: 0 },
  meterTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  meterTitle: { flex: 1, fontSize: 11, fontWeight: "800", color: INK },
  meterNumber: { color: ACCENT, fontSize: 19, fontWeight: "900" },
  meterDenominator: { color: MUTED, fontSize: 10 },
  meterTrack: { height: 6, backgroundColor: "#DAE5E9", borderRadius: 6, overflow: "hidden" },
  meterFill: { height: "100%", backgroundColor: ACCENT, borderRadius: 6 },
  meterCaption: { fontSize: 9, color: MUTED },
  nextProgress: { paddingHorizontal: 4, gap: 6 },
  nextRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextName: { color: INK, fontWeight: "800", fontSize: 10 },
  nextRatio: { color: MUTED, fontSize: 10 },
  nextTrack: { height: 3, backgroundColor: "#DAE5E9", borderRadius: 3, overflow: "hidden" },
  nextFill: { height: 3, backgroundColor: ACCENT },
  levelRail: { position: "absolute", top: 33, left: "10%", right: "10%", height: 2, backgroundColor: "#D5E2E7" },
  coreBadgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  coreBadge: { flexGrow: 1, flexBasis: 140, minWidth: 130, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 11, minHeight: 58, padding: 9 },
  coreBadgeVerified: { backgroundColor: PALE, borderColor: "#B8D2DD" },
  coreBadgeTitle: { flex: 1, color: INK, fontSize: 10, lineHeight: 14, fontWeight: "700" },
  treeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  groupTitle: { fontSize: 13, fontWeight: "800", color: INK },
  groupHint: { fontSize: 10, color: MUTED },
  levels: { flexDirection: "row", alignItems: "stretch", gap: 3 },
  levelButton: { flex: 1, minWidth: 0, paddingVertical: 10, paddingHorizontal: 1, alignItems: "center", gap: 12, borderWidth: 1, borderColor: "transparent", borderRadius: 12, position: "relative" },
  levelButtonOpen: { backgroundColor: PALE, borderColor: "#BDD4DD" },
  rankFrame: { width: 47, height: 47, alignItems: "center", justifyContent: "center", position: "relative" },
  rankFrameCurrent: { transform: [{ scale: 1.08 }] },
  rankFrameCompleted: {},
  rankDiamond: { position: "absolute", width: 33, height: 33, borderRadius: 6, borderWidth: 2, borderColor: "#C3D1D7", backgroundColor: "#F6F9FA", transform: [{ rotate: "45deg" }] },
  rankDiamondCurrent: { borderColor: ACCENT, backgroundColor: "#DCECF1" },
  rankNumeral: { fontWeight: "900", fontSize: 18, color: "#8298A2", textAlign: "center" },
  rankNumeralCurrent: { color: "#2A657C" },
  rankCheck: { position: "absolute", right: 0, bottom: 0, width: 13, height: 13, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: ACCENT },
  levelName: { fontSize: 9, lineHeight: 13, textAlign: "center", color: MUTED, fontWeight: "700" },
  levelNameCurrent: { color: INK, fontWeight: "800" },
  activeTick: { position: "absolute", bottom: 0, width: 21, height: 2, borderRadius: 2, backgroundColor: ACCENT },
  treeFooter: { flexDirection: "row", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  legendText: { fontSize: 10, color: MUTED },
  tip: { fontSize: 10, color: MUTED, textAlign: "center", paddingVertical: 10 },
  detail: { backgroundColor: "#F7FAFB", borderRadius: 15, borderWidth: 1, borderColor: "#C4D9E1", overflow: "hidden" },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderBottomWidth: 1, borderBottomColor: BORDER },
  detailCopy: { flex: 1, minWidth: 0, gap: 2 },
  detailKicker: { fontSize: 9, fontWeight: "800", letterSpacing: 1, color: ACCENT },
  detailTitle: { fontSize: 19, fontWeight: "800", color: INK },
  detailCaption: { color: MUTED, fontSize: 10 },
  close: { width: 30, height: 30, borderWidth: 1, borderColor: BORDER, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: SURFACE },
  detailScroll: { padding: 12, gap: 11 },
  detailSection: { color: INK, fontWeight: "800", fontSize: 12, marginBottom: 2 },
  requirements: { gap: 8 },
  requirement: { minHeight: 55, padding: 8, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 11 },
  glyph: { width: 33, height: 33, flexShrink: 0, borderRadius: 10, borderWidth: 1, borderColor: "#C8DCE3", backgroundColor: PALE, alignItems: "center", justifyContent: "center" },
  requirementBody: { flex: 1, minWidth: 0, gap: 7 },
  requirementHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5 },
  requirementName: { fontSize: 11, fontWeight: "700", color: INK, flexShrink: 1 },
  requirementNumbers: { fontSize: 10, fontWeight: "800", color: MUTED },
  track: { height: 4, borderRadius: 4, backgroundColor: "#E2EAED", overflow: "hidden" },
  trackFill: { height: "100%", backgroundColor: ACCENT },
  foundation: { gap: 8 },
  foundationRow: { flexDirection: "row", alignItems: "center", gap: 9, padding: 10, borderRadius: 11, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE },
  foundationText: { flex: 1, gap: 3, minWidth: 0 },
  foundationTitle: { color: INK, fontWeight: "800", fontSize: 11 },
  foundationSub: { color: MUTED, fontSize: 10 },
  foundationNotice: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: PALE, borderRadius: 9, padding: 9 },
  foundationNoticeText: { color: INK, fontSize: 10, flex: 1 },
  evidenceToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 40, paddingHorizontal: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 10 },
  evidenceToggleText: { color: INK, fontWeight: "800", fontSize: 11 },
  evidenceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  evidenceMetric: { flexBasis: 115, flexGrow: 1, minWidth: 108, gap: 5, borderWidth: 1, borderColor: BORDER, borderRadius: 10, backgroundColor: SURFACE, padding: 10 },
  evidenceNumber: { color: INK, fontSize: 18, fontWeight: "900" },
  evidenceCaption: { color: MUTED, fontSize: 9 },
  action: { minHeight: 47, margin: 11, marginTop: 0, borderWidth: 1, borderColor: "#C1D9E2", borderRadius: 11, backgroundColor: "#E9F2F5", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  actionText: { color: "#326D84", fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.7 },
});
