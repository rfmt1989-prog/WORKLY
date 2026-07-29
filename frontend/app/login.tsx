import React, {
  useEffect,
  useState,
} from "react";

import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui";
import {
  UserRole,
  useAuth,
} from "@/src/context/AuthContext";
import {
  useThemeMode,
} from "@/src/context/ThemeContext";
import {
  radius,
  spacing,
  useColors,
} from "@/src/theme/theme";

type ScreenMode = "login" | "register";

export default function Login() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    login,
    register,
  } = useAuth();

  const {
    cycle,
    mode: themeMode,
  } = useThemeMode();

  const [role, setRole] =
    useState<UserRole>("worker");

  const [screenMode, setScreenMode] =
    useState<ScreenMode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    biometricsAvailable,
    setBiometricsAvailable,
  ] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const hasHardware =
          await LocalAuthentication
            .hasHardwareAsync();

        const enrolled =
          await LocalAuthentication
            .isEnrolledAsync();

        setBiometricsAvailable(
          hasHardware && enrolled
        );
      } catch {
        setBiometricsAvailable(false);
      }
    };

    void checkBiometrics();
  }, []);

  const navigateAfterLogin = (
  authenticatedRole: UserRole
) => {
  if (authenticatedRole === "worker") {
    router.replace("/(worker)" as any);
    return;
  }

  router.replace("/(company)" as any);
};
  const submit = async () => {
    Keyboard.dismiss();
    setError("");

    const cleanName = name.trim();
    const cleanEmail =
      email.trim().toLowerCase();

    if (
      !cleanEmail ||
      !password ||
      (screenMode === "register" &&
        !cleanName)
    ) {
      setError(
        "Preenche todos os campos."
      );

      return;
    }

    try {
      setLoading(true);

      if (screenMode === "login") {
        const authenticatedUser =
          await login(
            cleanEmail,
            password,
            role
          );

        await Haptics
          .notificationAsync(
            Haptics
              .NotificationFeedbackType
              .Success
          );

        navigateAfterLogin(
          authenticatedUser.role
        );

        return;
      }

      await register(
        cleanName,
        cleanEmail,
        password,
        role
      );

      await Haptics
        .notificationAsync(
          Haptics
            .NotificationFeedbackType
            .Success
          );

      navigateAfterLogin(role);
    } catch (
      caughtError: unknown
    ) {
      console.error(
        "Erro de autenticação:",
        caughtError
      );

      const message =
        caughtError instanceof Error
          ? getReadableError(
              caughtError.message
            )
          : "Não foi possível autenticar.";

      setError(message);

      await Haptics
        .notificationAsync(
          Haptics
            .NotificationFeedbackType
            .Error
        );
    } finally {
      setLoading(false);
    }
  };

  const biometricLogin = async () => {
    setError("");

    try {
      const authenticationResult =
        await LocalAuthentication
          .authenticateAsync({
            promptMessage:
              "Entrar no WORKLY",
            fallbackLabel:
              "Usar palavra-passe",
            cancelLabel: "Cancelar",
          });

      if (
        !authenticationResult.success
      ) {
        return;
      }

      setLoading(true);

      const demoEmail =
        role === "worker"
          ? "worker@workly.pt"
          : "company@workly.pt";

      const authenticatedUser =
        await login(
          demoEmail,
          "123456",
          role
        );

      await Haptics
        .notificationAsync(
          Haptics
            .NotificationFeedbackType
            .Success
        );

      navigateAfterLogin(
        authenticatedUser.role
      );
    } catch (
      caughtError: unknown
    ) {
      console.error(
        "Erro no login biométrico:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? getReadableError(
              caughtError.message
            )
          : "Não foi possível utilizar a autenticação biométrica."
      );
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setScreenMode("login");
    setError("");
    const demoEmail =
      role === "worker"
        ? "worker@workly.pt"
        : "company@workly.pt";
    setEmail(demoEmail);
    setPassword("123456");
    try {
      setLoading(true);
      const authenticatedUser = await login(
        demoEmail,
        "123456",
        role
      );
      navigateAfterLogin(authenticatedUser.role);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? getReadableError(caughtError.message)
          : "Não foi possível entrar na demonstração."
      );
    } finally {
      setLoading(false);
    }
  };

  const changeRole = (
    nextRole: UserRole
  ) => {
    void Haptics.selectionAsync();

    setRole(nextRole);
    setError("");
  };

  const workerActive =
    role === "worker";

  const accentColor =
    workerActive
      ? "#27A7FF"
      : "#FF2D2D";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          colors.surface,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop:
              insets.top + spacing.xl,
            paddingBottom:
              insets.bottom +
              spacing.xl,
            paddingHorizontal:
              spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent:
                "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: accentColor,
                  fontSize: 38,
                  fontWeight: "900",
                  textShadowColor:
                    accentColor,
                  textShadowRadius: 9,
                }}
              >
                W
              </Text>

              <Text
                style={{
                  color:
                    colors.onSurface,
                  fontSize: 38,
                  fontWeight: "800",
                  letterSpacing: -1.5,
                }}
              >
                ORKLY
              </Text>
            </View>

            <Pressable
              testID="theme-toggle-button"
              onPress={cycle}
              style={{
                width: 44,
                height: 44,
                borderRadius:
                  radius.pill,
                backgroundColor:
                  colors
                    .surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={
                  themeMode === "dark"
                    ? "moon"
                    : themeMode ===
                        "light"
                      ? "sunny"
                      : "contrast"
                }
                size={20}
                color={
                  colors.onSurface
                }
              />
            </Pressable>
          </View>

          <Text
            style={{
              color: colors.muted,
              fontSize: 16,
              marginTop: spacing.xs,
              marginBottom:
                spacing["2xl"],
            }}
          >
            Uma plataforma. Toda a operação.
          </Text>

          <Text
            style={{
              color:
                colors.onSurface,
              fontSize: 13,
              fontWeight: "700",
              marginBottom:
                spacing.sm,
              textTransform:
                "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Escolhe o teu perfil
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              marginBottom:
                spacing.xl,
            }}
          >
            {(
              [
                "worker",
                "company",
              ] as UserRole[]
            ).map((currentRole) => {
              const active =
                role === currentRole;

              const roleColor =
                currentRole === "worker"
                  ? "#27A7FF"
                  : "#FF2D2D";

              return (
                <Pressable
                  key={currentRole}
                  testID={`role-${currentRole}-card`}
                  onPress={() =>
                    changeRole(
                      currentRole
                    )
                  }
                  style={{
                    flex: 1,
                    borderRadius:
                      radius.lg,
                    padding:
                      spacing.lg,
                    backgroundColor:
                      colors
                        .surfaceSecondary,
                    borderWidth:
                      active ? 1.5 : 1,
                    borderColor:
                      active
                        ? roleColor
                        : colors.border,
                    gap: spacing.sm,
                    shadowColor:
                      roleColor,
                    shadowOpacity:
                      active ? 0.35 : 0,
                    shadowRadius: 10,
                    shadowOffset: {
                      width: 0,
                      height: 0,
                    },
                  }}
                >
                  <Ionicons
                    name={
                      currentRole ===
                      "worker"
                        ? "construct-outline"
                        : "business-outline"
                    }
                    size={26}
                    color={
                      active
                        ? roleColor
                        : colors
                            .onSurface
                    }
                  />

                  <Text
                    style={{
                      color:
                        colors
                          .onSurface,
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    {currentRole ===
                    "worker"
                      ? "Worker"
                      : "Company"}
                  </Text>

                  <Text
                    style={{
                      color:
                        colors.muted,
                      fontSize: 12,
                    }}
                  >
                    {currentRole ===
                    "worker"
                      ? "A tua área de trabalho"
                      : "Gere toda a operação"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor:
                colors
                  .surfaceSecondary,
              borderRadius:
                radius.md,
              padding: 4,
              marginBottom:
                spacing.lg,
            }}
          >
            {(
              [
                "login",
                "register",
              ] as ScreenMode[]
            ).map((currentMode) => {
              const active =
                screenMode ===
                currentMode;

              return (
                <Pressable
                  key={currentMode}
                  testID={`segment-${currentMode}`}
                  onPress={() => {
                    setScreenMode(
                      currentMode
                    );

                    setError("");
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius:
                      radius.sm,
                    backgroundColor:
                      active
                        ? colors.surface
                        : "transparent",
                    alignItems:
                      "center",
                  }}
                >
                  <Text
                    style={{
                      color: active
                        ? colors
                            .onSurface
                        : colors.muted,
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    {currentMode ===
                    "login"
                      ? "Entrar"
                      : "Registar"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {screenMode ===
          "register" ? (
            <LoginInput
              testID="name-input"
              icon="person-outline"
              placeholder="Nome completo"
              value={name}
              onChangeText={setName}
              colors={colors}
              accentColor={
                accentColor
              }
            />
          ) : null}

          <LoginInput
            testID="email-input"
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            colors={colors}
            accentColor={accentColor}
          />

          <LoginInput
            testID="password-input"
            icon="lock-closed-outline"
            placeholder="Palavra-passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            colors={colors}
            accentColor={accentColor}
          />

          {error ? (
            <Text
              testID="auth-error"
              style={{
                color: colors.error,
                marginBottom:
                  spacing.md,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {error}
            </Text>
          ) : null}

          <Button
            testID="auth-submit-button"
            label={
              screenMode === "login"
                ? "Entrar"
                : "Criar conta"
            }
            onPress={submit}
            loading={loading}
            style={{
              marginTop:
                spacing.xs,
              borderColor:
                accentColor,
            }}
          />

          {biometricsAvailable &&
          screenMode === "login" ? (
            <Button
              testID="biometric-login-button"
              label="Face ID / Impressão digital"
              icon="finger-print"
              variant="secondary"
              onPress={biometricLogin}
              style={{
                marginTop:
                  spacing.md,
              }}
            />
          ) : null}

          <Pressable
            testID="demo-fill-button"
            onPress={demoLogin}
            style={{
              marginTop:
                spacing.xl,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.muted,
                fontSize: 14,
              }}
            >
              Entrar agora como {role === "worker" ? "Worker Demo" : "Company Demo"} →
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function LoginInput({
  icon,
  colors,
  accentColor,
  testID,
  ...props
}: any) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor:
          colors.surfaceSecondary,
        borderRadius: radius.md,
        paddingHorizontal:
          spacing.lg,
        height: 54,
        marginBottom:
          spacing.md,
        borderWidth:
          StyleSheet.hairlineWidth,
        borderColor:
          colors.border,
        gap: spacing.md,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={accentColor}
      />

      <TextInput
        testID={testID}
        placeholderTextColor={
          colors.muted
        }
        selectionColor={
          accentColor
        }
        style={{
          flex: 1,
          color:
            colors.onSurface,
          fontSize: 16,
          height: "100%",
        }}
        {...props}
      />
    </View>
  );
}

function getReadableError(
  rawMessage: string
) {
  const lowerMessage =
    rawMessage.toLowerCase();

  if (
    rawMessage.includes("401") ||
    lowerMessage.includes(
      "invalid credentials"
    )
  ) {
    return "Email ou palavra-passe incorretos.";
  }

  if (
    lowerMessage.includes(
      "failed to fetch"
    ) ||
    lowerMessage.includes(
      "network request failed"
    )
  ) {
    return "Não foi possível ligar ao servidor na porta 8000.";
  }

  if (
    lowerMessage.includes(
      "registo ainda não está disponível"
    )
  ) {
    return "O registo será disponibilizado na próxima etapa.";
  }

  return rawMessage ||
    "Não foi possível iniciar sessão.";
}
