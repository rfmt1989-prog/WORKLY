import React from "react";
import { View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

type Props = {
  companyName: string;
  plan: string;
  pulse: number;
  verified: boolean;
};

export default function DashboardHeader({
  companyName,
  plan,
  pulse,
  verified,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.large,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[5],
        marginBottom: spacing[6],
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
              color: colors.textMuted,
              fontSize: typography.caption.fontSize,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Empresa
          </Text>

          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: "800",
              marginTop: spacing[1],
            }}
          >
            {companyName}
          </Text>

          <Text
            style={{
              color: colors.company,
              marginTop: spacing[1],
              fontWeight: "700",
            }}
          >
            Plano {plan}
          </Text>
        </View>

        {verified && (
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: radius.pill,
              backgroundColor: "rgba(34,197,94,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={colors.success}
            />
          </View>
        )}
      </View>

      <View
        style={{
          marginTop: spacing[5],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: spacing[2],
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
            }}
          >
            Company Pulse
          </Text>

          <Text
            style={{
              color: colors.company,
              fontWeight: "800",
            }}
          >
            {pulse}%
          </Text>
        </View>

        <View
          style={{
            height: 10,
            borderRadius: radius.pill,
            backgroundColor: colors.backgroundElevated,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pulse}%`,
              height: "100%",
              backgroundColor: colors.company,
            }}
          />
        </View>
      </View>
    </View>
  );
}