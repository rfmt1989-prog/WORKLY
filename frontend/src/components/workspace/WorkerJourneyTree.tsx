import Ionicons from "./WorklyIcon";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiText } from "@/src/demo/fullUi";
import { professionalText } from "@/src/demo/professionalI18n";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { LanguageCode } from "@/src/demo/types";
import { workspaceColors } from "./primitives";
import {
  isCompleted,
  statusIcon,
  statusLabel,
  statusTone,
  type AchievementNode,
  type ProfessionTree,
} from "./workerCertificateTree";

function TechGlyph({ node, size = 22, color }: { node: AchievementNode; size?: number; color: string }) {
  const family = (node.id + " " + node.family + " " + node.title).toLowerCase();
  const motif = /hvac|refrig|fgas|climat|frio/.test(family) ? "snow-outline"
    : /electr|h0b0|b1|b2|loto/.test(family) ? "flash-outline"
    : /atex|quim|chem|explosi/.test(family) ? "warning-outline"
    : /plataforma|ipaf|nacel/.test(family) ? "arrow-up-circle-outline"
    : /solar|fotovolta/.test(family) ? "sunny-outline"
    : /mecan|motor|industr/.test(family) ? "hardware-chip-outline"
    : node.icon;
  return <Ionicons name={motif} size={size} color={color} />;
}

export function JourneySymbol({
  node,
  large = false,
}: {
  node: AchievementNode;
  large?: boolean;
}) {
  const color = statusTone(node.status, workspaceColors.blue);
  const inactive = node.status === "locked";
  const size = large ? 68 : 50;
  const core = large ? 40 : 30;
  const tone = inactive ? "#97ABB4" : color;

  return (
    <View
      style={[
        styles.symbolFrame,
        { width: size, height: size, borderRadius: size / 2 },
        node.status === "verified" && styles.symbolVerified,
        { borderColor: inactive ? "#DCE5E9" : "#ABC7D1", shadowColor: color },
      ]}
    >
      <View style={[styles.crosshairH, { backgroundColor: inactive ? "#D7E3E7" : "#A9C5CF" }]} />
      <View style={[styles.crosshairV, { backgroundColor: inactive ? "#D7E3E7" : `${color}30` }]} />
      {node.status === "verified" ? <View style={styles.verifiedHalo} /> : null}
      <View
        style={[
          styles.diamond,
          {
            width: core,
            height: core,
            borderColor: inactive ? "#DCE5E9" : tone,
            backgroundColor: isCompleted(node.status) ? "#E4F0F2" : "#F6F9FA",
          },
        ]}
      >
        <View style={styles.icon}>
          {inactive ? (
            <Ionicons name="lock-closed-outline" size={large ? 18 : 14} color="#8FA4AD" />
          ) : (
            <TechGlyph node={node} size={large ? 24 : 18} color={tone} />
          )}
        </View>
      </View>
      {node.status === "verified" ? <View style={styles.verifyDot} /> : null}
    </View>
  );
}

export function JourneyStatus({
  node,
  language,
}: {
  node: AchievementNode;
  language: LanguageCode;
}) {
  const label = professionalText(
    language,
    statusLabel(node.status),
    node.status === "verified"
      ? "VERIFIED"
      : node.status === "recorded"
        ? "RECORDED"
        : node.status === "pending"
          ? "PENDING"
          : node.status === "locked"
            ? "NEXT STEP"
            : "TO ADD",
  );
  const color =
    node.status === "locked"
      ? "#718195"
      : statusTone(node.status, workspaceColors.blue);

  return (
    <View style={styles.status}>
      <Ionicons name={statusIcon(node.status)} size={10} color={color} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

export function WorkerJourneyTree({
  tree,
  language,
  stacked,
  onNode,
}: {
  tree: ProfessionTree;
  language: LanguageCode;
  stacked: boolean;
  onNode: (node: AchievementNode) => void;
}) {
  const completedCertifications = tree.certifications.filter(
    (node) => isCompleted(node.status) || node.status === "pending",
  ).length;
  const completedSkills = tree.additionalSkills.filter(
    (node) => isCompleted(node.status) || node.status === "pending",
  ).length;
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.board} testID={`profession-tree-${tree.id}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.origin, pressed && styles.originPressed]}
      >
        <View style={styles.originGlow} />
        <View style={styles.originSymbol}>
          <TechGlyph node={tree.root} size={28} color="#A8D8FF" />
        </View>
        <Text style={styles.originCaption}>
          {uiText(language, "PERCURSO", "JOURNEY")}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
          size={15}
          color="#8BA7C1"
        />
        {expanded ? <View style={styles.originStem} /> : null}
      </Pressable>

      {expanded ? (
        <>
      <TimelineSection
        title={uiText(language, "Percurso da profissão", "Trade progression")}
        icon="git-branch-outline"
        nodes={tree.certifications}
        completed={completedCertifications}
        language={language}
        stacked={stacked}
        onNode={onNode}
      />

      {tree.additionalSkills.length ? (
        <>
          <View style={styles.branchGateway}>
            <View style={styles.gatewayLine} />
            <View style={styles.gatewayDiamond} />
            <Text style={styles.gatewayLabel}>
              {uiText(language, "SKILLS DESBLOQUEADAS", "UNLOCKED SKILLS")}
            </Text>
            <View style={styles.gatewayLine} />
          </View>
          <TimelineSection
            title={uiText(language, "Competências", "Skills")}
            icon="sparkles-outline"
            nodes={tree.additionalSkills}
            completed={completedSkills}
            language={language}
            stacked={stacked}
            onNode={onNode}
            compact
          />
        </>
      ) : null}

      <Text style={styles.instruction}>
        {uiText(
          language,
          "Toca numa etapa para ver requisitos e associar um comprovativo.",
          "Tap a stage to view requirements and attach supporting evidence.",
        )}
      </Text>
        </>
      ) : null}
    </View>
  );
}

function TimelineSection({
  title,
  icon,
  nodes,
  completed,
  language,
  stacked,
  onNode,
  compact = false,
}: {
  title: string;
  icon: AchievementNode["icon"];
  nodes: AchievementNode[];
  completed: number;
  language: LanguageCode;
  stacked: boolean;
  onNode: (node: AchievementNode) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ordered = useMemo(
    () => [
      ...nodes.filter(
        (node) => isCompleted(node.status) || node.status === "pending",
      ),
      ...nodes.filter(
        (node) => !isCompleted(node.status) && node.status !== "pending",
      ),
    ],
    [nodes],
  );

  const visible = expanded ? ordered : [];
  const hidden = ordered.length;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [
          styles.sectionHeading,
          pressed && styles.sectionHeadingPressed,
        ]}
      >
        <Ionicons name={icon} size={15} color="#86BAEE" />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>
          {completed}/{ordered.length}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
          size={14}
          color="#8BA7C1"
        />
      </Pressable>

      {expanded ? <View style={styles.timeline}>
        {visible.map((node, index) => {
          const left = !stacked && index % 2 === 0;
          return (
            <Pressable
              key={node.id}
              accessibilityRole="button"
              accessibilityLabel={`${localizeDemoText(language, node.title)} · ${uiText(language, statusLabel(node.status), node.status)}`}
              onPress={() => onNode(node)}
              style={({ pressed }) => [
                styles.timelineRow,
                stacked && styles.timelineRowStacked,
                pressed && styles.pressed,
              ]}
              testID={`journey-node-${node.id}`}
            >
              {!stacked ? (
                <View style={[styles.side, styles.sideLeft]}>
                  {left ? (
                    <NodeLabel node={node} language={language} align="right" />
                  ) : null}
                </View>
              ) : null}

              <View style={[styles.lane, stacked && styles.laneStacked]}>
                <View
                  style={[
                    styles.rail,
                    index === 0 && styles.railFirst,
                    index === visible.length - 1 && styles.railLast,
                  ]}
                />
                <JourneySymbol node={node} />
              </View>

              <View
                style={[
                  styles.side,
                  stacked ? styles.sideStacked : styles.sideRight,
                ]}
              >
                {stacked || !left ? (
                  <NodeLabel
                    node={node}
                    language={language}
                    align={stacked ? "left" : "left"}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View> : null}
    </View>
  );
}

function NodeLabel({
  node,
  language,
  align,
}: {
  node: AchievementNode;
  language: LanguageCode;
  align: "left" | "right";
}) {
  return (
    <View
      style={[
        styles.nodeLabel,
        align === "right" && styles.nodeLabelRight,
        node.status === "verified" && styles.nodeLabelVerified,
      ]}
    >
      <Text
        style={[
          styles.nodeTitle,
          align === "right" && styles.textRight,
          node.status === "locked" && styles.nodeTitleLocked,
        ]}
        numberOfLines={2}
      >
        {localizeDemoText(language, node.title)}
      </Text>
      <Text
        style={[
          styles.nodeSubtitle,
          align === "right" && styles.textRight,
        ]}
        numberOfLines={1}
      >
        {localizeDemoText(language, node.subtitle)}
      </Text>
      <View style={align === "right" ? styles.statusRight : undefined}>
        <JourneyStatus node={node} language={language} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 1,
    borderColor: "#40596A",
    borderRadius: 22,
    backgroundColor: "#172736",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
    overflow: "hidden",
  },
  origin: {
    minHeight: 94,
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    borderRadius: 16,
  },
  originPressed: { opacity: 0.78 },
  originGlow: {
    position: "absolute",
    top: 3,
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "#40596A",
    backgroundColor: "#284354",
  },
  originSymbol: {
    marginTop: 15,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#40596A",
    backgroundColor: "#223747",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2388FF",
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  originCaption: {
    marginTop: 7,
    color: "#AEC2CB",
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 2.1,
    fontWeight: "700",
  },
  originStem: {
    width: 1,
    height: 25,
    marginTop: 5,
    backgroundColor: "#223747",
  },
  section: {
    width: "100%",
  },
  sectionHeading: {
    minHeight: 42,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#40596A",
    backgroundColor: "#172736",
    zIndex: 2,
  },
  sectionHeadingPressed: { opacity: 0.76 },
  sectionTitle: {
    color: "#EDF5F7",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionCount: {
    color: "#AEC2CB",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700",
  },
  timeline: {
    paddingTop: 5,
  },
  timelineRow: {
    minHeight: 96,
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  timelineRowStacked: {
    minHeight: 88,
  },
  side: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingVertical: 9,
  },
  sideLeft: {
    paddingRight: 12,
    alignItems: "flex-end",
  },
  sideRight: {
    paddingLeft: 12,
    alignItems: "flex-start",
  },
  sideStacked: {
    flex: 1,
    paddingLeft: 10,
    alignItems: "flex-start",
  },
  lane: {
    width: 74,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  laneStacked: {
    width: 58,
  },
  rail: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#223747",
  },
  railFirst: {
    top: 43,
  },
  railLast: {
    bottom: 43,
  },
  nodeLabel: {
    maxWidth: 320,
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  nodeLabelRight: {
    alignItems: "flex-end",
  },
  nodeLabelVerified: {
    shadowColor: "#2388FF",
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  nodeTitle: {
    color: "#EDF5F7",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  nodeTitleLocked: {
    color: "#AEC2CB",
  },
  nodeSubtitle: {
    color: "#AEC2CB",
    fontSize: 10,
    lineHeight: 15,
  },
  textRight: {
    textAlign: "right",
  },
  statusRight: {
    alignItems: "flex-end",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    fontSize: 8,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 0.45,
  },
  symbolFrame: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F9FA",
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 2,
  },
  symbolVerified: {
    shadowOpacity: 0.12,
    shadowRadius: 9,
  },
  verifiedHalo: {
    position: "absolute",
    width: "124%",
    height: "124%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C2D6DE",
  },
  crosshairH: { position: "absolute", width: "124%", height: 1 },
  crosshairV: { position: "absolute", height: "124%", width: 1 },
  verifyDot: { position: "absolute", right: 2, top: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: "#397B73", shadowColor: "#397B73", shadowOpacity: .15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  diamond: {
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    borderWidth: 1,
  },
  icon: {
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  branchGateway: {
    width: "100%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  gatewayLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#223747",
  },
  gatewayDiamond: {
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: "#40596A",
    backgroundColor: "#284354",
    transform: [{ rotate: "45deg" }],
  },
  gatewayLabel: {
    color: "#AEC2CB",
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.6,
    fontWeight: "700",
  },
  expand: {
    alignSelf: "center",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 13,
    marginTop: 3,
    borderRadius: 999,
  },
  expandPressed: {
    backgroundColor: "#284354",
  },
  expandDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#223747",
  },
  expandText: {
    color: "#EDF5F7",
    fontSize: 10,
    lineHeight: 16,
  },
  instruction: {
    color: "#AEC2CB",
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderColor: "#40596A",
  },
  pressed: {
    opacity: 0.72,
    backgroundColor: "#284354",
  },
});
