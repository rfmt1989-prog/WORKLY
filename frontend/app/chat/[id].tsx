import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useColors, spacing, radius } from "@/src/theme/theme";

export default function Chat() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [conv, setConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const load = async () => {
    try {
      const res = await api.get<any>(`/conversations/${id}`);
      setConv(res.conversation);
      setMessages(res.messages);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const send = async (type: string = "text", meta?: any) => {
    const body = type === "text" ? text.trim() : null;
    if (type === "text" && !body) return;
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const optimistic = { id: `tmp-${Date.now()}`, sender_id: user?.id, text: body, type, meta, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      await api.post(`/conversations/${id}/messages`, { text: body, type, meta });
      load();
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
        <Pressable testID="chat-back" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={c.onSurface} />
        </Pressable>
        {conv?.other?.avatar ? <Image source={{ uri: conv.other.avatar }} style={{ width: 38, height: 38, borderRadius: radius.pill }} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700" }}>{conv?.other?.name || "Chat"}</Text>
          <Text style={{ color: c.success, fontSize: 12 }}>online</Text>
        </View>
        <Pressable testID="video-call-button" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} style={{ padding: 6 }}>
          <Ionicons name="videocam-outline" size={24} color={c.onSurface} />
        </Pressable>
        <Pressable testID="voice-call-button" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} style={{ padding: 6 }}>
          <Ionicons name="call-outline" size={22} color={c.onSurface} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.onSurface} /></View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => <Bubble c={c} item={item} mine={item.sender_id === user?.id} />}
          />
        )}

        {/* Input */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
          <Pressable testID="attach-button" onPress={() => send("document", { name: "documento.pdf" })} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="add-circle-outline" size={26} color={c.muted} />
          </Pressable>
          <View style={{ flex: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, paddingHorizontal: spacing.md, minHeight: 44, justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}>
            <TextInput
              testID="message-input"
              placeholder="Mensagem..."
              placeholderTextColor={c.muted}
              value={text}
              onChangeText={setText}
              multiline
              style={{ color: c.onSurface, fontSize: 16, paddingVertical: 10, maxHeight: 120 }}
            />
          </View>
          {text.trim() ? (
            <Pressable testID="send-button" onPress={() => send("text")} style={{ width: 44, height: 44, borderRadius: radius.pill, backgroundColor: c.brand, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="arrow-up" size={22} color={c.onBrand} />
            </Pressable>
          ) : (
            <Pressable testID="voice-button" onPress={() => send("voice", { duration: "0:08" })} style={{ width: 44, height: 44, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}>
              <Ionicons name="mic" size={22} color={c.onSurface} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ c, item, mine }: any) {
  const bg = mine ? c.brand : c.surfaceSecondary;
  const fg = mine ? c.onBrand : c.onSurface;
  return (
    <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%", backgroundColor: bg, borderRadius: radius.lg, borderBottomRightRadius: mine ? 4 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 4, padding: spacing.md }}>
      {item.type === "voice" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="play" size={18} color={fg} />
          <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
            {[6, 12, 8, 16, 10, 14, 7, 12].map((h, i) => (
              <View key={i} style={{ width: 3, height: h, borderRadius: 2, backgroundColor: fg, opacity: 0.7 }} />
            ))}
          </View>
          <Text style={{ color: fg, fontSize: 12, opacity: 0.8 }}>{item.meta?.duration || "0:08"}</Text>
        </View>
      ) : item.type === "document" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="document-attach" size={22} color={fg} />
          <Text style={{ color: fg, fontSize: 14, fontWeight: "600" }}>{item.meta?.name || "documento.pdf"}</Text>
        </View>
      ) : (
        <Text style={{ color: fg, fontSize: 15, lineHeight: 20 }}>{item.text}</Text>
      )}
      <Text style={{ color: fg, opacity: 0.5, fontSize: 10, marginTop: 4, alignSelf: "flex-end" }}>{fmt(item.created_at)}</Text>
    </View>
  );
}

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
