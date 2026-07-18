import React from "react";
import { View, Text } from "react-native";

import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

type Props = {
  totalJobs: number;
  completedJobs: number;
  totalHours: number;
  totalEarnings: number;
  averageRating: number;
};

export default function HistorySummary({
  totalJobs,
  completedJobs,
  totalHours,
  totalEarnings,
  averageRating,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[5],
        marginBottom: spacing[6],
      }}
    >
      <Text
        style={{
          color: colors.textMuted,
          textTransform: "uppercase",
          fontSize: typography.caption.fontSize,
          letterSpacing: 1,
        }}
      >
        Resumo
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: spacing[4],
          rowGap: spacing[4],
        }}
      >
        <Metric
          label="Trabalhos"
          value={String(totalJobs)}
        />

        <Metric
          label="Concluídos"
          value={String(completedJobs)}
        />

        <Metric
          label="Horas"
          value={String(totalHours)}
        />

        <Metric
          label="Recebido"
          value={`€ ${totalEarnings}`}
        />

        <Metric
          label="Avaliação"
          value={averageRating.toFixed(1)}
        />
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        width: "50%",
      }}
    >
      <Text
        style={{
          color: colors.textMuted,
          fontSize: 12,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: "800",
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}