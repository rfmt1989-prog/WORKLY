import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

export type WorkerJob = {
  id: number;
  project_name: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  hours_worked: number;
  amount: number;
  rating: number | null;
  status: "completed" | "in_progress" | "cancelled";
  payment_status: "paid" | "pending" | "overdue";
};

type Props = {
  job: WorkerJob;
};

export default function HistoryCard({
  job,
}: Props) {
  const statusColor =
    job.status === "completed"
      ? colors.success
      : job.status === "in_progress"
      ? colors.warning
      : colors.danger;

  const paymentColor =
    job.payment_status === "paid"
      ? colors.success
      : job.payment_status === "pending"
      ? colors.warning
      : colors.danger;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.large,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[5],
        marginBottom: spacing[4],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            {job.project_name}
          </Text>

          <Text
            style={{
              color: colors.worker,
              marginTop: 2,
            }}
          >
            {job.company}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: statusColor,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: radius.pill,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: 11,
            }}
          >
            {job.status.replace("_", " ")}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: spacing[4],
          gap: spacing[2],
        }}
      >
        <InfoRow
          icon="location-outline"
          value={job.location}
        />

        <InfoRow
          icon="calendar-outline"
          value={`${job.start_date}  →  ${job.end_date}`}
        />

        <InfoRow
          icon="time-outline"
          value={`${job.hours_worked} horas`}
        />

        <InfoRow
          icon="cash-outline"
          value={`€ ${job.amount}`}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing[5],
          alignItems: "center",
        }}
      >
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize:
                typography.caption.fontSize,
            }}
          >
            Pagamento
          </Text>

          <Text
            style={{
              color: paymentColor,
              fontWeight: "700",
            }}
          >
            {job.payment_status}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="star"
            size={18}
            color="#FFD54F"
          />

          <Text
            style={{
              color: colors.text,
              marginLeft: 5,
              fontWeight: "700",
            }}
          >
            {job.rating ?? "-"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons
        name={icon}
        size={16}
        color={colors.textMuted}
      />

      <Text
        style={{
          color: colors.textMuted,
          marginLeft: spacing[2],
        }}
      >
        {value}
      </Text>
    </View>
  );
}