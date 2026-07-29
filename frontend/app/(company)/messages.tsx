import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/design";

type Message = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
};

export default function CompanyMessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Message[]>("/company/messages")
      .then(setMessages)
      .finally(() => setLoading(false));
  }, []);

  const markRead = (id: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, unread: 0 } : message
      )
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing[5] }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
          Mensagens
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          Comunicação com trabalhadores e chefes de equipa
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.company} style={{ marginTop: 40 }} />
        ) : null}
        {messages.map((message) => (
          <Pressable
            key={message.id}
            onPress={() => markRead(message.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: spacing[4],
              padding: spacing[4],
              borderRadius: radius.xlarge,
              borderWidth: 1,
              borderColor: message.unread ? colors.company : colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.companySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={22} color={colors.company} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing[3] }}>
              <Text style={{ color: colors.text, fontWeight: "900" }}>
                {message.name}
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 5 }} numberOfLines={1}>
                {message.preview}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{message.time}</Text>
              {message.unread ? (
                <View
                  style={{
                    marginTop: 8,
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.company,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 12, fontWeight: "900" }}>
                    {message.unread}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
