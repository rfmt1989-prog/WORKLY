import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useApi } from "@/src/hooks/useApi";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { ScreenHeader } from "@/src/components/ScreenHeader";

export default function Messages() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading } = useApi<any[]>("/conversations");

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <ScreenHeader title="Mensagens" large showTheme />
      {loading && !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={c.onSurface} />
        </View>
      ) : !data?.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md }}>
          <Ionicons name="chatbubbles-outline" size={48} color={c.muted} />
          <Text style={{ color: c.muted }}>Sem mensagens ainda</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              testID={`conversation-${item.id}`}
              onPress={() => router.push(`/chat/${item.id}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}
            >
              {item.other?.avatar ? (
                <Image source={{ uri: item.other.avatar }} style={{ width: 56, height: 56, borderRadius: radius.pill }} />
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="person" size={26} color={c.muted} />
                </View>
              )}
              <View style={{ flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, paddingBottom: spacing.md, gap: 3 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700" }}>{item.other?.name || "Chat"}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{timeAgo(item.last_at)}</Text>
                </View>
                <Text numberOfLines={1} style={{ color: c.muted, fontSize: 14 }}>{item.last_message}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
