import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiText } from "@/src/demo/fullUi";
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

export function JourneySymbol({
  node,
  large = false,
}: {
  node: AchievementNode;
  large?: boolean;
}) {
  const color = statusTone(node.status, workspaceColors.blue);
  const inactive = node.status === "locked";
  const size = large ? 62 : 46;
  const diamondSize = large ? 38 : 29;

  return (
    <View
      style={[
        styles.symbolFrame,
        { width: size, height: size, borderRadius: size / 2 },
        node.status === "verified" && styles.symbolVerified,
        { borderColor: inactive ? "#263647" : `${color}78`, shadowColor: color },
      ]}
    >
      {node.status === "verified" ? <View style={styles.verifiedHalo} /> : null}
      <View
        style={[
          styles.diamond,
          {
            width: diamondSize,
            height: diamondSize,
            borderColor: inactive ? "#3C4B5B" : color,
            backgroundColor: isCompleted(node.status) ? "#0C2841" : "#0B151F",
          },
        ]}
      >
        <Ionicons
          name={inactive ? "lock-closed-outline" : node.icon}
          size={large ? 22 : 17}
          color={inactive ? "#657486" : color}
          style={styles.icon}
        />
      </View>
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
  const label = uiText(
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

  return (
    <View style={styles.board} testID={`profession-tree-${tree.id}`}>
      <View style={styles.origin}>
        <View style={styles.originGlow} />
        <View style={styles.originSymbol}>
          <Ionicons name={tree.icon} size={25} color="#9CCFFF" />
        </View>
        <Text style={styles.originCaption}>
          {uiText(language, "PERCURSO", "JOURNEY")}
        </Text>
        <View style={styles.originStem} />
      </View>

      <TimelineSection
        title={uiText(language, "Certificações", "Certifications")}
        icon="ribbon-outline"
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
          "Toca num ícone para consultar a etapa ou associar um comprovativo.",
          "Tap an icon to view the step or attach supporting evidence.",
        )}
      </Text>
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

  const initialCount = Math.min(
    ordered.length,
    Math.max(compact ? 4 : 6, completed + 2),
  );
  const visible = expanded ? ordered : ordered.slice(0, initialCount);
  const hidden = Math.max(0, ordered.length - visible.length);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Ionicons name={icon} size={15} color="#86BAEE" />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>
          {completed}/{ordered.length}
        </Text>
      </View>

      <View style={styles.timeline}>
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
      </View>

      {ordered.length > initialCount ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          style={({ pressed }) => [
            styles.expand,
            pressed && styles.expandPressed,
          ]}
        >
          <View style={styles.expandDot} />
          <Text style={styles.expandText}>
            {expanded
              ? uiText(language, "Mostrar menos", "Show less")
              : uiText(
                  language,
                  `Ver mais ${hidden} etapas`,
                  `View ${hidden} more steps`,
                )}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
            size={14}
            color="#8BA7C1"
          />
        </Pressable>
      ) : null}
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
    borderColor: "#1D3447",
    borderRadius: 18,
    backgroundColor: "#071019E8",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
    overflow: "hidden",
  },
  origin: {
    height: 118,
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  originGlow: {
    position: "absolute",
    top: 3,
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "#2388FF2E",
    backgroundColor: "#2388FF08",
  },
  originSymbol: {
    marginTop: 15,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#4B83B6",
    backgroundColor: "#0B2032",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2388FF",
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  originCaption: {
    marginTop: 7,
    color: "#7895AF",
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 2.1,
    fontWeight: "700",
  },
  originStem: {
    width: 1,
    height: 25,
    marginTop: 5,
    backgroundColor: "#355976",
  },
  section: {
    width: "100%",
  },
  sectionHeading: {
    minHeight: 38,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#28465E",
    backgroundColor: "#0A1722",
    zIndex: 2,
  },
  sectionTitle: {
    color: "#B9CDDE",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionCount: {
    color: "#6F8DA8",
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
    backgroundColor: "#29475F",
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
    color: "#D6E2EC",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  nodeTitleLocked: {
    color: "#7A8999",
  },
  nodeSubtitle: {
    color: "#7890A5",
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
    backgroundColor: "#07121C",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 2,
  },
  symbolVerified: {
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  verifiedHalo: {
    position: "absolute",
    width: "118%",
    height: "118%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4E8DCA55",
  },
  diamond: {
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    borderWidth: 1,
  },
  icon: {
    transform: [{ rotate: "-45deg" }],
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
  gatewayLabel: {
    color: "#6F8BA3",
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
    backgroundColor: "#17314A66",
  },
  expandDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4B84B6",
  },
  expandText: {
    color: "#8BA7C1",
    fontSize: 10,
    lineHeight: 16,
  },
  instruction: {
    color: "#6F879C",
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderColor: "#192D3E",
  },
  pressed: {
    opacity: 0.72,
    backgroundColor: "#12304A2B",
  },
});
