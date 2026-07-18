import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { api } from "@/src/api/client";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

import CurrentProjectCard from "@/src/components/worker/dashboard/cards/CurrentProjectCard";
import DashboardHeader from "@/src/components/worker/dashboard/layout/DashboardHeader";
import DashboardShell from "@/src/components/worker/dashboard/layout/DashboardShell";
import HeroProfile from "@/src/components/worker/dashboard/profile/HeroProfile";
import StatsGrid from "@/src/components/worker/dashboard/stats/StatsGrid";

import type {
  WorkerAvailabilityStatus,
  WorkerDashboardData,
} from "@/src/components/worker/dashboard/types";

function normalizeAvailabilityStatus(
  status?: string
): WorkerAvailabilityStatus {
  if (status === "busy") {
    return "busy";
  }

  if (status === "unavailable") {
    return "unavailable";
  }

  return "available";
}

export default function WorkerDashboardScreen() {
  const router = useRouter();

  const [data, setData] =
    useState<WorkerDashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDashboard =
    useCallback(async () => {
      try {
        setError("");

        const result =
          await api.get<WorkerDashboardData>(
            "/worker/dashboard"
          );

        setData(result);
      } catch (caughtError) {
        console.error(
          "Erro ao carregar o dashboard do trabalhador:",
          caughtError
        );

        setError(
          "Não foi possível carregar os dados do trabalhador."
        );
      }
    }, []);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        await loadDashboard();
      } finally {
        setLoading(false);
      }
    };

    void initialLoad();
  }, [loadDashboard]);

  const handleRefresh =
    useCallback(async () => {
      try {
        setRefreshing(true);
        await loadDashboard();
      } finally {
        setRefreshing(false);
      }
    }, [loadDashboard]);

  const handleRetry =
    useCallback(async () => {
      try {
        setLoading(true);
        await loadDashboard();
      } finally {
        setLoading(false);
      }
    }, [loadDashboard]);

  if (loading) {
    return <DashboardLoadingState />;
  }

  if (!data && error) {
    return (
      <DashboardErrorState
        message={error}
        onRetry={() => {
          void handleRetry();
        }}
      />
    );
  }

  return (
    <DashboardShell
      refreshing={refreshing}
      onRefresh={() => {
        void handleRefresh();
      }}
    >
      <DashboardHeader
        workerName={
          data?.name ?? "Trabalhador"
        }
        onMessagesPress={() => {
          router.push("/(worker)/messages");
        }}
        onNotificationsPress={() => {
          router.push("/notifications");
        }}
      />

      {error ? (
        <InlineError
          message={error}
          onRetry={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      <HeroProfile
        profile={{
          worker_id: data?.worker_id,
          name: data?.name,
          role: data?.role,
          pulse: data?.pulse,
          status: data?.status,
          availability_status:
            normalizeAvailabilityStatus(
              data?.status
            ),
          location: data?.location,
          nationality: data?.nationality,
          years_of_experience:
            data?.years_of_experience,
          average_rating:
            data?.average_rating,
          review_count:
            data?.review_count,
          overall_rating:
            data?.overall_rating,
          profile_completion:
            data?.profile_completion,
          avatar_url:
            data?.avatar_url,
          cover_image_url:
            data?.cover_image_url,
        }}
        onViewProfile={() => {
          router.push("/(worker)/profile");
        }}
        onEditProfile={() => {
          router.push("/(worker)/profile");
        }}
      />

      <StatsGrid
        stats={{
          jobs_today:
            data?.stats.jobs_today ?? 0,
          hours_this_week:
            data?.stats.hours_this_week ?? 0,
          documents_pending:
            data?.stats.documents_pending ?? 0,
          unread_messages:
            data?.stats.unread_messages ?? 0,
          completed_projects:
            data?.stats.completed_projects,
          total_hours:
            data?.stats.total_hours,
          valid_certificates:
            data?.stats.valid_certificates,
          average_rating:
            data?.stats.average_rating,
        }}
      />

      <CurrentProjectCard
        project={
          data?.current_project ?? null
        }
        onViewProject={() => {
          router.push("/(worker)/project");
        }}
        onCreateReport={() => {
          router.push("/(worker)/documents");
        }}
        onCheckIn={(project) => {
          console.log(
            "Check-in solicitado:",
            project.project_id
          );
        }}
      />
    </DashboardShell>
  );
}

function DashboardLoadingState() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        padding: spacing[6],
      }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.large,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.worker}
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize:
            typography.body.fontSize,
          fontWeight: "700",
          marginTop: spacing[5],
          textAlign: "center",
        }}
      >
        A carregar a tua área
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          fontSize:
            typography.caption.fontSize,
          marginTop: spacing[2],
          textAlign: "center",
        }}
      >
        Estamos a preparar os dados do teu
        dashboard.
      </Text>
    </View>
  );
}

function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
        padding: spacing[6],
      }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.large,
          borderWidth: 1,
          borderColor: colors.danger,
          backgroundColor: colors.surface,
        }}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={34}
          color={colors.danger}
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize:
            typography.heading.fontSize,
          fontWeight: "800",
          marginTop: spacing[5],
          textAlign: "center",
        }}
      >
        Não foi possível carregar o dashboard
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          fontSize:
            typography.body.fontSize,
          lineHeight: 22,
          marginTop: spacing[2],
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        {message}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tentar carregar novamente"
        onPress={onRetry}
        style={({ pressed }) => ({
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.medium,
          backgroundColor: colors.worker,
          paddingHorizontal: spacing[5],
          marginTop: spacing[6],
          opacity: pressed ? 0.78 : 1,
        })}
      >
        <Ionicons
          name="refresh-outline"
          size={19}
          color="#FFFFFF"
        />

        <Text
          style={{
            color: "#FFFFFF",
            fontWeight: "800",
            marginLeft: spacing[2],
          }}
        >
          Tentar novamente
        </Text>
      </Pressable>
    </View>
  );
}

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.danger,
        backgroundColor: colors.surface,
        borderRadius: radius.medium,
        padding: spacing[4],
        marginBottom: spacing[5],
      }}
    >
      <Ionicons
        name="alert-circle-outline"
        size={21}
        color={colors.danger}
      />

      <Text
        style={{
          flex: 1,
          color: colors.text,
          marginHorizontal: spacing[3],
          lineHeight: 20,
        }}
      >
        {message}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Atualizar dashboard"
        onPress={onRetry}
        hitSlop={10}
      >
        <Ionicons
          name="refresh-outline"
          size={21}
          color={colors.worker}
        />
      </Pressable>
    </View>
  );
}