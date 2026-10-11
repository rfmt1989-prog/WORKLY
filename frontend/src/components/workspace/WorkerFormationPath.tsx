import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { professionalText } from "@/src/demo/professionalI18n";
import type { Certificate, LanguageCode, Worker } from "@/src/demo/types";
import { JourneyStatus, JourneySymbol } from "./WorkerJourneyTree";
import type { AchievementNode, AchievementStatus } from "./workerCertificateTree";

const formationStages = [
  {
    id: "formation-apprenticeship",
    title: "Aprendizagem",
    titleEn: "Apprenticeship",
    subtitle: "Entrada na profissão · aprendizagem prática e acompanhada",
    subtitleEn: "Entry into the trade · supervised practical learning",
    icon: "hammer-outline" as const,
    aliases: ["aprendizagem", "aprendiz", "apprenticeship", "apprentice"],
  },
  {
    id: "formation-technological-course",
    title: "Curso Tecnológico",
    titleEn: "Technological course",
    subtitle: "Formação técnica estruturada ligada à profissão",
    subtitleEn: "Structured technical education linked to the trade",
    icon: "school-outline" as const,
    aliases: [
      "curso tecnologico",
      "curso tecnológico",
      "technological course",
      "curso tecnico",
      "curso técnico",
      "technical course",
      "tecnico",
      "técnico",
      "technician",
    ],
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function evidenceFor(
  worker: Worker,
  stage: (typeof formationStages)[number],
): Certificate | undefined {
  return worker.certificates.find((item) => {
    if (item.competency_id === stage.id || item.node_id === stage.id) return true;
    if (item.evidence_type && item.evidence_type !== "qualification") return false;
    const name = normalize(item.name);
    return stage.aliases.some((alias) => name.includes(normalize(alias)));
  });
}

function statusFor(evidence?: Certificate): AchievementStatus {
  if (!evidence) return "available";
  if (evidence.status === "verified") return "verified";
  if (evidence.status === "pending") return "pending";
  return "recorded";
}

export function workerFormationNodes(
  worker: Worker,
  language: LanguageCode,
): AchievementNode[] {
  const text = (pt: string, en: string) => professionalText(language, pt, en);

  return formationStages.map((stage) => {
    const certificate = evidenceFor(worker, stage);
    return {
      id: stage.id,
      title: text(stage.title, stage.titleEn),
      subtitle: text(stage.subtitle, stage.subtitleEn),
      icon: stage.icon,
      status: statusFor(certificate),
      stage: "foundation",
      family: "professional-formation",
      scope: text("Formação profissional", "Professional education"),
      certificate,
      kind: "certification",
      meta: [
        text(
          "Etapa formativa do percurso profissional.",
          "Education stage in the professional journey.",
        ),
        text(
          "A progressão técnica continua a ser avaliada pelas competências e provas de trabalho.",
          "Technical progression continues to be assessed through competences and work evidence.",
        ),
      ],
    };
  });
}

export function WorkerFormationPath({
  worker,
  language,
  onNode,
}: {
  worker: Worker;
  language: LanguageCode;
  onNode: (node: AchievementNode) => void;
}) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const nodes = workerFormationNodes(worker, language);
  const completed = nodes.filter(
    (node) => node.status === "verified" || node.status === "recorded",
  ).length;

  return (
    <View style={styles.shell} testID="worker-formation-path">
      <View style={styles.header}>
        <View style={styles.headerMark}>
          <Ionicons name="school-outline" size={20} color="#8BC7FF" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            {text("INÍCIO DO PERCURSO", "JOURNEY FOUNDATION")}
          </Text>
          <Text style={styles.title}>
            {text("Formação de base", "Foundation education")}
          </Text>
          <Text style={styles.subtitle}>
            {text(
              "O percurso profissional começa pela aprendizagem e formação técnica antes da progressão por competências.",
              "The professional journey starts with apprenticeship and technical education before competence progression.",
            )}
          </Text>
        </View>
        <Text style={styles.count}>{completed}/2</Text>
      </View>

      <View style={styles.timeline}>
        {nodes.map((node, index) => (
          <Pressable
            key={node.id}
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
                  index === nodes.length - 1 && styles.railLast,
                  node.status === "verified" && styles.railVerified,
                ]}
              />
              <JourneySymbol node={node} />
            </View>
            <View style={styles.copy}>
              <View style={styles.stepRow}>
                <Text style={styles.step}>0{index + 1}</Text>
                <Text style={styles.nodeTitle}>{node.title}</Text>
              </View>
              <Text style={styles.nodeSubtitle}>{node.subtitle}</Text>
              <JourneyStatus node={node} language={language} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.gateway}>
        <View style={styles.gatewayLine} />
        <View style={styles.gatewayDiamond} />
        <Text style={styles.gatewayText}>
          {text("COMPETÊNCIAS PROFISSIONAIS", "PROFESSIONAL COMPETENCES")}
        </Text>
        <View style={styles.gatewayLine} />
      </View>
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
    gap: 12,
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
  subtitle: {
    color: "#7E96A9",
    fontSize: 10,
    lineHeight: 16,
    maxWidth: 620,
  },
  count: {
    color: "#8BC7FF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  timeline: {
    borderTopWidth: 1,
    borderTopColor: "#162B3B",
    paddingTop: 5,
  },
  row: {
    minHeight: 94,
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
  railFirst: { top: 47 },
  railLast: { bottom: 47 },
  railVerified: { backgroundColor: "#2F6F9B" },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingVertical: 10,
    paddingLeft: 8,
    gap: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  step: {
    color: "#547895",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  nodeTitle: {
    color: "#D7E4EE",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  nodeSubtitle: {
    color: "#6F879B",
    fontSize: 9,
    lineHeight: 14,
  },
  gateway: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 8,
  },
  gatewayLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#223B50",
  },
  gatewayDiamond: {
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: "#4B7DA8",
    backgroundColor: "#0A1722",
    transform: [{ rotate: "45deg" }],
  },
  gatewayText: {
    color: "#6F8BA3",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.4,
    fontWeight: "700",
  },
});
