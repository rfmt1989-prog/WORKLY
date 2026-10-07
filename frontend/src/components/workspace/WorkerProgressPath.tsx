import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiText } from "@/src/demo/fullUi";
import type { LanguageCode, ProfessionalIdentity } from "@/src/demo/types";
import { workspaceColors } from "./primitives";

const levelIcons = ["leaf-outline", "hammer-outline", "construct-outline", "ribbon-outline", "diamond-outline"] as const;

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
  panel: { padding: 20, borderWidth: 1, borderColor: "#2B4157", borderRadius: 10, backgroundColor: "#0C1721DC", gap: 18 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  eyebrow: { color: "#93ABC1", fontSize: 10, letterSpacing: 1.5, lineHeight: 16, textTransform: "uppercase" },
  rules: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 3 },
  rulesText: { color: "#A4B7CA", fontSize: 12 },
  path: { flexDirection: "row", paddingVertical: 3 },
  pathVertical: { flexDirection: "column", gap: 0 },
  step: { flex: 1, minWidth: 0, alignItems: "center" },
  stepVertical: { flex: 0, flexDirection: "row", alignItems: "center", minHeight: 64, gap: 16 },
  symbolArea: { width: "100%", height: 66, alignItems: "center", justifyContent: "center" },
  symbolAreaVertical: { width: 58, height: 64 },
  halo: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 29, borderWidth: 1, borderColor: "transparent" },
  haloCurrent: { borderColor: "#387EC15E", backgroundColor: "#1D46762B" },
  diamond: { width: 32, height: 32, transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#3B4B5B", backgroundColor: "#101B26" },
  diamondReached: { borderColor: "#609CD3", backgroundColor: "#123251" },
  diamondCurrent: { borderWidth: 1.5, borderColor: workspaceColors.blue, backgroundColor: "#153C62" },
  symbol: { transform: [{ rotate: "-45deg" }] },
  lineBefore: { position: "absolute", left: 0, right: "50%", top: 33, height: 1, backgroundColor: "#30465A" },
  lineAfter: { position: "absolute", left: "50%", right: 0, top: 33, height: 1, backgroundColor: "#30465A" },
  lineBeforeVertical: { left: 28, right: undefined, width: 1, top: 0, height: 32 },
  lineAfterVertical: { left: 28, right: undefined, width: 1, top: 32, height: 32 },
  reachedLine: { backgroundColor: "#428BCD" },
  caption: { alignItems: "center", minHeight: 56, gap: 4 },
  captionVertical: { flex: 1, minHeight: 0, alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: 9 },
  label: { color: "#8597AA", fontSize: 12, lineHeight: 18, textAlign: "center" },
  labelCurrent: { color: "#E3EFFF", fontWeight: "600" },
  minimum: { color: "#73889D", fontSize: 10, lineHeight: 18 },
  current: { color: "#76B4F4", fontSize: 9, lineHeight: 18, letterSpacing: .7, textTransform: "uppercase" },
  progressFooter: { gap: 9, paddingTop: 4 },
  track: { height: 2, borderRadius: 1, backgroundColor: "#213344", overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#5BA6F4" },
  hint: { color: "#93A8BB", fontSize: 12, lineHeight: 18 },
  pressed: { opacity: .72 },
});
