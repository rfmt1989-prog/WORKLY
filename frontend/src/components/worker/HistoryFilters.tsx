import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
} from "react-native";

import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

export type HistoryFilter =
  | "all"
  | "completed"
  | "in_progress"
  | "paid"
  | "pending";

type HistoryFiltersProps = {
  activeFilter: HistoryFilter;
  onChange: (filter: HistoryFilter) => void;
};

const FILTERS: {
  value: HistoryFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "Todos",
  },
  {
    value: "completed",
    label: "Concluídos",
  },
  {
    value: "in_progress",
    label: "Em curso",
  },
  {
    value: "paid",
    label: "Pagos",
  },
  {
    value: "pending",
    label: "Pendentes",
  },
];

export default function HistoryFilters({
  activeFilter,
  onChange,
}: HistoryFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: spacing[2],
        paddingRight: spacing[5],
      }}
      style={{
        marginBottom: spacing[5],
      }}
    >
      {FILTERS.map((filter) => {
        const active =
          activeFilter === filter.value;

        return (
          <Pressable
            key={filter.value}
            onPress={() =>
              onChange(filter.value)
            }
            style={({ pressed }) => ({
              minHeight: 40,
              paddingHorizontal: spacing[4],
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: active
                ? colors.worker
                : colors.border,
              backgroundColor: active
                ? colors.workerSoft
                : pressed
                  ? colors.surfaceHover
                  : colors.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                color: active
                  ? colors.worker
                  : colors.textMuted,
                fontSize:
                  typography.caption.fontSize,
                fontWeight: "800",
              }}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}