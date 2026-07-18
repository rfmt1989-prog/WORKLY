import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "@/src/context/AuthContext";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

export default function CompanyProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

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

      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.large,
          padding: spacing[6],
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.companySoft,
            borderWidth: 1,
            borderColor: colors.company,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="business-outline"
            size={38}
            color={colors.company}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing[4],
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: "800",
            }}
          >
            {user?.name ?? "Workly Demo Company"}
          </Text>

          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.success}
            style={{
              marginLeft: spacing[2],
            }}
          />
        </View>

        <Text
          style={{
            color: colors.company,
            fontWeight: "700",
            marginTop: spacing[1],
          }}
        >
          Empresa verificada
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          {user?.email ?? "company@workly.pt"}
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: spacing[3],
            marginTop: spacing[5],
          }}
        >
          <Metric
            value="18"
            label="Trabalhadores"
          />

          <Metric
            value="4"
            label="Obras"
          />

          <Metric
            value="96%"
            label="Pulse"
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
        Empresa
      </Text>

      <MenuItem
        icon="business-outline"
        title="Dados da empresa"
        subtitle="Nome, NIF, localização e contactos"
      />

      <MenuItem
        icon="image-outline"
        title="Logótipo e capa"
        subtitle="Identidade visual da empresa"
      />

      <MenuItem
        icon="location-outline"
        title="Zonas de atuação"
        subtitle="Regiões onde a empresa trabalha"
      />

      <MenuItem
        icon="ribbon-outline"
        title="Certificações"
        subtitle="Licenças, seguros e documentos"
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
        icon="people-outline"
        title="Utilizadores e permissões"
        subtitle="Gestores, administradores e acessos"
      />

      <MenuItem
        icon="card-outline"
        title="Plano e faturação"
        subtitle="Plano atual, pagamentos e faturas"
      />

      <MenuItem
        icon="notifications-outline"
        title="Notificações"
        subtitle="Alertas de obras, equipas e mensagens"
      />

      <MenuItem
        icon="shield-checkmark-outline"
        title="Segurança"
        subtitle="Password, sessões e autenticação"
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
        Suporte
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
          minHeight: 54,
          marginTop: spacing[6],
          borderWidth: 1,
          borderColor: colors.danger,
          borderRadius: radius.medium,
          backgroundColor: "rgba(255, 45, 45, 0.14)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="log-out-outline"
          size={21}
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
        WORKLY versão 0.8.0
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
          Perfil da Empresa
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          Dados, verificação e preferências
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
          color={colors.company}
        />
      </View>
    </View>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View
      style={{
        minWidth: 92,
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
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: pressed
          ? colors.surfaceHover
          : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[4],
        marginBottom: spacing[3],
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: radius.medium,
          backgroundColor: colors.companySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={icon}
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