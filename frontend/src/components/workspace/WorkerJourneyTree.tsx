import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { uiText } from "@/src/demo/fullUi";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { LanguageCode } from "@/src/demo/types";
import { workspaceColors } from "./primitives";
import { isCompleted, statusIcon, statusLabel, statusTone, type AchievementNode, type ProfessionTree } from "./workerCertificateTree";

export function JourneySymbol({ node, large = false }: { node: AchievementNode; large?: boolean }) {
  const color = statusTone(node.status, workspaceColors.blue);
  return (
    <View style={[styles.symbolFrame, large && styles.symbolLarge]}>
      {node.status === "verified" ? <View style={styles.verifiedRing} /> : null}
      <View style={[styles.diamond, large && styles.diamondLarge, { borderColor: color, backgroundColor: isCompleted(node.status) ? "#133253" : "#101B26" }]}>
        <Ionicons name={node.status === "locked" ? "lock-closed-outline" : node.icon} size={large ? 25 : 21} color={node.status === "locked" ? "#738296" : color} style={styles.icon} />
      </View>
    </View>
  );
}

export function JourneyStatus({ node, language }: { node: AchievementNode; language: LanguageCode }) {
  const label = uiText(language, statusLabel(node.status), node.status === "verified" ? "VERIFIED" : node.status === "recorded" ? "RECORDED" : node.status === "pending" ? "PENDING" : node.status === "locked" ? "NEXT STEP" : "TO ADD");
  const color = node.status === "locked" ? "#78899D" : statusTone(node.status, workspaceColors.blue);
  return <View style={styles.status}><Ionicons name={statusIcon(node.status)} size={11} color={color} /><Text style={[styles.statusText, { color }]}>{label}</Text></View>;
}

export function WorkerJourneyTree({ tree, language, stacked, onNode }: {
  tree: ProfessionTree;
  language: LanguageCode;
  stacked: boolean;
  onNode: (node: AchievementNode) => void;
}) {
  return (
    <View style={styles.board} testID={`profession-tree-${tree.id}`}>
      <View style={styles.origin} pointerEvents="none" accessibilityElementsHidden>
        <Svg width="100%" height="68" viewBox="0 0 800 68" preserveAspectRatio="none">
          <Path d={stacked ? "M400 40 V68" : "M400 40 V52 M200 68 V52 H600 V68"} fill="none" stroke="#3A5975" strokeWidth="1" />
          <Circle cx="400" cy="40" r="3" fill="#579AD6" />
        </Svg>
        <View style={styles.originSymbol}><Ionicons name={tree.icon} size={20} color="#8ABDFA" /></View>
      </View>
      <View style={[styles.branches, stacked && styles.branchesStacked]}>
        <JourneyBranch nodes={tree.certifications} language={language} title={uiText(language, "Certificações", "Certifications")} icon="ribbon-outline" onNode={onNode} />
        <JourneyBranch nodes={tree.additionalSkills} language={language} title={uiText(language, "Competências", "Skills")} icon="sparkles-outline" onNode={onNode} />
      </View>
      <Text style={styles.instruction}>{uiText(language, "Seleciona uma etapa para consultar ou associar um comprovativo.", "Select a step to view or attach supporting evidence.")}</Text>
    </View>
  );
}

function JourneyBranch({ nodes, language, title, icon, onNode }: {
  nodes: AchievementNode[];
  language: LanguageCode;
  title: string;
  icon: AchievementNode["icon"];
  onNode: (node: AchievementNode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(0);
  const ordered = useMemo(() => [...nodes.filter(node => isCompleted(node.status) || node.status === "pending"), ...nodes.filter(node => !isCompleted(node.status) && node.status !== "pending")], [nodes]);
  const associatedCount = ordered.filter(node => isCompleted(node.status) || node.status === "pending").length;
  const initialCount = Math.max(4, associatedCount);
  const visible = expanded ? ordered : ordered.slice(0, initialCount);
  const columns = width >= 470 ? 3 : width >= 250 ? 2 : 1;
  const gap = 12;
  const nodeWidth = width ? (width - gap * (columns - 1)) / columns : undefined;
  const rows = Math.ceil(visible.length / columns);
  const rowHeight = 170;
  const hidden = Math.max(0, ordered.length - visible.length);
  const railWidth = width || 300;
  const cell = (railWidth - gap * (columns - 1)) / columns;
  const paths: string[] = [];
  for (let row = 0; row < rows; row++) {
    const count = Math.min(columns, visible.length - row * columns);
    const y = row * rowHeight + 32;
    paths.push(`M${railWidth / 2} ${row === 0 ? 0 : y - rowHeight} V${y}`);
    if (count > 0 && columns > 1) paths.push(`M${Math.min(cell / 2, railWidth / 2)} ${y} H${Math.max((count - 1) * (cell + gap) + cell / 2, railWidth / 2)}`);
  }
  return (
    <View style={styles.branch}>
      <View style={styles.branchHeading}><Ionicons name={icon} size={16} color="#8ABDFA" /><Text style={styles.branchTitle}>{title}</Text></View>
      {visible.length ? (
        <View style={styles.grid} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
          {width > 0 ? <View pointerEvents="none" accessibilityElementsHidden style={StyleSheet.absoluteFill}><Svg width={width} height={rows * rowHeight}>{paths.map((d, index) => <Path key={index} d={d} stroke="#2C445B" strokeWidth="1" fill="none" />)}</Svg></View> : null}
          {visible.map(node => (
            <Pressable key={node.id} accessibilityRole="button" accessibilityLabel={`${localizeDemoText(language, node.title)} · ${uiText(language, statusLabel(node.status), node.status)}`} onPress={() => onNode(node)} style={({ pressed }) => [styles.node, { width: nodeWidth }, node.status === "verified" && styles.nodeVerified, pressed && styles.pressed]} testID={`journey-node-${node.id}`}>
              <JourneySymbol node={node} />
              <Text style={styles.nodeTitle} numberOfLines={3}>{localizeDemoText(language, node.title)}</Text>
              <JourneyStatus node={node} language={language} />
            </Pressable>
          ))}
        </View>
      ) : <Text style={styles.empty}>{uiText(language, "Adiciona o teu primeiro comprovativo.", "Add your first supporting evidence.")}</Text>}
      {ordered.length > initialCount ? <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={({ pressed }) => [styles.expand, pressed && styles.pressed]}>
        <Text style={styles.expandText}>{expanded ? uiText(language, "Mostrar menos", "Show less") : uiText(language, `Ver mais ${hidden} etapas`, `View ${hidden} more steps`)}</Text><Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={15} color="#8BA7C1" />
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderWidth: 1, borderColor: "#253C50", borderRadius: 10, backgroundColor: "#09131CC9", paddingHorizontal: 20, paddingBottom: 18, overflow: "hidden" },
  origin: { height: 68, alignItems: "center", position: "relative" },
  originSymbol: { position: "absolute", top: 9, width: 36, height: 36, borderWidth: 1, borderColor: "#436E97", backgroundColor: "#0E2336", alignItems: "center", justifyContent: "center", borderRadius: 18 },
  branches: { flexDirection: "row", gap: 22, alignItems: "flex-start" },
  branchesStacked: { flexDirection: "column", gap: 24 },
  branch: { flex: 1, width: "100%", minWidth: 0, alignSelf: "stretch", paddingHorizontal: 12, paddingBottom: 8, borderTopWidth: 1, borderColor: "#30495F" },
  branchHeading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingVertical: 15 },
  branchTitle: { color: "#B3C4D3", fontSize: 11, fontWeight: "600", lineHeight: 18, letterSpacing: 1, textTransform: "uppercase" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "flex-start", position: "relative" },
  node: { height: 158, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 8, paddingTop: 3, paddingBottom: 12, gap: 6, borderRadius: 7 },
  nodeVerified: { backgroundColor: "#25436924" },
  symbolFrame: { width: 60, height: 58, justifyContent: "center", alignItems: "center" },
  symbolLarge: { width: 80, height: 80 },
  verifiedRing: { position: "absolute", width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: "#487CAF80" },
  diamond: { width: 34, height: 34, alignItems: "center", justifyContent: "center", transform: [{ rotate: "45deg" }], borderWidth: 1.2 },
  diamondLarge: { width: 46, height: 46 },
  icon: { transform: [{ rotate: "-45deg" }] },
  nodeTitle: { color: "#CBD7E4", fontSize: 12, lineHeight: 18, textAlign: "center" },
  status: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" },
  statusText: { fontSize: 9, lineHeight: 14, fontWeight: "600", letterSpacing: .4 },
  instruction: { color: "#8399AD", fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: 15, paddingTop: 14, borderTopWidth: 1, borderColor: "#203346" },
  expand: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderTopWidth: 1, borderColor: "#23394E", marginTop: 4 },
  expandText: { color: "#8BA7C1", fontSize: 11, lineHeight: 18 },
  empty: { color: "#8298AB", fontSize: 12, lineHeight: 20, paddingVertical: 24, textAlign: "center" },
  pressed: { opacity: .7, backgroundColor: "#20436D40" },
});
