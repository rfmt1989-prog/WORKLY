import Ionicons from "./WorklyIcon";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { levelText, professionalText } from "@/src/demo/professionalI18n";
import type { LanguageCode } from "@/src/demo/types";
import type { WorkerCompetencyAssessment } from "./workerCompetencyEngine";

export function WorkerEvidenceScoreCard({
  assessment,
  language,
  onDetails,
}: {
  assessment: WorkerCompetencyAssessment;
  language: LanguageCode;
  onDetails: () => void;
}) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card} testID="worker-evidence-score">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.top, pressed && styles.topPressed]}
      >
        <View style={styles.levelBlock}>
          <Text style={styles.eyebrow}>
            {text("NÍVEL PROFISSIONAL WORKLY", "WORKLY PROFESSIONAL LEVEL")}
          </Text>
          <Text style={styles.level}>
            {levelText(language, assessment.levelId, assessment.levelLabel, assessment.levelLabelEn)}
          </Text>
          {expanded ? (
            <Text style={styles.note}>
              {text(
                "Baseado em evidência + critérios mínimos. Não é um nível EQF oficial.",
                "Based on evidence + minimum gates. It is not an official EQF level.",
              )}
            </Text>
          ) : null}
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>
            {assessment.score}
            <Text style={styles.scoreMax}>/100</Text>
          </Text>
          <View style={styles.scoreLabelRow}>
            <Text style={styles.scoreLabel}>
              {text("WORKLY VALUE", "WORKLY VALUE")}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={14}
              color="#D3B9A3"
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <>
      <View style={styles.metrics}>
        <Metric
          icon="git-branch-outline"
          value={`${assessment.coreCoverage}%`}
          label={text("Cobertura essencial", "Essential coverage")}
        />
        <Metric
          icon="briefcase-outline"
          value={`${Math.round(assessment.verifiedExperienceHours)} h`}
          label={text("Experiência WORKLY", "WORKLY experience")}
        />
        <Metric
          icon="ribbon-outline"
          value={String(assessment.verifiedQualifications)}
          label={text("Qualificações", "Qualifications")}
        />

      </View>

      <View style={styles.components}>
        {assessment.components.map((item) => (
          <View key={item.id} style={styles.component}>
            <View style={styles.componentTop}>
              <Text style={styles.componentName}>
                {text(item.label, item.labelEn)}
              </Text>
              <Text style={styles.componentValue}>
                {item.points}/{item.maximum}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(
                      100,
                      Math.round((item.points / item.maximum) * 100),
                    )}%`,
                  },
                ]}
              />
            </View>

          </View>
        ))}
      </View>

      {assessment.nextLevelId && assessment.missingGates.length ? (
        <View style={styles.gates}>
          <Ionicons name="lock-open-outline" size={14} color="#C96954" />
          <Text style={styles.gateText}>
            {assessment.missingGates.length}{" "}
            {text(
              "critério(s) em falta para o próximo nível",
              "criterion/criteria remaining for the next level",
            )}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onDetails}
        style={({ pressed }) => [
          styles.detailsButton,
          pressed && styles.detailsPressed,
        ]}
      >
        <Text style={styles.detailsText}>
          {text("Ver critérios de avaliação", "View assessment criteria")}
        </Text>
        <Ionicons name="arrow-forward-outline" size={13} color="#D3B9A3" />
      </Pressable>
        </>
      ) : null}
    </View>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={14} color="#D9B395" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#40596A",
    borderRadius: 6,
    backgroundColor: "#172736",
    padding: 18,
    gap: 18,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
    borderRadius: 3,
  },
  topPressed: { opacity: 0.78 },
  levelBlock: { flex: 1, minWidth: 220, gap: 4 },
  eyebrow: {
    color: "#91C9DD",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.7,
    fontWeight: "700",
  },
  level: {
    color: "#EDF5F7",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "500",
    letterSpacing: 2,
  },
  note: { color: "#AEC2CB", fontSize: 9, lineHeight: 14, maxWidth: 520 },
  score: { alignItems: "flex-end" },
  scoreLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreValue: {
    color: "#EDF5F7",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "700",
  },
  scoreMax: { color: "#AEC2CB", fontSize: 14, fontWeight: "500" },
  scoreLabel: {
    color: "#AEC2CB",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metric: {
    flexGrow: 1,
    minWidth: 130,
    borderWidth: 1,
    borderColor: "#40596A",
    backgroundColor: "#223747",
    borderRadius: 3,
    padding: 11,
    gap: 3,
  },
  metricValue: {
    color: "#EDF5F7",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  metricLabel: { color: "#AEC2CB", fontSize: 8, lineHeight: 12 },
  components: { gap: 10 },
  component: { gap: 4 },
  componentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  componentName: { color: "#EDF5F7", fontSize: 10, lineHeight: 14 },
  componentValue: {
    color: "#EDF5F7",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
  },
  track: {
    height: 2,
    borderRadius: 1,
    backgroundColor: "#223747",
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#223747" },
  gates: {
    borderTopWidth: 1,
    borderTopColor: "#40596A",
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  gateText: { color: "#EDF5F7", fontSize: 9, lineHeight: 14 },
  detailsButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#40596A",
    paddingTop: 10,
  },
  detailsPressed: { opacity: 0.7 },
  detailsText: { color: "#EDF5F7", fontSize: 10, lineHeight: 14 },
});
