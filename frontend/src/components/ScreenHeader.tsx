import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { useThemeMode } from "@/src/context/ThemeContext";

export function ScreenHeader({
  title,
  subtitle,
  avatar,
  showBell = false,
  showTheme = false,
  right,
  large = false,
}: {
  title: string;
  subtitle?: string;
  avatar?: string;
  showBell?: boolean;
  showTheme?: boolean;
  right?: React.ReactNode;
  large?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cycle, mode } = useThemeMode();

  return (
    <View
      style={{
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: c.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 44, height: 44, borderRadius: radius.pill }} />
          ) : null}
          <View style={{ flex: 1 }}>
            {subtitle ? <Text style={{ color: c.muted, fontSize: 13, fontWeight: "600" }}>{subtitle}</Text> : null}
            <Text
              numberOfLines={1}
              style={{ color: c.onSurface, fontSize: large ? 28 : 20, fontWeight: "800", letterSpacing: -0.5 }}
            >
              {title}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {right}
          {showTheme && (
            <Pressable
              testID="theme-toggle-button"
              onPress={cycle}
              style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name={mode === "dark" ? "moon" : mode === "light" ? "sunny" : "contrast"} size={18} color={c.onSurface} />
            </Pressable>
          )}
          {showBell && (
            <Pressable
              testID="notifications-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/notifications");
              }}
              style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="notifications-outline" size={20} color={c.onSurface} />
              <View style={{ position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: c.error }} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
