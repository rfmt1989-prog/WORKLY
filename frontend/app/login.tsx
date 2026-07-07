import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { useThemeMode } from "@/src/context/ThemeContext";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { Button } from "@/src/components/ui";

type Role = "worker" | "company";

export default function Login() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, register } = useAuth();
  const { cycle, mode } = useThemeMode();

  const [role, setRole] = useState<Role>("worker");
  const [mode2, setMode2] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBioAvailable(hw && enrolled);
    })();
  }, []);

  const submit = async () => {
    Keyboard.dismiss();
    setError("");
    if (!email || !password || (mode2 === "register" && !name)) {
      setError("Preenche todos os campos");
      return;
    }
    setLoading(true);
    try {
      if (mode2 === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password, role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Erro ao autenticar");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const biometricLogin = async () => {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: "Entrar no WORKLY",
      fallbackLabel: "Usar password",
    });
    if (res.success) {
      const demoEmail = role === "worker" ? "worker@workly.com" : "company@workly.com";
      setLoading(true);
      try {
        await login(demoEmail, "password123");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const fillDemo = () => {
    setEmail(role === "worker" ? "worker@workly.com" : "company@workly.com");
    setPassword("password123");
    setMode2("login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl, paddingHorizontal: spacing.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: c.onSurface, fontSize: 38, fontWeight: "800", letterSpacing: -1.5 }}>WORKLY</Text>
            <Pressable
              testID="theme-toggle-button"
              onPress={cycle}
              style={{ width: 44, height: 44, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name={mode === "dark" ? "moon" : mode === "light" ? "sunny" : "contrast"} size={20} color={c.onSurface} />
            </Pressable>
          </View>
          <Text style={{ color: c.muted, fontSize: 16, marginTop: spacing.xs, marginBottom: spacing["2xl"] }}>
            Workforce management, elevated.
          </Text>

          {/* Role selector */}
          <Text style={{ color: c.onSurface, fontSize: 13, fontWeight: "700", marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Escolhe o teu perfil
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }}>
            {(["worker", "company"] as Role[]).map((r) => {
              const active = role === r;
              return (
                <Pressable
                  key={r}
                  testID={`role-${r}-card`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRole(r);
                  }}
                  style={{
                    flex: 1,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    backgroundColor: active ? c.brand : c.surfaceSecondary,
                    borderWidth: 1.5,
                    borderColor: active ? c.brand : c.border,
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons
                    name={r === "worker" ? "construct" : "business"}
                    size={26}
                    color={active ? c.onBrand : c.onSurface}
                  />
                  <Text style={{ color: active ? c.onBrand : c.onSurface, fontSize: 17, fontWeight: "700" }}>
                    {r === "worker" ? "Worker" : "Company"}
                  </Text>
                  <Text style={{ color: active ? c.onBrand : c.muted, fontSize: 12 }}>
                    {r === "worker" ? "Encontra trabalho" : "Contrata talento"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Segmented control */}
          <View style={{ flexDirection: "row", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: 4, marginBottom: spacing.lg }}>
            {(["login", "register"] as const).map((m) => {
              const active = mode2 === m;
              return (
                <Pressable
                  key={m}
                  testID={`segment-${m}`}
                  onPress={() => setMode2(m)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: active ? c.surface : "transparent", alignItems: "center" }}
                >
                  <Text style={{ color: active ? c.onSurface : c.muted, fontWeight: "700", fontSize: 15 }}>
                    {m === "login" ? "Entrar" : "Registar"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {mode2 === "register" && (
            <Input testID="name-input" icon="person-outline" placeholder="Nome completo" value={name} onChangeText={setName} c={c} />
          )}
          <Input
            testID="email-input"
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            c={c}
          />
          <Input
            testID="password-input"
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            c={c}
          />

          {error ? (
            <Text testID="auth-error" style={{ color: c.error, marginBottom: spacing.md, fontSize: 14, fontWeight: "600" }}>
              {error}
            </Text>
          ) : null}

          <Button
            testID="auth-submit-button"
            label={mode2 === "login" ? "Entrar" : "Criar conta"}
            onPress={submit}
            loading={loading}
            style={{ marginTop: spacing.xs }}
          />

          {bioAvailable && mode2 === "login" && (
            <Button
              testID="biometric-login-button"
              label="Face ID / Impressão digital"
              icon="finger-print"
              variant="secondary"
              onPress={biometricLogin}
              style={{ marginTop: spacing.md }}
            />
          )}

          <Pressable testID="demo-fill-button" onPress={fillDemo} style={{ marginTop: spacing.xl, alignItems: "center" }}>
            <Text style={{ color: c.muted, fontSize: 14 }}>
              Usar conta demo ({role}) →
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Input({ icon, c, testID, ...props }: any) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: c.surfaceSecondary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        height: 54,
        marginBottom: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.border,
        gap: spacing.md,
      }}
    >
      <Ionicons name={icon} size={20} color={c.muted} />
      <TextInput
        testID={testID}
        placeholderTextColor={c.muted}
        style={{ flex: 1, color: c.onSurface, fontSize: 16, height: "100%" }}
        {...props}
      />
    </View>
  );
}
