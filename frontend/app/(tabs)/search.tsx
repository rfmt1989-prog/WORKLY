import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { Stars } from "@/src/components/ui";

const WORKER_CHIPS = ["Todos", "Eletricista", "Canalizador", "Full-time", "Contrato", "Lisboa"];
const COMPANY_CHIPS = ["Todos", "Disponíveis", "Top rated", "Eletricista", "Canalizador", "Lisboa"];

export default function Search() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isCompany = user?.role === "company";
  const chips = isCompany ? COMPANY_CHIPS : WORKER_CHIPS;

  const [q, setQ] = useState("");
  const [chip, setChip] = useState("Todos");
  const [results, setResults] = useState<any[]>([]);
  const [type, setType] = useState("workers");
  const [loading, setLoading] = useState(true);

  const doSearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/search?q=${encodeURIComponent(query)}`);
      setResults(res.results || []);
      setType(res.type);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(q), 300);
    return () => clearTimeout(t);
  }, [q, doSearch]);

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <ScreenHeader title={isCompany ? "Procurar Talento" : "Procurar Trabalho"} large showTheme />

      {/* Sticky search + chips */}
      <View style={{ backgroundColor: c.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, paddingBottom: spacing.sm }}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48, gap: spacing.sm }}>
            <Ionicons name="search" size={20} color={c.muted} />
            <TextInput
              testID="search-input"
              placeholder={isCompany ? "Nome, competência..." : "Cargo, empresa, local..."}
              placeholderTextColor={c.muted}
              value={q}
              onChangeText={setQ}
              autoCapitalize="none"
              style={{ flex: 1, color: c.onSurface, fontSize: 16, height: "100%" }}
            />
            {q ? (
              <Pressable onPress={() => setQ("")}><Ionicons name="close-circle" size={18} color={c.muted} /></Pressable>
            ) : null}
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingTop: spacing.md }}
          style={{ height: 56 }}
        >
          {chips.map((ch) => {
            const active = chip === ch;
            return (
              <Pressable
                key={ch}
                testID={`chip-${ch}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setChip(ch);
                }}
                style={{
                  flexShrink: 0,
                  height: 36,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.pill,
                  backgroundColor: active ? c.brand : c.surfaceTertiary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: active ? c.onBrand : c.onSurface, fontWeight: "600", fontSize: 14 }}>{ch}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={c.onSurface} />
        </View>
      ) : results.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="search-outline" size={48} color={c.muted} />
          <Text style={{ color: c.muted, fontSize: 15 }}>Sem resultados</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + 100, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            type === "workers" ? (
              <WorkerRow c={c} item={item} onPress={() => router.push("/(tabs)/profile")} />
            ) : (
              <JobRow c={c} item={item} />
            )
          }
        />
      )}
    </View>
  );
}

function WorkerRow({ c, item }: any) {
  return (
    <Pressable
      testID={`worker-${item.id}`}
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}
    >
      <Image source={{ uri: item.avatar }} style={{ width: 54, height: 54, borderRadius: radius.pill }} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700" }}>{item.name}</Text>
          {item.available ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.success }} /> : null}
        </View>
        <Text style={{ color: c.muted, fontSize: 13 }}>{item.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <Stars value={item.reputation} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="shield-checkmark" size={13} color={c.success} />
            <Text style={{ color: c.onSurfaceSecondary, fontSize: 13, fontWeight: "700" }}>{item.trust_score}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.muted} />
    </Pressable>
  );
}

function JobRow({ c, item }: any) {
  return (
    <Pressable
      testID={`joblisting-${item.id}`}
      style={{ backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, gap: 6 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700", flex: 1 }}>{item.title}</Text>
        <Text style={{ color: c.success, fontSize: 15, fontWeight: "800" }}>{item.pay}</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: 13 }}>{item.company}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="location-outline" size={13} color={c.muted} />
          <Text style={{ color: c.onSurfaceSecondary, fontSize: 12 }}>{item.location}</Text>
        </View>
        <View style={{ backgroundColor: c.surfaceTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }}>
          <Text style={{ color: c.onSurface, fontSize: 11, fontWeight: "700" }}>{item.type}</Text>
        </View>
        <Text style={{ color: c.muted, fontSize: 11 }}>{item.posted}</Text>
      </View>
    </Pressable>
  );
}
