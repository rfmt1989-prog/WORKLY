import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Polygon } from "react-native-svg";
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
  const family = `${node.id} ${node.family} ${node.title}`.toLowerCase();
  const skill = node.kind === "skill";

  if (skill) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M6 12L12 6L18 12L12 18Z" fill="none" stroke={color} strokeWidth="1.4" />
        <Circle cx="6" cy="12" r="1.8" fill={color} />
        <Circle cx="12" cy="6" r="1.8" fill={color} />
        <Circle cx="18" cy="12" r="1.8" fill={color} />
        <Circle cx="12" cy="18" r="1.8" fill={color} />
      </Svg>
    );
  }

  if (/electr|h0b0|b1|b2|loto/.test(family)) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M13.7 2.8L6.8 12.2H11L9.9 21.2L17.4 10.5H13.1L13.7 2.8Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (/hvac|refrig|fgas|climat|snow/.test(family)) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 3V21M4.2 7.5L19.8 16.5M4.2 16.5L19.8 7.5" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
        <Circle cx="12" cy="12" r="2" fill="none" stroke={color} strokeWidth="1.25" />
      </Svg>
    );
  }

  if (/atex|chem|risk|safety|vca|scc|first-aid/.test(family)) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Polygon points="12,3 21,12 12,21 3,12" fill="none" stroke={color} strokeWidth="1.3" />
        <Path d="M12 7.5V13.5M12 16.7V16.9" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      </Svg>
    );
  }

  if (/ipaf|lift|rigg|crane|fork|platform|height/.test(family)) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M5 18H19M7 16L12 7L17 16M12 7V4M9.7 6.3L12 4L14.3 6.3" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (node.kind === "profession") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Polygon points="12,3 19,8 17,17 12,21 7,17 5,8" fill="none" stroke={color} strokeWidth="1.35" />
        <Path d="M8 12H16M12 8V16" stroke={color} strokeWidth="1.15" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points="12,3 19.5,7.5 19.5,16.5 12,21 4.5,16.5 4.5,7.5" fill="none" stroke={color} strokeWidth="1.25" />
      <Circle cx="12" cy="12" r="2.2" fill="none" stroke={color} strokeWidth="1.25" />
      <Path d="M12 5.8V8M12 16V18.2M5.9 12H8M16 12H18.1" stroke={color} strokeWidth="1.05" strokeLinecap="round" />
    </Svg>
  );
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
  const tone = inactive ? "#536273" : color;

  return (
    <View
      style={[
        styles.symbolFrame,
        { width: size, height: size, borderRadius: size / 2 },
        node.status === "verified" && styles.symbolVerified,
        { borderColor: inactive ? "#243341" : `${color}5C`, shadowColor: color },
      ]}
    >
      <View style={[styles.crosshairH, { backgroundColor: inactive ? "#1E2A35" : `${color}30` }]} />
      <View style={[styles.crosshairV, { backgroundColor: inactive ? "#1E2A35" : `${color}30` }]} />
      {node.status === "verified" ? <View style={styles.verifiedHalo} /> : null}
      <View
        style={[
          styles.diamond,
          {
            width: core,
            height: core,
            borderColor: inactive ? "#344352" : tone,
            backgroundColor: isCompleted(node.status) ? "#0A2032" : "#08121B",
          },
        ]}
      >
        <View style={styles.icon}>
          {inactive ? (
            <Ionicons name="lock-closed-outline" size={large ? 18 : 14} color="#627184" />
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

  return (
    <View style={styles.board} testID={`profession-tree-${tree.id}`}>
      <View style={styles.origin}>
        <View style={styles.originGlow} />
        <View style={styles.originSymbol}>
          <TechGlyph node={tree.root} size={28} color="#A8D8FF" />
        </View>
        <Text style={styles.originCaption}>
          {uiText(language, "PERCURSO", "JOURNEY")}
        </Text>
        <View style={styles.originStem} />
      </View>

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
    borderColor: "#183247",
    borderRadius: 22,
    backgroundColor: "#050B11F2",
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
    borderColor: "#3E76A6",
    backgroundColor: "#071724",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2388FF",
    shadowOpacity: 0.26,
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
    borderColor: "#1E4058",
    backgroundColor: "#07131D",
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
    backgroundColor: "#214157",
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
    backgroundColor: "#050D14",
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
    width: "124%",
    height: "124%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#6DBBFF38",
  },
  crosshairH: { position: "absolute", width: "124%", height: 1 },
  crosshairV: { position: "absolute", height: "124%", width: 1 },
  verifyDot: { position: "absolute", right: 2, top: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: "#A8D8FF", shadowColor: "#2388FF", shadowOpacity: .65, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
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
