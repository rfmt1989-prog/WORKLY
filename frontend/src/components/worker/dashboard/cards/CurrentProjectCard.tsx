import React from "react";
import {
  Pressable,
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
  WorkerCurrentProject,
} from "../types";

type CurrentProjectCardProps = {
  project: WorkerCurrentProject | null;
  onCheckIn?: (
    project: WorkerCurrentProject
  ) => void;
  onViewProject?: (
    project: WorkerCurrentProject
  ) => void;
  onCreateReport?: (
    project: WorkerCurrentProject
  ) => void;
};

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function CurrentProjectCard({
  project,
  onCheckIn,
  onViewProject,
  onCreateReport,
}: CurrentProjectCardProps) {
  if (!project) {
    return <EmptyCurrentProject />;
  }

  const progress = clampPercentage(
    project.progress ?? 0
  );

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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: spacing[4],
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={{
              color: colors.worker,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1.1,
              fontWeight: "800",
            }}
          >
            Projeto atual
          </Text>

          <Text
            style={{
              color: colors.text,
              fontSize: 23,
              lineHeight: 29,
              fontWeight: "900",
              marginTop: spacing[2],
            }}
          >
            {project.name}
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              fontSize: 14,
              marginTop: spacing[1],
            }}
          >
            {project.company}
          </Text>
        </View>

        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons
            name="business-outline"
            size={22}
            color={colors.worker}
          />
        </View>
      </View>

      <View
        style={{
          marginTop: spacing[5],
          gap: spacing[3],
        }}
      >
        <InformationRow
          icon="location-outline"
          label="Localização"
          value={project.location}
        />

        <InformationRow
          icon="person-outline"
          label="Responsável"
          value={project.team_leader}
        />

        <InformationRow
          icon="time-outline"
          label="Horário"
          value={`${project.start_time} — ${project.end_time}`}
        />

        {project.role ? (
          <InformationRow
            icon="construct-outline"
            label="Função"
            value={project.role}
          />
        ) : null}

        {project.next_task ? (
          <InformationRow
            icon="checkbox-outline"
            label="Próxima tarefa"
            value={project.next_task}
          />
        ) : null}
      </View>

      <View
        style={{
          marginTop: spacing[5],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing[2],
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            Progresso
          </Text>

          <Text
            style={{
              color: colors.worker,
              fontSize: 13,
              fontWeight: "800",
            }}
          >
            {progress}%
          </Text>
        </View>

        <View
          style={{
            height: 7,
            borderRadius: radius.pill,
            backgroundColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: colors.worker,
              borderRadius: radius.pill,
            }}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing[3],
          marginTop: spacing[6],
        }}
      >
        <ActionButton
          title="Fazer check-in"
          icon="log-in-outline"
          disabled={!project.can_check_in}
          primary
          onPress={() => {
            onCheckIn?.(project);
          }}
        />

        <ActionButton
          title="Projeto"
          icon="briefcase-outline"
          onPress={() => {
            onViewProject?.(project);
          }}
        />

        <ActionButton
          title="Relatório"
          icon="document-text-outline"
          onPress={() => {
            onCreateReport?.(project);
          }}
        />
      </View>
    </View>
  );
}

function InformationRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={colors.worker}
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
            color: colors.textMuted,
            fontSize: 12,
          }}
        >
          {label}
        </Text>

        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            fontWeight: "700",
            marginTop: 2,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ActionButton({
  title,
  icon,
  primary = false,
  disabled = false,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  primary?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: 170,
        minHeight: 48,
        borderRadius: radius.medium,
        borderWidth: 1,
        borderColor: primary
          ? colors.worker
          : colors.border,
        backgroundColor: primary
          ? colors.worker
          : colors.background,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing[4],
        opacity: disabled
          ? 0.4
          : pressed
          ? 0.75
          : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          primary
            ? "#FFFFFF"
            : colors.text
        }
      />

      <Text
        style={{
          color: primary
            ? "#FFFFFF"
            : colors.text,
          fontWeight: "800",
          marginLeft: spacing[2],
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function EmptyCurrentProject() {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[6],
        marginBottom: spacing[6],
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 62,
          height: 62,
          borderRadius: 31,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={28}
          color={colors.worker}
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 19,
          fontWeight: "800",
          marginTop: spacing[4],
          textAlign: "center",
        }}
      >
        Sem projeto atribuído
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: 14,
          lineHeight: 21,
          marginTop: spacing[2],
          textAlign: "center",
          maxWidth: 440,
        }}
      >
        Não tens nenhum projeto ou obra atribuído para
        hoje.
      </Text>
    </View>
  );
}