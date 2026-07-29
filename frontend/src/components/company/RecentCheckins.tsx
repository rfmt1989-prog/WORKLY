import React from "react";
import { View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

export type CompanyCheckin = {
  worker_id: number;
  worker_name: string;
  time: string;
  project_name: string;
};

type Props = {
  checkins: CompanyCheckin[];
};

export default function RecentCheckins({
  checkins,
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
      <Text
        style={{
          color: colors.text,
          fontSize: typography.heading.fontSize,
          fontWeight: "800",
          marginBottom: spacing[4],
        }}
      >
        Últimos Check-ins
      </Text>

      {checkins.length === 0 ? (
        <Text
          style={{
            color: colors.textMuted,
          }}
        >
          Ainda não existem check-ins.
        </Text>
      ) : (
        checkins.map((checkin) => (
          <View
            key={checkin.worker_id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radius.pill,
                backgroundColor: colors.companySoft,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="person"
                size={20}
                color={colors.company}
              />
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: spacing[3],
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "700",
                }}
              >
                {checkin.worker_name}
              </Text>

              <Text
                style={{
                  color: colors.textMuted,
                  fontSize:
                    typography.caption.fontSize,
                }}
              >
                {checkin.project_name}
              </Text>
            </View>

            <View
              style={{
                alignItems: "flex-end",
              }}
            >
              <Text
                style={{
                  color: colors.company,
                  fontWeight: "800",
                }}
              >
                {checkin.time}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 2,
                }}
              >
                <Ionicons
                  name="ellipse"
                  size={8}
                  color={colors.success}
                />

                <Text
                  style={{
                    color: colors.success,
                    marginLeft: 4,
                    fontSize: 11,
                  }}
                >
                  Presente
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}