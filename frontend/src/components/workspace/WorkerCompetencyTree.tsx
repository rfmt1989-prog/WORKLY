import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiText } from "@/src/demo/fullUi";
import type { LanguageCode } from "@/src/demo/types";
import { JourneyStatus, JourneySymbol } from "./WorkerJourneyTree";
import type { AchievementNode } from "./workerCertificateTree";
import type {
  CompetencyAssessment,
  WorkerCompetencyAssessment,
} from "./workerCompetencyEngine";
import { competencyProfileFor } from "./competencyFramework";
import { evidenceTypes, proficiencyCriterion } from "./competencyEvidenceModel";

function toAchievement(item: CompetencyAssessment): AchievementNode {
  const stage =
    item.competency.dimension === "knowledge"
      ? "foundation"
      : item.competency.dimension === "responsibility"
        ? "responsibility"
        : item.competency.dimension === "diagnostic"
          ? "technical"
          : "base";

  const status =
    item.evidenceState === "verified"
      ? "verified"
      : item.evidenceState === "pending"
        ? "pending"
        : item.evidenceState === "recorded" || item.evidenceState === "declared"
          ? "recorded"
          : "available";

  return {
    id: item.competency.id,
    title: item.competency.title,
    subtitle: item.competency.description,
    icon: item.competency.icon,
    status,
    stage,
    family: item.competency.relation,
    scope:
      item.competency.relation === "essential"
        ? "Competência essencial da profissão"
        : "Competência opcional / contextual",
    kind: "skill",
    certificate: item.certificate,
    meta: [
      `Proficiência WORKLY · ${item.proficiency}/4 · ${item.proficiencyLabel}`,
      ...evidenceTypes
        .filter((type) => (item.evidenceByType[type.id] || 0) > 0)
        .map((type) => `${type.label}: ${item.evidenceByType[type.id] || 0}`),
      item.proficiency < 4
        ? `Próximo nível: ${proficiencyCriterion(item.proficiency + 1).headline}`
        : "Nível máximo de proficiência interna atingido.",
      ...(item.proficiency < 4
        ? proficiencyCriterion(item.proficiency + 1).requirements
        : proficiencyCriterion(4).requirements),
      item.competency.critical
        ? "Competência crítica para a cobertura nuclear da profissão."
        : "Competência opcional/contextual: melhora o perfil, mas não substitui o núcleo essencial.",
    ],
  };
}

export function WorkerCompetencyTree({
  assessment,
  language,
  onNode,
}: {
  assessment: WorkerCompetencyAssessment;
  language: LanguageCode;
  onNode: (node: AchievementNode) => void;
}) {
  const text = (pt: string, en: string) => uiText(language, pt, en);
  const profile = competencyProfileFor(assessment.professionId);
  if (!profile) return null;

  const essential = assessment.competencies.filter(
    (item) => item.competency.relation === "essential",
  );
  const optional = assessment.competencies.filter(
    (item) => item.competency.relation === "optional",
  );

  return (
    <View style={styles.shell} testID="worker-competency-tree">
      <View style={styles.header}>
        <View style={styles.headerMark}>
          <Ionicons name="git-branch-outline" size={20} color="#8BC7FF" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            {text("MAPA DE COMPETÊNCIAS", "COMPETENCY MAP")}
          </Text>
          <Text style={styles.title}>{text(profile.title, profile.titleEn)}</Text>
          <Text style={styles.subtitle}>
            {text(profile.frameworkNote, profile.frameworkNoteEn)}
          </Text>
        </View>
        <View style={styles.coverage}>
          <Text style={styles.coverageValue}>{assessment.coreCoverage}%</Text>
          <Text style={styles.coverageLabel}>
            {text("núcleo", "core")}
          </Text>
        </View>
      </View>

      <CompetencySection
        title={text("Competências essenciais", "Essential competences")}
        subtitle={text(
          "São necessárias para representar a profissão de forma credível.",
          "Required to represent the occupation credibly.",
        )}
        items={essential}
        language={language}
        onNode={onNode}
      />

      {optional.length ? (
        <CompetencySection
          title={text("Competências opcionais", "Optional competences")}
          subtitle={text(
            "Dependem do contexto, empresa, especialização ou tipo de trabalho.",
            "Depend on context, employer, specialism or type of work.",
          )}
          items={optional}
          language={language}
          onNode={onNode}
          optional
        />
      ) : null}

      <View style={styles.legend}>
        <LegendItem value="0" label={text("Não avaliada", "Not assessed")} />
        <LegendItem value="1" label={text("Documentada", "Documented")} />
        <LegendItem value="2" label={text("Demonstrada", "Demonstrated")} />
        <LegendItem value="3" label={text("Avançada", "Advanced")} />
        <LegendItem value="4" label={text("Referência", "Reference")} />
      </View>
    </View>
  );
}

function CompetencySection({
  title,
  subtitle,
  items,
  language,
  onNode,
  optional = false,
}: {
  title: string;
  subtitle: string;
  items: CompetencyAssessment[];
  language: LanguageCode;
  onNode: (node: AchievementNode) => void;
  optional?: boolean;
}) {
  const text = (pt: string, en: string) => uiText(language, pt, en);

  return (
    <View style={[styles.section, optional && styles.sectionOptional]}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.sectionCount}>
          {items.filter((item) => item.evidenceState === "verified").length}/
          {items.length}
        </Text>
      </View>
      <View style={styles.timeline}>
        {items.map((item, index) => {
          const node = toAchievement(item);
          return (
            <Pressable
              key={item.competency.id}
              accessibilityRole="button"
              onPress={() => onNode(node)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.lane}>
                <View
                  style={[
                    styles.rail,
                    index === 0 && styles.railFirst,
                    index === items.length - 1 && styles.railLast,
                    item.evidenceState === "verified" && styles.railVerified,
                  ]}
                />
                <JourneySymbol node={node} />
              </View>
              <View style={styles.rowCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.nodeTitle}>
                    {language === "pt"
                      ? item.competency.title
                      : item.competency.titleEn}
                  </Text>
                  {item.competency.critical ? (
                    <View style={styles.criticalChip}>
                      <Text style={styles.criticalText}>
                        {text("NÚCLEO", "CORE")}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.levelValue}>{item.proficiency}/4</Text>
                  <Text style={styles.levelLabel}>
                    {language === "pt"
                      ? item.proficiencyLabel
                      : item.proficiencyLabelEn}
                  </Text>
                  <Text style={styles.summaryDot}>·</Text>
                  <Text style={styles.evidenceCount}>{item.evidenceCount}</Text>
                  <Text style={styles.evidenceLabel}>{text("provas", "evidence")}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LegendItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <Text style={styles.legendValue}>{value}</Text>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderColor: "#183247",
    borderRadius: 22,
    backgroundColor: "#050B11F2",
    padding: 16,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2D5878",
    backgroundColor: "#071725",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: {
    color: "#6F90AA",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.7,
    fontWeight: "700",
  },
  title: {
    color: "#E6EFF7",
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
  },
  subtitle: { color: "#7E96A9", fontSize: 10, lineHeight: 16 },
  coverage: { alignItems: "flex-end" },
  coverageValue: {
    color: "#8BC7FF",
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "700",
  },
  coverageLabel: { color: "#68849A", fontSize: 9, lineHeight: 13 },
  section: {
    borderTopWidth: 1,
    borderTopColor: "#162B3B",
    paddingTop: 14,
    gap: 8,
  },
  sectionOptional: { opacity: 0.9 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  sectionTitle: {
    color: "#C8D8E5",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#6F879B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
    maxWidth: 620,
  },
  sectionCount: {
    color: "#739AB9",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },
  timeline: { paddingTop: 2 },
  row: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
  },
  rowPressed: { backgroundColor: "#0C223455" },
  lane: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  rail: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#1B3345",
  },
  railVerified: { backgroundColor: "#2F6F9B" },
  railFirst: { top: 46 },
  railLast: { bottom: 46 },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingVertical: 10,
    paddingLeft: 8,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  nodeTitle: {
    color: "#D7E4EE",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  criticalChip: {
    borderWidth: 1,
    borderColor: "#355E7D",
    backgroundColor: "#0A1B29",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  criticalText: {
    color: "#78B5E7",
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  summaryLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },
  summaryDot: { color: "#40576B", fontSize: 9, lineHeight: 12 },
  evidenceCount: { color: "#88B9E2", fontSize: 9, lineHeight: 12, fontWeight: "700" },
  evidenceLabel: { color: "#647D91", fontSize: 8, lineHeight: 12 },
  levelValue: {
    color: "#8EC8F8",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  levelLabel: { color: "#6E879C", fontSize: 8, lineHeight: 12 },
  legend: {
    borderTopWidth: 1,
    borderTopColor: "#162B3B",
    paddingTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#1C3346",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legendValue: {
    color: "#8DC7F7",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
  },
  legendLabel: { color: "#71899C", fontSize: 8, lineHeight: 12 },
});
