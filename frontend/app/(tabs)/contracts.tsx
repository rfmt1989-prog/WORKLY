import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApi } from "@/src/hooks/useApi";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { Badge } from "@/src/components/ui";

const FILTERS = ["Todos", "Ativos", "Pendentes", "Expirados"];

export default function Contracts() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading } = useApi<any[]>("/contracts");
  const [filter, setFilter] = useState("Todos");

  const filtered = (data || []).filter((ct) => {
    if (filter === "Todos") return true;
    if (filter === "Ativos") return ct.status === "active";
    if (filter === "Pendentes") return ct.status === "pending";
    if (filter === "Expirados") return ct.status === "expired";
    return true;
  });

  const tone = (s: string) => (s === "active" ? "success" : s === "pending" ? "warning" : "neutral");
  const label = (s: string) => ({ active: "Ativo", pending: "Pendente", expired: "Expirado" }[s] || s);

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <ScreenHeader title="Contratos" large showTheme />
      <View style={{ backgroundColor: c.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.md }}
          style={{ height: 56 }}
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                testID={`contract-filter-${f}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f);
                }}
                style={{ flexShrink: 0, height: 36, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: active ? c.brand : c.surfaceTertiary, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: active ? c.onBrand : c.onSurface, fontWeight: "600", fontSize: 14 }}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={c.onSurface} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + 100, gap: spacing.md }} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: spacing["3xl"], gap: spacing.md }}>
              <Ionicons name="document-text-outline" size={48} color={c.muted} />
              <Text style={{ color: c.muted }}>Sem contratos {filter !== "Todos" ? label(filter.toLowerCase()) : ""}</Text>
            </View>
          ) : (
            filtered.map((ct) => (
              <Pressable
                key={ct.id}
                testID={`contract-${ct.id}`}
                onPress={() => router.push(`/contract/${ct.id}`)}
                style={{ backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, gap: spacing.sm }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700", flex: 1, marginRight: spacing.md }}>{ct.title}</Text>
                  <Badge text={label(ct.status)} tone={tone(ct.status) as any} />
                </View>
                <Text style={{ color: c.muted, fontSize: 13 }}>{ct.company_name}</Text>
                <View style={{ flexDirection: "row", gap: spacing.lg, marginTop: 4 }}>
                  <Meta c={c} icon="cash-outline" text={ct.rate} />
                  <Meta c={c} icon="calendar-outline" text={ct.duration} />
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Meta({ c, icon, text }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Ionicons name={icon} size={14} color={c.muted} />
      <Text style={{ color: c.onSurfaceSecondary, fontSize: 13, fontWeight: "600" }}>{text}</Text>
    </View>
  );
}
