import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApi } from "@/src/hooks/useApi";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { TrustRing, ProgressBar } from "@/src/components/ui";

export default function Career() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading } = useApi<any>("/career");

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
        <Pressable testID="career-back" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={c.onSurface} />
        </Pressable>
        <Text style={{ color: c.onSurface, fontSize: 20, fontWeight: "800" }}>Carreira</Text>
      </View>

      {loading || !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.onSurface} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + 40, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
          {/* Level */}
          <View style={{ alignItems: "center", gap: spacing.md, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}>
            <TrustRing score={data.trust_score} size={120} stroke={11} label="Trust" />
            <Text style={{ color: c.onSurface, fontSize: 20, fontWeight: "800" }}>{data.level}</Text>
            <View style={{ width: "100%" }}>
              <ProgressBar value={data.level_progress} />
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 6, textAlign: "center" }}>{Math.round(data.level_progress * 100)}% para o próximo nível</Text>
            </View>
          </View>

          {/* Achievements */}
          <View style={{ gap: spacing.md }}>
            <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800" }}>Conquistas</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              {data.achievements?.map((a: any, i: number) => (
                <View key={i} style={{ width: "47%", flexGrow: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", gap: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, opacity: a.unlocked ? 1 : 0.4 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: a.unlocked ? c.brand : c.surfaceTertiary, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={a.icon} size={24} color={a.unlocked ? c.onBrand : c.muted} />
                  </View>
                  <Text style={{ color: c.onSurface, fontSize: 13, fontWeight: "700", textAlign: "center" }}>{a.title}</Text>
                  {!a.unlocked && <Ionicons name="lock-closed" size={12} color={c.muted} />}
                </View>
              ))}
            </View>
          </View>

          {/* Training */}
          {data.training?.length ? (
            <View style={{ gap: spacing.md }}>
              <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800" }}>Formação & Cursos</Text>
              {data.training.map((t: any, i: number) => (
                <View key={i} style={{ backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: c.onSurface, fontSize: 15, fontWeight: "700", flex: 1 }}>{t.title}</Text>
                    {t.progress >= 1 ? <Ionicons name="checkmark-circle" size={20} color={c.success} /> : <Text style={{ color: c.muted, fontSize: 12 }}>{t.hours}h</Text>}
                  </View>
                  <ProgressBar value={t.progress} />
                </View>
              ))}
            </View>
          ) : null}

          {/* Timeline */}
          <View style={{ gap: spacing.md }}>
            <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800" }}>Percurso</Text>
            {data.timeline?.map((t: any, i: number) => (
              <View key={i} style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ alignItems: "center" }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.brand, marginTop: 3 }} />
                  {i < data.timeline.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: c.border, marginVertical: 2 }} />}
                </View>
                <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: "700" }}>{t.date}</Text>
                  <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700", marginTop: 2 }}>{t.title}</Text>
                  <Text style={{ color: c.onSurfaceSecondary, fontSize: 13 }}>{t.org}</Text>
                  <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{t.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
