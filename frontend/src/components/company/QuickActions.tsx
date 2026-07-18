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
  typography,
} from "@/src/design";

type Props = {
  onNewProject?: () => void;
  onNewWorker?: () => void;
  onNewTeam?: () => void;
  onReports?: () => void;
};

export default function QuickActions({
  onNewProject,
  onNewWorker,
  onNewTeam,
  onReports,
}: Props) {
  return (
    <View
      style={{
        marginBottom: spacing[6],
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: typography.heading.fontSize,
          fontWeight: "800",
          marginBottom: spacing[4],
        }}
      >
        Ações rápidas
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <ActionCard
          icon="business-outline"
          title="Nova Obra"
          onPress={onNewProject}
        />

        <ActionCard
          icon="person-add-outline"
          title="Novo Trabalhador"
          onPress={onNewWorker}
        />

        <ActionCard
          icon="people-outline"
          title="Nova Equipa"
          onPress={onNewTeam}
        />

        <ActionCard
          icon="stats-chart-outline"
          title="Relatórios"
          onPress={onReports}
        />
      </View>
    </View>
  );
}

type ActionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
};

function ActionCard({
  icon,
  title,
  onPress,
}: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: "48%",
        minHeight: 110,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[4],
        marginBottom: spacing[4],
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: radius.pill,
          backgroundColor: colors.companySoft,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={24}
          color={colors.company}
        />
      </View>

      <Text
        style={{
          color: colors.text,
          textAlign: "center",
          marginTop: spacing[3],
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}