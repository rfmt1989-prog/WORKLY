import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiText } from "@/src/demo/fullUi";
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
  const text = (pt: string, en: string) => uiText(language, pt, en);

  return (
    <View style={styles.card} testID="worker-evidence-score">
      <View style={styles.top}>
        <View style={styles.levelBlock}>
          <Text style={styles.eyebrow}>
            {text("NÍVEL PROFISSIONAL WORKLY", "WORKLY PROFESSIONAL LEVEL")}
          </Text>
          <Text style={styles.level}>
            {language === "pt" ? assessment.levelLabel : assessment.levelLabelEn}
          </Text>
          <Text style={styles.note}>
            {text(
              "Baseado em evidência + critérios mínimos. Não é um nível EQF oficial.",
              "Based on evidence + minimum gates. It is not an official EQF level.",
            )}
          </Text>
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>
            {assessment.score}
            <Text style={styles.scoreMax}>/100</Text>
          </Text>
          <Text style={styles.scoreLabel}>
            {text("WORKLY VALUE", "WORKLY VALUE")}
          </Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric
          icon="git-branch-outline"
          value={`${assessment.coreCoverage}%`}
          label={text("Cobertura essencial", "Essential coverage")}
        />
        <Metric
          icon="briefcase-outline"
          value={
            assessment.verifiedExperienceMonths >= 12
              ? `${(assessment.verifiedExperienceMonths / 12).toFixed(1)}a`
              : `${Math.round(assessment.verifiedExperienceMonths)}m`
          }
          label={text("Experiência verificada", "Verified experience")}
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
                {language === "pt" ? item.label : item.labelEn}
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
          <Ionicons name="lock-open-outline" size={14} color="#82BDF0" />
          <Text style={styles.gateText}>
            {text(
              `${assessment.missingGates.length} critério(s) em falta para o próximo nível`,
              `${assessment.missingGatesEn.length} criterion/criteria remaining for the next level`,
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
        <Ionicons name="arrow-forward-outline" size={13} color="#7EA9CB" />
      </Pressable>
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
      <Ionicons name={icon} size={14} color="#70AEE2" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#1B374D",
    borderRadius: 20,
    backgroundColor: "#071019E8",
    padding: 18,
    gap: 18,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
  },
  levelBlock: { flex: 1, minWidth: 220, gap: 4 },
  eyebrow: {
    color: "#7192AD",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.7,
    fontWeight: "700",
  },
  level: {
    color: "#E6EFF7",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  note: { color: "#72889B", fontSize: 9, lineHeight: 14, maxWidth: 520 },
  score: { alignItems: "flex-end" },
  scoreValue: {
    color: "#8FCBFF",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "700",
  },
  scoreMax: { color: "#67849D", fontSize: 14, fontWeight: "500" },
  scoreLabel: {
    color: "#6D8AA3",
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
    borderColor: "#193247",
    backgroundColor: "#060D14",
    borderRadius: 12,
    padding: 11,
    gap: 3,
  },
  metricValue: {
    color: "#CFE2F1",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  metricLabel: { color: "#698298", fontSize: 8, lineHeight: 12 },
  components: { gap: 10 },
  component: { gap: 4 },
  componentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  componentName: { color: "#AFC2D2", fontSize: 10, lineHeight: 14 },
  componentValue: {
    color: "#8EBFE8",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
  },
  track: {
    height: 2,
    borderRadius: 1,
    backgroundColor: "#172B3A",
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#4E9DDB" },
  gates: {
    borderTopWidth: 1,
    borderTopColor: "#173044",
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  gateText: { color: "#8299AC", fontSize: 9, lineHeight: 14 },
  detailsButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#173044",
    paddingTop: 10,
  },
  detailsPressed: { opacity: 0.7 },
  detailsText: { color: "#7EA9CB", fontSize: 10, lineHeight: 14 },
});
