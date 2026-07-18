import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

type CompanyDashboardData = {
  company_id: number;
  company_name: string;
  plan: string;
  pulse: number;
  stats: {
    active_workers: number;
    active_projects: number;
    monthly_cost: number;
    unread_messages: number;
  };
  next_task: {
    project_name: string;
    client: string;
    start_time: string;
    workers_required: number;
  };
};

export default function CompanyDashboardScreen() {
  const [data, setData] =
    useState<CompanyDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const result =
        await api.get<CompanyDashboardData>(
          "/company/dashboard"
        );

      setData(result);
    } catch (caughtError) {
      console.error(
        "Erro ao carregar dashboard Company:",
        caughtError
      );

      setError(
        "Não foi possível carregar os dados da empresa."
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

  const refresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.company}
        />

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[3],
          }}
        >
          A carregar a empresa...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        padding: spacing[5],
        paddingBottom: spacing[16],
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.company}
        />
      }
    >
      <Header />

      {error ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.danger,
            backgroundColor: colors.surface,
            borderRadius: radius.medium,
            padding: spacing[4],
            marginBottom: spacing[5],
          }}
        >
          <Text
            style={{
              color: colors.danger,
              fontWeight: "700",
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <Text
        style={{
          color: colors.textMuted,
          fontSize: typography.label.fontSize,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        Empresa
      </Text>

      <Text
        style={{
          color: colors.text,
          fontSize: typography.display.fontSize,
          lineHeight: typography.display.lineHeight,
          fontWeight: typography.display.fontWeight,
          marginTop: spacing[1],
        }}
      >
        {data?.company_name ?? "Workly Company"}
      </Text>

      <Text
        style={{
          color: colors.company,
          fontSize: typography.body.fontSize,
          marginTop: spacing[1],
        }}
      >
        Plano {data?.plan ?? "Standard"}
      </Text>

      <PulseSection pulse={data?.pulse ?? 0} />

      <View
        style={{
          flexDirection: "row",
          gap: spacing[3],
          marginTop: spacing[5],
        }}
      >
        <Metric
          icon="people-outline"
          value={data?.stats.active_workers ?? 0}
          label="Trabalhadores ativos"
        />

        <Metric
          icon="construct-outline"
          value={data?.stats.active_projects ?? 0}
          label="Obras ativas"
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: spacing[3],
          marginTop: spacing[3],
        }}
      >
        <Metric
          icon="wallet-outline"
          value={`€${(
            data?.stats.monthly_cost ?? 0
          ).toLocaleString("pt-PT")}`}
          label="Custo mensal"
        />

        <Metric
          icon="chatbubble-outline"
          value={data?.stats.unread_messages ?? 0}
          label="Mensagens"
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: typography.heading.fontSize,
          fontWeight: typography.heading.fontWeight,
          marginTop: spacing[8],
          marginBottom: spacing[3],
        }}
      >
        Próxima operação
      </Text>

      {data?.next_task ? (
        <NextTask task={data.next_task} />
      ) : (
        <EmptyTask />
      )}
    </ScrollView>
  );
}

function Header() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing[8],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderWidth: 1.5,
            borderColor: colors.company,
            borderRadius: 7,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.company,
            shadowOpacity: 0.55,
            shadowRadius: 9,
          }}
        >
          <Text
            style={{
              color: colors.company,
              fontWeight: "900",
            }}
          >
            W
          </Text>
        </View>

        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "800",
            marginLeft: spacing[2],
            letterSpacing: 1,
          }}
        >
          WORKLY
        </Text>
      </View>

      <Pressable
        style={{
          width: 42,
          height: 42,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="notifications-outline"
          size={20}
          color={colors.text}
        />
      </Pressable>
    </View>
  );
}

function PulseSection({
  pulse,
}: {
  pulse: number;
}) {
  const safePulse = Math.max(
    0,
    Math.min(100, pulse)
  );

  const status =
    safePulse >= 80
      ? "Estável"
      : safePulse >= 60
        ? "Atenção"
        : "Crítico";

  const statusColor =
    safePulse >= 80
      ? colors.success
      : safePulse >= 60
        ? colors.warning
        : colors.danger;

  return (
    <View
      style={{
        marginTop: spacing[8],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: typography.caption.fontSize,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Company Pulse
          </Text>

          <Text
            style={{
              color: colors.text,
              fontSize: 42,
              fontWeight: "800",
              marginTop: spacing[1],
            }}
          >
            {safePulse}%
          </Text>
        </View>

        <Text
          style={{
            color: statusColor,
            fontWeight: "700",
          }}
        >
          {status}
        </Text>
      </View>

      <View
        style={{
          height: 3,
          backgroundColor: colors.border,
          marginTop: spacing[3],
        }}
      >
        <View
          style={{
            width: `${safePulse}%`,
            height: "100%",
            backgroundColor: colors.company,
            shadowColor: colors.company,
            shadowOpacity: 0.8,
            shadowRadius: 8,
          }}
        />
      </View>
    </View>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 116,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[4],
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={colors.company}
      />

      <Text
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: "800",
          marginTop: spacing[4],
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: typography.caption.fontSize,
          marginTop: spacing[1],
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function NextTask({
  task,
}: {
  task: CompanyDashboardData["next_task"];
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[5],
      }}
    >
      <Text
        style={{
          color: colors.company,
          fontSize: typography.caption.fontSize,
          textTransform: "uppercase",
          letterSpacing: 1,
          fontWeight: "700",
        }}
      >
        Próxima operação
      </Text>

      <Text
        style={{
          color: colors.text,
          fontSize: 22,
          fontWeight: "800",
          marginTop: spacing[2],
        }}
      >
        {task.project_name}
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          marginTop: spacing[1],
        }}
      >
        Cliente: {task.client}
      </Text>

      <InfoRow
        icon="time-outline"
        text={`Início: ${task.start_time}`}
      />

      <InfoRow
        icon="people-outline"
        text={`${task.workers_required} trabalhadores necessários`}
      />

      <Pressable
        style={{
          marginTop: spacing[5],
          minHeight: 50,
          borderWidth: 1,
          borderColor: colors.company,
          borderRadius: radius.medium,
          backgroundColor: colors.companySoft,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.company,
          shadowOpacity: 0.35,
          shadowRadius: 10,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontWeight: "800",
          }}
        >
          Abrir operação
        </Text>
      </Pressable>
    </View>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing[4],
      }}
    >
      <Ionicons
        name={icon}
        size={17}
        color={colors.textMuted}
      />

      <Text
        style={{
          color: colors.text,
          marginLeft: spacing[2],
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function EmptyTask() {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[5],
      }}
    >
      <Text
        style={{
          color: colors.textMuted,
        }}
      >
        Não existem operações agendadas.
      </Text>
    </View>
  );
}