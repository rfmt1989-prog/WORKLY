import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiText } from "@/src/demo/fullUi";
import type { LanguageCode, ProfessionalIdentity } from "@/src/demo/types";
import { workspaceColors } from "./primitives";

const levelIcons = ["ellipse-outline", "hardware-chip-outline", "construct-outline", "ribbon-outline", "diamond-outline"] as const;

export function WorkerProgressPath({ identity, language, vertical, onRules }: {
  identity: ProfessionalIdentity;
  language: LanguageCode;
  vertical: boolean;
  onRules: () => void;
}) {
  const text = (pt: string, en: string) => uiText(language, pt, en);
  return (
    <View style={styles.panel} testID="professional-progression">
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>{text("Progressão na profissão", "Progression in your trade")}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={text("Como evoluir", "How to progress")} onPress={onRules} style={({ pressed }) => [styles.rules, pressed && styles.pressed]}>
          <Ionicons name="information-circle-outline" size={16} color="#9EB6CC" />
          <Text style={styles.rulesText}>{text("Como evoluir", "How to progress")}</Text>
        </Pressable>
      </View>
      <View style={[styles.path, vertical && styles.pathVertical]}>
        {identity.levels.map((level, index) => {
          const current = index === identity.level_index;
          const reached = index <= identity.level_index;
          return (
            <View key={level.id} style={[styles.step, vertical && styles.stepVertical]}>
              <View style={[styles.symbolArea, vertical && styles.symbolAreaVertical]}>
                {index > 0 ? <View style={[styles.lineBefore, vertical && styles.lineBeforeVertical, reached && styles.reachedLine]} /> : null}
                {index < identity.levels.length - 1 ? <View style={[styles.lineAfter, vertical && styles.lineAfterVertical, index < identity.level_index && styles.reachedLine]} /> : null}
                <View style={[styles.halo, current && styles.haloCurrent]}>
                  <View style={[styles.diamond, reached && styles.diamondReached, current && styles.diamondCurrent]}>
                    <Ionicons name={levelIcons[index] || "ribbon-outline"} size={21} color={reached ? "#9BCCFF" : "#718297"} style={styles.symbol} />
                  </View>
                </View>
              </View>
              <View style={[styles.caption, vertical && styles.captionVertical]}>
                <Text style={[styles.label, current && styles.labelCurrent]}>{text(level.label, level.label_en)}</Text>
                <Text style={styles.minimum}>{level.minimum} {text("pontos", "points")}</Text>
                {current ? <Text style={styles.current}>{text("Nível atual", "Current level")}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.progressFooter}>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, Math.max(0, identity.progress))}%` }]} /></View>
        <Text style={styles.hint}>{identity.next_level ? text(`${identity.points_to_next} pontos para o próximo nível`, `${identity.points_to_next} points to the next level`) : text("Percurso Master alcançado", "Master progression achieved")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 18, borderWidth: 1, borderColor: "#19354A", borderRadius: 18, backgroundColor: "#071019E8", gap: 17 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  eyebrow: { color: "#88A5BC", fontSize: 9, letterSpacing: 2, lineHeight: 16, textTransform: "uppercase", fontWeight: "700" },
  rules: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 3 },
  rulesText: { color: "#A4B7CA", fontSize: 12 },
  path: { flexDirection: "row", paddingVertical: 3 },
  pathVertical: { flexDirection: "column", gap: 0 },
  step: { flex: 1, minWidth: 0, alignItems: "center" },
  stepVertical: { flex: 0, flexDirection: "row", alignItems: "center", minHeight: 64, gap: 16 },
  symbolArea: { width: "100%", height: 66, alignItems: "center", justifyContent: "center" },
  symbolAreaVertical: { width: 58, height: 64 },
  halo: { width: 60, height: 60, alignItems: "center", justifyContent: "center", borderRadius: 30, borderWidth: 1, borderColor: "#1E3446", backgroundColor: "#050C12" },
  haloCurrent: { borderColor: "#2388FF70", backgroundColor: "#071725", shadowColor: "#2388FF", shadowOpacity: .26, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  diamond: { width: 30, height: 30, transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#344658", backgroundColor: "#08131C" },
  diamondReached: { borderColor: "#4D92C9", backgroundColor: "#0A2133" },
  diamondCurrent: { borderWidth: 1.2, borderColor: "#6DBBFF", backgroundColor: "#0B2940" },
  symbol: { transform: [{ rotate: "-45deg" }] },
  lineBefore: { position: "absolute", left: 0, right: "50%", top: 33, height: 1, backgroundColor: "#21394B" },
  lineAfter: { position: "absolute", left: "50%", right: 0, top: 33, height: 1, backgroundColor: "#21394B" },
  lineBeforeVertical: { left: 28, right: undefined, width: 1, top: 0, height: 32 },
  lineAfterVertical: { left: 28, right: undefined, width: 1, top: 32, height: 32 },
  reachedLine: { backgroundColor: "#347FB8" },
  caption: { alignItems: "center", minHeight: 56, gap: 4 },
  captionVertical: { flex: 1, minHeight: 0, alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: 9 },
  label: { color: "#8597AA", fontSize: 12, lineHeight: 18, textAlign: "center" },
  labelCurrent: { color: "#E3EFFF", fontWeight: "600" },
  minimum: { color: "#73889D", fontSize: 10, lineHeight: 18 },
  current: { color: "#76B4F4", fontSize: 9, lineHeight: 18, letterSpacing: .7, textTransform: "uppercase" },
  progressFooter: { gap: 9, paddingTop: 4 },
  track: { height: 1, borderRadius: 1, backgroundColor: "#1B2D3B", overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#6DBBFF", shadowColor: "#2388FF", shadowOpacity: .4, shadowRadius: 6 },
  hint: { color: "#93A8BB", fontSize: 12, lineHeight: 18 },
  pressed: { opacity: .72 },
});
