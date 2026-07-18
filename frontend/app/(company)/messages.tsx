import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  radius,
  spacing,
} from "@/src/design";

export default function CompanyMessagesScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing[5],
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.pill,
          backgroundColor: colors.companySoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing[4],
        }}
      >
        <Ionicons
          name="chatbubble-outline"
          size={30}
          color={colors.company}
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: "800",
        }}
      >
        Mensagens
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          marginTop: spacing[2],
          textAlign: "center",
        }}
      >
        Conversas com trabalhadores e equipas
      </Text>
    </View>
  );
}