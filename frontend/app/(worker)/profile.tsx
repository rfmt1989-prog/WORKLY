import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

type WorkerProfile = {
  worker_id: number;
  name: string;
  email: string;
  role: string;
  location: string;
  pulse: number;
  rating: number;
  jobs_completed: number;
  phone: string;
  language: string;
};

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profile, setProfile] =
    useState<WorkerProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await api.get<WorkerProfile>(
            "/worker/profile"
          );

        setProfile(result);
      } catch (caughtError) {
        console.error(
          "Erro ao carregar perfil:",
          caughtError
        );

        setError(
          "Não foi possível carregar o perfil."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
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
          A carregar perfil...
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

      <View
        style={{
          alignItems: "center",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.large,
          padding: spacing[6],
        }}
      >
        <View
          style={{
            width: 82,
            height: 82,
            borderRadius: 41,
            backgroundColor: colors.workerSoft,
            borderWidth: 1,
            borderColor: colors.worker,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.worker,
            shadowOpacity: 0.35,
            shadowRadius: 12,
          }}
        >
          <Text
            style={{
              color: colors.worker,
              fontSize: 28,
              fontWeight: "900",
            }}
          >
            {getInitials(
              profile?.name ??
                user?.name ??
                "Demo Worker"
            )}
          </Text>
        </View>

        <Text
          style={{
            color: colors.text,
            fontSize: 24,
            fontWeight: "800",
            marginTop: spacing[4],
          }}
        >
          {profile?.name ??
            user?.name ??
            "Demo Worker"}
        </Text>

        <Text
          style={{
            color: colors.worker,
            fontWeight: "700",
            marginTop: spacing[1],
          }}
        >
          {profile?.role ??
            user?.title ??
            "Profissional"}
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          {profile?.email ??
            user?.email ??
            "worker@workly.pt"}
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          {profile?.location ?? "Localização não definida"}
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: spacing[3],
            marginTop: spacing[5],
          }}
        >
          <ProfileMetric
            value={`${profile?.pulse ?? 0}%`}
            label="Pulse"
          />

          <ProfileMetric
            value={String(profile?.rating ?? 0)}
            label="Avaliação"
          />

          <ProfileMetric
            value={String(
              profile?.jobs_completed ?? 0
            )}
            label="Trabalhos"
          />
        </View>
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
        Dados profissionais
      </Text>

      <InfoCard
        icon="call-outline"
        label="Telefone"
        value={
          profile?.phone ??
          "Não definido"
        }
      />

      <InfoCard
        icon="language-outline"
        label="Idioma principal"
        value={
          profile?.language ??
          "Português"
        }
      />

      <InfoCard
        icon="location-outline"
        label="Localização"
        value={
          profile?.location ??
          "Não definida"
        }
      />

      <Text
        style={{
          color: colors.text,
          fontSize: typography.heading.fontSize,
          fontWeight: typography.heading.fontWeight,
          marginTop: spacing[8],
          marginBottom: spacing[3],
        }}
      >
        Conta
      </Text>

      <MenuItem
        icon="person-outline"
        title="Dados pessoais"
        subtitle="Nome, contacto e morada"
      />

      <MenuItem
        icon="construct-outline"
        title="Perfil profissional"
        subtitle="Profissão, experiência e competências"
      />

      <MenuItem
        icon="shield-checkmark-outline"
        title="Segurança e privacidade"
        subtitle="Password, biometria e permissões"
      />

      <MenuItem
        icon="notifications-outline"
        title="Notificações"
        subtitle="Alertas de obra, documentos e mensagens"
      />

      <MenuItem
        icon="language-outline"
        title="Idioma"
        subtitle={
          profile?.language ??
          "Português"
        }
      />

      <Text
        style={{
          color: colors.text,
          fontSize: typography.heading.fontSize,
          fontWeight: typography.heading.fontWeight,
          marginTop: spacing[8],
          marginBottom: spacing[3],
        }}
      >
        WORKLY
      </Text>

      <MenuItem
        icon="help-circle-outline"
        title="Ajuda e suporte"
        subtitle="Contactar a equipa WORKLY"
      />

      <MenuItem
        icon="document-text-outline"
        title="Termos e privacidade"
        subtitle="Documentação legal da plataforma"
      />

      <Pressable
        onPress={handleLogout}
        style={{
          minHeight: 52,
          borderWidth: 1,
          borderColor: colors.danger,
          borderRadius: radius.medium,
          backgroundColor:
            "rgba(255, 45, 45, 0.14)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: spacing[6],
        }}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color={colors.danger}
        />

        <Text
          style={{
            color: colors.danger,
            fontWeight: "800",
            marginLeft: spacing[2],
          }}
        >
          Terminar sessão
        </Text>
      </Pressable>

      <Text
        style={{
          color: colors.textDisabled,
          textAlign: "center",
          fontSize: 11,
          marginTop: spacing[5],
        }}
      >
        WORKLY versão 0.4.0
      </Text>
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
          Perfil
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          Conta e preferências
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
          name="settings-outline"
          size={20}
          color={colors.worker}
        />
      </View>
    </View>
  );
}

function ProfileMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View
      style={{
        minWidth: 82,
        backgroundColor: colors.backgroundElevated,
        borderRadius: radius.medium,
        padding: spacing[3],
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: "900",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          fontSize: 11,
          marginTop: 3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function InfoCard({
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
          width: 40,
          height: 40,
          borderRadius: radius.medium,
          backgroundColor: colors.workerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={19}
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
            fontWeight: "800",
            marginTop: 3,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
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
          width: 40,
          height: 40,
          borderRadius: radius.medium,
          backgroundColor: colors.workerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={19}
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
            color: colors.text,
            fontWeight: "800",
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            fontSize: 12,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textDisabled}
      />
    </Pressable>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
