import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { professionalText } from "@/src/demo/professionalI18n";
import type { Certificate, LanguageCode, Worker } from "@/src/demo/types";
import { JourneyStatus, JourneySymbol } from "./WorkerJourneyTree";
import type {
  AchievementNode,
  AchievementStatus,
} from "./workerCertificateTree";

const apprenticeshipRequirements = [
  {
    id: "formation-professional-course",
    title: "Curso Profissional / Tecnológico",
    titleEn: "Professional / technological course",
    subtitle: "Formação técnica estruturada ligada à profissão",
    subtitleEn: "Structured technical education linked to the trade",
    icon: "school-outline" as const,
    kind: "certification" as const,
    evidenceType: "qualification",
    aliases: [
      "curso profissional",
      "professional course",
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
  {
    id: "formation-internship",
    title: "Estágio",
    titleEn: "Internship",
    subtitle: "Prática supervisionada em contexto real de trabalho",
    subtitleEn: "Supervised practice in a real work environment",
    icon: "briefcase-outline" as const,
    kind: "skill" as const,
    evidenceType: "work_record",
    aliases: [
      "estagio",
      "estágio",
      "internship",
      "work placement",
      "practical placement",
      "pratica profissional",
      "prática profissional",
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
  requirement: (typeof apprenticeshipRequirements)[number],
): Certificate | undefined {
  return worker.certificates.find((item) => {
    if (
      item.competency_id === requirement.id ||
      item.node_id === requirement.id
    ) {
      return true;
    }

    if (
      item.evidence_type &&
      item.evidence_type !== requirement.evidenceType
    ) {
      return false;
    }

    const name = normalize(item.name);
    return requirement.aliases.some((alias) =>
      name.includes(normalize(alias)),
    );
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
  const text = (pt: string, en: string) =>
    professionalText(language, pt, en);

  return apprenticeshipRequirements.map((requirement) => {
    const certificate = evidenceFor(worker, requirement);
    return {
      id: requirement.id,
      title: text(requirement.title, requirement.titleEn),
      subtitle: text(requirement.subtitle, requirement.subtitleEn),
      icon: requirement.icon,
      status: statusFor(certificate),
      stage: "foundation",
      family: "apprenticeship-requirement",
      scope: "I",
      certificate,
      kind: requirement.kind,
      meta: [
        text(
          "Requisito do nível I.",
          "Requirement of level I.",
        ),
        requirement.id === "formation-professional-course"
          ? text(
              "Comprovado por diploma, certificado profissional ou formação tecnológica equivalente.",
              "Supported by a diploma, professional certificate or equivalent technological education.",
            )
          : text(
              "Comprovado por estágio curricular/profissional ou prática supervisionada equivalente.",
              "Supported by a curricular/professional internship or equivalent supervised practice.",
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
  const text = (pt: string, en: string) =>
    professionalText(language, pt, en);
  const nodes = workerFormationNodes(worker, language);
  const [expanded, setExpanded] = useState(false);
  const verified = nodes.filter((node) => node.status === "verified").length;
  const complete = verified === nodes.length;

  return (
    <View style={styles.shell} testID="worker-formation-path">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <View
          style={[
            styles.headerMark,
            complete && styles.headerMarkComplete,
          ]}
        >
          <Ionicons
            name={complete ? "checkmark-done-outline" : "school-outline"}
            size={20}
            color="#58798B"
          />
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            {text("NÍVEL WORKLY", "WORKLY LEVEL")}
          </Text>
          <Text style={styles.title}>I</Text>
          {expanded ? (
            <Text style={styles.subtitle}>
              {text(
                "Curso Profissional/Tecnológico + Estágio. Os dois requisitos formam o nível I.",
                "Professional/technological course + internship. Both requirements form level I.",
              )}
            </Text>
          ) : null}
        </View>

        <View style={styles.progress}>
          <Text style={styles.count}>{verified}/2</Text>
          <View style={styles.countLine}>
            <Text style={styles.countLabel}>
              {text("verificados", "verified")}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={14}
              color="#70818B"
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <>
      <View
        style={[
          styles.levelState,
          complete && styles.levelStateComplete,
        ]}
      >
        <Ionicons
          name={complete ? "shield-checkmark-outline" : "time-outline"}
          size={14}
          color={complete ? "#8FAE91" : "#E7C76E"}
        />
        <Text
          style={[
            styles.levelStateText,
            complete && styles.levelStateTextComplete,
          ]}
        >
          {complete
            ? text(
                "Nível I concluído",
                "Level I completed",
              )
            : text(
                "Nível I em progresso",
                "Level I in progress",
              )}
        </Text>
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
          {text(
            "DEPOIS: COMPETÊNCIAS PROFISSIONAIS",
            "NEXT: PROFESSIONAL COMPETENCES",
          )}
        </Text>
        <View style={styles.gatewayLine} />
      </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderColor: "#DDE5E8",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 3,
  },
  headerPressed: { opacity: 0.78 },
  headerMark: {
    width: 42,
    height: 42,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#DDE5E8",
    backgroundColor: "#E7EFF2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerMarkComplete: {
    borderColor: "#B8CDD7",
    backgroundColor: "#E7EFF2",
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: {
    color: "#58798B",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.7,
    fontWeight: "700",
  },
  title: {
    color: "#253842",
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "500",
    letterSpacing: 2,
  },
  subtitle: {
    color: "#70818B",
    fontSize: 10,
    lineHeight: 16,
    maxWidth: 620,
  },
  progress: {
    alignItems: "flex-end",
  },
  count: {
    color: "#70818B",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  countLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  countLabel: {
    color: "#70818B",
    fontSize: 8,
    lineHeight: 12,
  },
  levelState: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#DDE5E8",
    backgroundColor: "#F3F6F7",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  levelStateComplete: {
    borderColor: "#B8CDD7",
    backgroundColor: "#E7EFF2",
  },
  levelStateText: {
    color: "#253842",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
  },
  levelStateTextComplete: {
    color: "#253842",
  },
  timeline: {
    borderTopWidth: 1,
    borderTopColor: "#DDE5E8",
    paddingTop: 5,
  },
  row: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 2,
  },
  rowPressed: { backgroundColor: "#E7EFF2" },
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
    backgroundColor: "#F3F6F7",
  },
  railFirst: { top: 47 },
  railLast: { bottom: 47 },
  railVerified: { backgroundColor: "#E7EFF2" },
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
    color: "#70818B",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  nodeTitle: {
    color: "#253842",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  nodeSubtitle: {
    color: "#70818B",
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
    backgroundColor: "#F3F6F7",
  },
  gatewayDiamond: {
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: "#DDE5E8",
    backgroundColor: "#E7EFF2",
    transform: [{ rotate: "45deg" }],
  },
  gatewayText: {
    color: "#253842",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
});
