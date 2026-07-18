import React from "react";
import { Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../design";

type Status = "stable" | "attention" | "critical";

type StatusBadgeProps = {
  status: Status;
};

const statusConfig = {
  stable: {
    label: "Estável",
    color: colors.success,
  },
  attention: {
    label: "Atenção",
    color: colors.warning,
  },
  critical: {
    label: "Crítico",
    color: colors.danger,
  },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: config.color,
        borderRadius: radius.pill,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        backgroundColor: `${config.color}14`,
      }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: radius.pill,
          backgroundColor: config.color,
          marginRight: spacing[2],
        }}
      />

      <Text
        style={{
          color: config.color,
          fontSize: typography.caption.fontSize,
          fontWeight: "700",
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}