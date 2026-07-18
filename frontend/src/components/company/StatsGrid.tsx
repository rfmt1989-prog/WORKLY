import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

type Props = {
  activeWorkers: number;
  activeProjects: number;
  totalDocuments: number;
  monthlyRevenue: number;
};

export default function StatsGrid({
  activeWorkers,
  activeProjects,
  totalDocuments,
  monthlyRevenue,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: spacing[6],
      }}
    >
      <StatCard
        icon="people-outline"
        label="Trabalhadores"
        value={String(activeWorkers)}
      />

      <StatCard
        icon="business-outline"
        label="Obras"
        value={String(activeProjects)}
      />

      <StatCard
        icon="document-text-outline"
        label="Documentos"
        value={String(totalDocuments)}
      />

      <StatCard
        icon="cash-outline"
        label="Faturação"
        value={`€ ${monthlyRevenue.toLocaleString("pt-PT")}`}
      />
    </View>
  );
}

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function StatCard({
  icon,
  label,
  value,
}: StatCardProps) {
  return (
    <View
      style={{
        width: "48%",
        backgroundColor: colors.surface,
        borderRadius: radius.large,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[4],
        marginBottom: spacing[4],
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: radius.medium,
          backgroundColor: colors.companySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={22}
          color={colors.company}
        />
      </View>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: typography.caption.fontSize,
          marginTop: spacing[3],
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: colors.text,
          fontSize: 22,
          fontWeight: "800",
          marginTop: spacing[1],
        }}
      >
        {value}
      </Text>
    </View>
  );
}