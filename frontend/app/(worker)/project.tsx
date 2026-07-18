import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
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

type WorkerCheckStatus = {
  checked_in: boolean;
  project: string;
  company: string;
  location: string;
  check_in_time: string | null;
};

export default function WorkerProjectScreen() {
  const [status, setStatus] =
    useState<WorkerCheckStatus | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadStatus = useCallback(async () => {
    try {
      setError("");

      const result =
        await api.get<WorkerCheckStatus>(
          "/worker/check-status"
        );

      setStatus(result);
    } catch (caughtError) {
      console.error(
        "Erro ao carregar estado de presença:",
        caughtError
      );

      setError(
        "Não foi possível carregar o estado da obra."
      );
    }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        await loadStatus();
      } finally {
        setLoading(false);
      }
    };

    void initialLoad();
  }, [loadStatus]);

  const toggleCheckin = async () => {
    if (submitting || !status) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const endpoint = status.checked_in
        ? "/worker/checkout"
        : "/worker/checkin";

      const result =
        await api.post<WorkerCheckStatus>(
          endpoint,
          {}
        );

      setStatus(result);
    } catch (caughtError) {
      console.error(
        "Erro no check-in/check-out:",
        caughtError
      );

      setError(
        "Não foi possível atualizar a presença."
      );
    } finally {
      setSubmitting(false);
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
          color={colors.worker}
        />

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[3],
          }}
        >
          A carregar a obra...
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
    >
      <Header />

      {error ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.danger,
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
          letterSpacing: 1.1,
        }}
      >
        Obra atual
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
        {status?.project ?? "Sem obra atribuída"}
      </Text>

      <Text
        style={{
          color: colors.worker,
          fontSize: typography.body.fontSize,
          marginTop: spacing[1],
        }}
      >
        {status?.company ?? "Empresa não definida"}
      </Text>

      <View
        style={{
          marginTop: spacing[6],
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.large,
          padding: spacing[5],
        }}
      >
        <InfoRow
          icon="location-outline"
          label="Local"
          value={
            status?.location ??
            "Localização não definida"
          }
        />

        <InfoRow
          icon="time-outline"
          label="Horário"
          value="08:00 — 17:00"
        />

        <InfoRow
          icon="person-outline"
          label="Chefe de equipa"
          value="Carlos Ferreira"
        />

        <InfoRow
          icon="people-outline"
          label="Equipa"
          value="6 trabalhadores"
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
        Presença
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.large,
          padding: spacing[5],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
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
              Estado atual
            </Text>

            <Text
              style={{
                color: status?.checked_in
                  ? colors.success
                  : colors.warning,
                fontSize: 22,
                fontWeight: "800",
                marginTop: spacing[1],
              }}
            >
              {status?.checked_in
                ? "Na obra"
                : "Fora da obra"}
            </Text>

            {status?.checked_in &&
            status.check_in_time ? (
              <Text
                style={{
                  color: colors.textMuted,
                  marginTop: spacing[1],
                }}
              >
                Entrada às {status.check_in_time}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: status?.checked_in
                ? "rgba(34, 197, 94, 0.14)"
                : colors.backgroundElevated,
              borderWidth: 1,
              borderColor: status?.checked_in
                ? colors.success
                : colors.border,
            }}
          >
            <Ionicons
              name={
                status?.checked_in
                  ? "checkmark-circle"
                  : "location-outline"
              }
              size={24}
              color={
                status?.checked_in
                  ? colors.success
                  : colors.textMuted
              }
            />
          </View>
        </View>

        <Pressable
          disabled={submitting}
          onPress={toggleCheckin}
          style={{
            minHeight: 52,
            marginTop: spacing[5],
            borderWidth: 1,
            borderColor: status?.checked_in
              ? colors.danger
              : colors.worker,
            borderRadius: radius.medium,
            backgroundColor: status?.checked_in
              ? "rgba(255, 45, 45, 0.14)"
              : colors.workerSoft,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: status?.checked_in
              ? colors.danger
              : colors.worker,
            shadowOpacity: 0.3,
            shadowRadius: 10,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator
              color={
                status?.checked_in
                  ? colors.danger
                  : colors.worker
              }
            />
          ) : (
            <Text
              style={{
                color: colors.text,
                fontWeight: "800",
              }}
            >
              {status?.checked_in
                ? "Fazer check-out"
                : "Fazer check-in"}
            </Text>
          )}
        </Pressable>
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
        Tarefas de hoje
      </Text>

      <Task
        title="Instalação elétrica — Piso 2"
        status="Em curso"
        done={false}
      />

      <Task
        title="Verificação do quadro principal"
        status="Pendente"
        done={false}
      />

      <Task
        title="Briefing de segurança"
        status="Concluído"
        done
      />
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
      <View>
        <Text
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: "800",
          }}
        >
          Obra
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          Operação e presença
        </Text>
      </View>

      <View
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
          name="construct-outline"
          size={20}
          color={colors.worker}
        />
      </View>
    </View>
  );
}

function InfoRow({
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
        paddingVertical: spacing[3],
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.medium,
          backgroundColor: colors.workerSoft,
          alignItems: "center",
          justifyContent: "center",
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
          marginLeft: spacing[3],
          flex: 1,
        }}
      >
        <Text
          style={{
            color: colors.textMuted,
            fontSize: typography.caption.fontSize,
          }}
        >
          {label}
        </Text>

        <Text
          style={{
            color: colors.text,
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

function Task({
  title,
  status,
  done,
}: {
  title: string;
  status: string;
  done: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[4],
        marginBottom: spacing[3],
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.pill,
          backgroundColor: done
            ? "rgba(34, 197, 94, 0.14)"
            : colors.workerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={
            done
              ? "checkmark"
              : "ellipse-outline"
          }
          size={18}
          color={
            done
              ? colors.success
              : colors.worker
          }
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
          {title}
        </Text>

        <Text
          style={{
            color: done
              ? colors.success
              : colors.textMuted,
            fontSize: typography.caption.fontSize,
            marginTop: 3,
          }}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}