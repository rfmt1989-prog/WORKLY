import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors, spacing, radius, ThemeColors } from "@/src/theme/theme";

// ---------------- Card ----------------
export function Card({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const c = useColors();
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: c.surfaceSecondary,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---------------- Button ----------------
export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const c = useColors();
  const bg = variant === "primary" ? c.brand : variant === "secondary" ? c.surfaceSecondary : "transparent";
  const fg = variant === "primary" ? c.onBrand : c.onSurface;
  const border = variant === "secondary" ? c.border : "transparent";

  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }) => [
        {
          height: 54,
          borderRadius: radius.md,
          backgroundColor: bg,
          borderWidth: border === "transparent" ? 0 : StyleSheet.hairlineWidth,
          borderColor: border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={fg} />}
          <Text style={{ color: fg, fontSize: 16, fontWeight: "700", letterSpacing: 0.2 }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// ---------------- Trust Ring ----------------
export function TrustRing({
  score,
  size = 96,
  stroke = 9,
  label = "Trust",
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const c = useColors();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surfaceTertiary} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.success}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
        />
      </Svg>
      <Text style={{ color: c.onSurface, fontSize: size * 0.26, fontWeight: "800" }}>{score}</Text>
      <Text style={{ color: c.muted, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

// ---------------- Progress Bar ----------------
export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const c = useColors();
  return (
    <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary, overflow: "hidden" }}>
      <View
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          height: "100%",
          backgroundColor: color || c.success,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

// ---------------- Badge ----------------
export function Badge({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "success" | "warning" | "error" }) {
  const c = useColors();
  const map = {
    neutral: { bg: c.surfaceTertiary, fg: c.onSurface },
    success: { bg: c.isDark ? "#14351f" : "#DCFCE7", fg: c.success },
    warning: { bg: c.isDark ? "#3a2c0a" : "#FEF3C7", fg: c.warning },
    error: { bg: c.isDark ? "#3a1414" : "#FEE2E2", fg: c.error },
  }[tone];
  return (
    <View style={{ backgroundColor: map.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: "flex-start" }}>
      <Text style={{ color: map.fg, fontSize: 12, fontWeight: "700" }}>{text}</Text>
    </View>
  );
}

// ---------------- Avatar ----------------
export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <Ionicons name="star" size={size} color={c.warning} />
      <Text style={{ color: c.onSurfaceSecondary, fontSize: size, fontWeight: "700" }}>{value?.toFixed(1)}</Text>
    </View>
  );
}

export function makeStyles(c: ThemeColors) {
  return { c, spacing, radius };
}
