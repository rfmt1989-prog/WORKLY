import React from "react";
import {
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  colors,
  radius,
  spacing,
} from "@/src/design";

import type {
  WorkerDashboardStats,
} from "../types";

type StatsGridProps = {
  stats: WorkerDashboardStats;
};

export default function StatsGrid({
  stats,
}: StatsGridProps) {
  return (
    <View
      style={{
        marginBottom: spacing[6],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: spacing[3],
          marginBottom: spacing[3],
        }}
      >
        <StatCard
          icon="briefcase-outline"
          value={stats.jobs_today}
          label="Trabalhos hoje"
          accentColor={colors.worker}
        />

        <StatCard
          icon="time-outline"
          value={stats.hours_this_week}
          label="Horas semana"
          accentColor={colors.success}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: spacing[3],
        }}
      >
        <StatCard
          icon="document-text-outline"
          value={stats.documents_pending}
          label="Documentos"
          accentColor="#F59E0B"
        />

        <StatCard
          icon="chatbubble-outline"
          value={stats.unread_messages}
          label="Mensagens"
          accentColor="#8B5CF6"
        />
      </View>
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
  accentColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  accentColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 155,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[4],
      }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: `${accentColor}1F`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={22}
          color={accentColor}
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 28,
          fontWeight: "900",
          marginTop: spacing[5],
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: 13,
          marginTop: spacing[1],
        }}
      >
        {label}
      </Text>
    </View>
  );
}