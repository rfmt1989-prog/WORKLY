import React, { useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useApi } from "@/src/hooks/useApi";
import { api } from "@/src/api/client";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { uiText } from "@/src/demo/fullUi";
import { localizeDemoText } from "@/src/demo/localizedData";
import { useColors, spacing, radius } from "@/src/theme/theme";

const ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; tone: string }> = {
  contract: { name: "document-text", tone: "brand" },
  message: { name: "chatbubble", tone: "brand" },
  certificate: { name: "ribbon", tone: "warning" },
  payment: { name: "cash", tone: "success" },
  review: { name: "star", tone: "warning" },
  project: { name: "briefcase", tone: "brand" },
};

export default function Notifications() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language } = useWorklyData();
  const { data, loading } = useApi<any[]>("/notifications");

  useEffect(() => {
    api.post("/notifications/read").catch(() => {});
  }, []);

  const toneColor = (t: string) => (t === "success" ? c.success : t === "warning" ? c.warning : c.brand);
  const toneBg = (t: string) => (t === "success" ? (c.isDark ? "#14351f" : "#DCFCE7") : t === "warning" ? (c.isDark ? "#3a2c0a" : "#FEF3C7") : c.surfaceTertiary);

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
        <Pressable testID="notif-back" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={c.onSurface} />
        </Pressable>
        <Text style={{ color: c.onSurface, fontSize: 20, fontWeight: "800" }}>{uiText(language, "Notificações", "Notifications")}</Text>
      </View>

      {loading && !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.onSurface} /></View>
      ) : !data?.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md }}>
          <Ionicons name="notifications-off-outline" size={48} color={c.muted} />
          <Text style={{ color: c.muted }}>{uiText(language, "Sem notificações", "No notifications")}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + 40 }}
          renderItem={({ item }) => {
            const cfg = ICONS[item.type] || { name: "notifications", tone: "brand" };
            return (
              <View testID={`notif-${item.id}`} style={{ flexDirection: "row", gap: spacing.md, backgroundColor: item.read ? "transparent" : c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: toneBg(cfg.tone), alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={cfg.name} size={20} color={toneColor(cfg.tone)} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: c.onSurface, fontSize: 15, fontWeight: "700" }}>{localizeDemoText(language, item.title)}</Text>
                  <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>{localizeDemoText(language, item.body ?? item.message)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
