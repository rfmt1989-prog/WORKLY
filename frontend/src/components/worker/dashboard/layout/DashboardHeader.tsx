import React from "react";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  radius,
  spacing,
} from "@/src/design";

type DashboardHeaderProps = {
  workerName: string;
  onSearchPress?: () => void;
  onMessagesPress?: () => void;
  onNotificationsPress?: () => void;
};

function formatCurrentDate() {
  const formattedDate = new Intl.DateTimeFormat(
    "pt-PT",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }
  ).format(new Date());

  return (
    formattedDate.charAt(0).toUpperCase() +
    formattedDate.slice(1)
  );
}

export default function DashboardHeader({
  workerName,
  onSearchPress,
  onMessagesPress,
  onNotificationsPress,
}: DashboardHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: spacing[6],
        gap: spacing[4],
      }}
    >
      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 13,
          }}
        >
          {formatCurrentDate()}
        </Text>

        <Text
          style={{
            color: colors.text,
            fontSize: 34,
            lineHeight: 41,
            fontWeight: "900",
            marginTop: spacing[2],
          }}
        >
          Bem-vindo, {workerName}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: spacing[2],
        }}
      >
        <HeaderButton
          icon="search-outline"
          label="Pesquisar"
          onPress={onSearchPress}
        />

        <HeaderButton
          icon="chatbubble-outline"
          label="Mensagens"
          onPress={onMessagesPress}
        />

        <HeaderButton
          icon="notifications-outline"
          label="Notificações"
          onPress={onNotificationsPress}
        />
      </View>
    </View>
  );
}

function HeaderButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={23}
        color={colors.text}
      />
    </Pressable>
  );
}