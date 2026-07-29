import React from "react";
import { View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

export type CompanyProject = {
  project_id: number;
  name: string;
  location: string;
  progress: number;
  workers: number;
  status: string;
};

type Props = {
  project: CompanyProject;
};

export default function ProjectCard({
  project,
}: Props) {
  const progress = Math.max(
    0,
    Math.min(project.progress, 100)
  );

  const statusColor =
    project.status === "active"
      ? colors.success
      : project.status === "planning"
      ? colors.warning
      : colors.textMuted;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
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
              fontSize: typography.heading.fontSize,
              fontWeight: "800",
            }}
          >
            {project.name}
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              marginTop: spacing[1],
            }}
          >
            {project.location}
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
            borderRadius: radius.pill,
            backgroundColor: statusColor,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {project.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: spacing[4],
        }}
      >
        <Ionicons
          name="people-outline"
          size={18}
          color={colors.company}
        />

        <Text
          style={{
            color: colors.text,
            marginLeft: spacing[2],
          }}
        >
          {project.workers} trabalhadores
        </Text>
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
            Progresso
          </Text>

          <Text
            style={{
              color: colors.company,
              fontWeight: "800",
            }}
          >
            {progress}%
          </Text>
        </View>

        <View
          style={{
            height: 10,
            borderRadius: radius.pill,
            overflow: "hidden",
            backgroundColor: colors.backgroundElevated,
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: colors.company,
            }}
          />
        </View>
      </View>
    </View>
  );
}