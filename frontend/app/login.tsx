import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  roleAccent,
  workspaceColors,
} from "@/src/components/workspace/primitives";
import { type UserRole, useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";

type ScreenMode = "login" | "register";
type Language = "pt" | "en";

const DEMO_PASSWORD = "WorklyDemo!";
const DEMO_ACCOUNTS: Record<UserRole, string> = {
  worker: "worker.demo@workly.app",
  company: "company.demo@workly.app",
};

const labels = {
  pt: {
    eyebrow: "OPERAÇÃO CONECTADA",
    title: "Pessoas certas.\nObras sob controlo.",
    description:
      "Uma visão única para trabalhadores, equipas, horários, documentos e execução no terreno.",
    secure: "Sessão recuperável",
    responsive: "Web e mobile",
    gps: "Presença com GPS",
    login: "Entrar",
    register: "Criar conta",
    worker: "Worker",
    workerDescription: "Perfil, obras e presenças",
    company: "Company",
    companyDescription: "Equipas e operação",
    name: "Nome completo",
    companyName: "Nome da empresa",
    email: "Email",
    password: "Password",
    submitLogin: "Entrar na WORKLY",
    submitRegister: "Criar conta",
    divider: "ou usa uma conta preparada",
    workerDemo: "Entrar como Worker Demo",
    companyDemo: "Entrar como Company Demo",
    demoPassword: "Password única de demonstração",
    required: "Preenche todos os campos.",
    genericError: "Não foi possível autenticar. Confirma os dados e tenta novamente.",
    demoBadge: "DEMO WEB",
    loading: "A recuperar a sessão…",
  },
  en: {
    eyebrow: "CONNECTED OPERATIONS",
    title: "The right people.\nEvery site under control.",
    description:
      "One view for workers, teams, schedules, documents and field execution.",
    secure: "Persistent session",
    responsive: "Web and mobile",
    gps: "GPS attendance",
    login: "Sign in",
    register: "Create account",
    worker: "Worker",
    workerDescription: "Profile, jobs and attendance",
    company: "Company",
    companyDescription: "Teams and operations",
    name: "Full name",
    companyName: "Company name",
    email: "Email",
    password: "Password",
    submitLogin: "Sign in to WORKLY",
    submitRegister: "Create account",
    divider: "or use a ready-made account",
    workerDemo: "Enter as Worker Demo",
    companyDemo: "Enter as Company Demo",
    demoPassword: "Single demonstration password",
    required: "Complete all fields.",
    genericError: "Authentication failed. Check the details and try again.",
    demoBadge: "WEB DEMO",
    loading: "Restoring your session…",
  },
} as const;

function readableError(message: string, language: Language) {
  if (message.includes("401") || message.toLowerCase().includes("invalid")) {
    return language === "pt"
      ? "Email, password ou tipo de conta incorretos."
      : "Incorrect email, password or account type.";
  }
  if (message.includes("409") || message.toLowerCase().includes("exists")) {
    return language === "pt"
      ? "Já existe uma conta com este email."
      : "An account already exists for this email.";
  }
  return labels[language].genericError;
}

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 860;
  const { user, loading: sessionLoading, login, register } = useAuth();
  const { language, setLanguage } = useWorklyData();
  const text = labels[language];

  const [mode, setMode] = useState<ScreenMode>("login");
  const [role, setRole] = useState<UserRole>("worker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const accent = roleAccent(role);
  const formTitle = useMemo(
    () => (mode === "login" ? text.login : text.register),
    [mode, text.login, text.register],
  );

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace("/workspace");
    }
  }, [router, sessionLoading, user]);

  const authenticate = async (demoRole?: UserRole) => {
    Keyboard.dismiss();
    setError("");
    const selectedRole = demoRole ?? role;
    const cleanEmail = demoRole
      ? DEMO_ACCOUNTS[demoRole]
      : email.trim().toLowerCase();
    const cleanPassword = demoRole ? DEMO_PASSWORD : password;
    const cleanName = name.trim();

    if (
      !cleanEmail ||
      !cleanPassword ||
      (mode === "register" && !demoRole && !cleanName)
    ) {
      setError(text.required);
      return;
    }

    try {
      setSubmitting(demoRole ? `demo-${demoRole}` : "form");
      if (mode === "register" && !demoRole) {
        await register(cleanName, cleanEmail, cleanPassword, selectedRole);
      } else {
        await login(cleanEmail, cleanPassword, selectedRole);
      }
      router.replace("/workspace");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : text.genericError;
      setError(readableError(message, language));
    } finally {
      setSubmitting(null);
    }
  };

  if (sessionLoading) {
    return (
      <View style={styles.sessionLoading}>
        <ActivityIndicator size="large" color={workspaceColors.blue} />
        <Text style={styles.sessionLoadingText}>{text.loading}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <LinearGradient
        colors={["#07090E", "#0A0D15", "#080A10"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.blueGlow]} />
      <View style={[styles.glow, styles.redGlow]} />

      <ScrollView
        contentContainerStyle={[
          styles.page,
          compact ? styles.pageCompact : null,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topbar, compact ? styles.topbarCompact : null]}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>W</Text>
            </View>
            <Text style={styles.brand}>WORKLY</Text>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>{text.demoBadge}</Text>
            </View>
          </View>
          <View style={styles.languageSwitch}>
            {(["pt", "en"] as Language[]).map((item) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item === "pt" ? "Português" : "English"}
                key={item}
                onPress={() => setLanguage(item)}
                style={[
                  styles.languageButton,
                  language === item ? styles.languageButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.languageText,
                    language === item ? styles.languageTextActive : null,
                  ]}
                >
                  {item.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.main, compact ? styles.mainCompact : null]}>
          <View style={[styles.hero, compact ? styles.heroCompact : null]}>
            <View style={styles.eyebrow}>
              <View style={styles.liveDot} />
              <Text style={styles.eyebrowText}>{text.eyebrow}</Text>
            </View>
            <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>
              {text.title}
            </Text>
            <Text style={styles.heroDescription}>{text.description}</Text>
            <View style={styles.features}>
              {[
                { icon: "shield-checkmark-outline", label: text.secure },
                { icon: "phone-portrait-outline", label: text.responsive },
                { icon: "location-outline", label: text.gps },
              ].map((feature) => (
                <View key={feature.label} style={styles.feature}>
                  <Ionicons
                    name={feature.icon as keyof typeof Ionicons.glyphMap}
                    color={workspaceColors.blueSoft}
                    size={17}
                  />
                  <Text style={styles.featureText}>{feature.label}</Text>
                </View>
              ))}
            </View>
            {!compact ? (
              <View style={styles.signal}>
                <View style={[styles.signalLine, { backgroundColor: workspaceColors.blue }]} />
                <View style={styles.signalContent}>
                  <Text style={styles.signalValue}>8</Text>
                  <Text style={styles.signalLabel}>WORKERS</Text>
                </View>
                <View style={styles.signalContent}>
                  <Text style={styles.signalValue}>3</Text>
                  <Text style={styles.signalLabel}>OBRAS</Text>
                </View>
                <View style={styles.signalContent}>
                  <Text style={styles.signalValue}>2</Text>
                  <Text style={styles.signalLabel}>EQUIPAS</Text>
                </View>
                <View style={[styles.signalLine, { backgroundColor: workspaceColors.red }]} />
              </View>
            ) : null}
          </View>

          <View style={styles.authCard}>
            <View style={styles.modeTabs}>
              {(["login", "register"] as ScreenMode[]).map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item}
                  onPress={() => {
                    setMode(item);
                    setError("");
                  }}
                  style={[
                    styles.modeTab,
                    mode === item ? styles.modeTabActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      mode === item ? styles.modeTabTextActive : null,
                    ]}
                  >
                    {item === "login" ? text.login : text.register}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.formTitle}>{formTitle}</Text>
            <View style={styles.roleGrid}>
              {(["worker", "company"] as UserRole[]).map((item) => {
                const itemAccent = roleAccent(item);
                const selected = role === item;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={item}
                    onPress={() => {
                      setRole(item);
                      setError("");
                    }}
                    style={[
                      styles.roleCard,
                      selected
                        ? {
                            borderColor: itemAccent,
                            backgroundColor: `${itemAccent}12`,
                            shadowColor: itemAccent,
                          }
                        : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.roleIcon,
                        { backgroundColor: `${itemAccent}18` },
                      ]}
                    >
                      <Ionicons
                        name={item === "worker" ? "person-outline" : "business-outline"}
                        color={itemAccent}
                        size={20}
                      />
                    </View>
                    <View style={styles.roleCopy}>
                      <Text style={styles.roleName}>
                        {item === "worker" ? text.worker : text.company}
                      </Text>
                      <Text style={styles.roleDescription}>
                        {item === "worker"
                          ? text.workerDescription
                          : text.companyDescription}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.roleRadio,
                        selected ? { borderColor: itemAccent } : null,
                      ]}
                    >
                      {selected ? (
                        <View
                          style={[
                            styles.roleRadioInner,
                            { backgroundColor: itemAccent },
                          ]}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.fields}>
              {mode === "register" ? (
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>
                    {role === "company" ? text.companyName : text.name}
                  </Text>
                  <View style={styles.inputShell}>
                    <Ionicons
                      name={role === "company" ? "business-outline" : "person-outline"}
                      color={workspaceColors.muted}
                      size={18}
                    />
                    <TextInput
                      accessibilityLabel={
                        role === "company" ? text.companyName : text.name
                      }
                      value={name}
                      onChangeText={setName}
                      placeholder={
                        role === "company" ? "Atlas Estruturas" : "Rodolfo Maia"
                      }
                      placeholderTextColor={workspaceColors.muted}
                      style={styles.input}
                    />
                  </View>
                </View>
              ) : null}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{text.email}</Text>
                <View style={styles.inputShell}>
                  <Ionicons
                    name="mail-outline"
                    color={workspaceColors.muted}
                    size={18}
                  />
                  <TextInput
                    accessibilityLabel={text.email}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                    placeholder={DEMO_ACCOUNTS[role]}
                    placeholderTextColor={workspaceColors.muted}
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{text.password}</Text>
                <View style={styles.inputShell}>
                  <Ionicons
                    name="lock-closed-outline"
                    color={workspaceColors.muted}
                    size={18}
                  />
                  <TextInput
                    accessibilityLabel={text.password}
                    secureTextEntry
                    textContentType="password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••••"
                    placeholderTextColor={workspaceColors.muted}
                    style={styles.input}
                    onSubmitEditing={() => void authenticate()}
                  />
                </View>
              </View>
            </View>

            {error ? (
              <View accessibilityRole="alert" style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  color={workspaceColors.redSoft}
                  size={18}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                mode === "login" ? text.submitLogin : text.submitRegister
              }
              disabled={submitting !== null}
              onPress={() => void authenticate()}
              style={({ pressed }) => [
                styles.submit,
                { backgroundColor: accent, shadowColor: accent },
                pressed ? { opacity: 0.8 } : null,
                submitting ? { opacity: 0.65 } : null,
              ]}
            >
              {submitting === "form" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    {mode === "login" ? text.submitLogin : text.submitRegister}
                  </Text>
                  <Ionicons name="arrow-forward" color="#FFFFFF" size={18} />
                </>
              )}
            </Pressable>

            {mode === "login" ? (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{text.divider}</Text>
                  <View style={styles.dividerLine} />
                </View>
                <View style={styles.demoButtons}>
                  {(["worker", "company"] as UserRole[]).map((demoRole) => {
                    const demoAccent = roleAccent(demoRole);
                    const isLoading = submitting === `demo-${demoRole}`;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          demoRole === "worker"
                            ? text.workerDemo
                            : text.companyDemo
                        }
                        testID={`demo-login-${demoRole}`}
                        key={demoRole}
                        disabled={submitting !== null}
                        onPress={() => void authenticate(demoRole)}
                        style={({ pressed }) => [
                          styles.demoButton,
                          {
                            borderColor: `${demoAccent}88`,
                            backgroundColor: `${demoAccent}0D`,
                          },
                          pressed ? { opacity: 0.72 } : null,
                        ]}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={demoAccent} size="small" />
                        ) : (
                          <>
                            <Ionicons
                              name={
                                demoRole === "worker"
                                  ? "flash-outline"
                                  : "business-outline"
                              }
                              color={demoAccent}
                              size={18}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.demoButtonText}>
                                {demoRole === "worker"
                                  ? text.workerDemo
                                  : text.companyDemo}
                              </Text>
                              <Text style={styles.demoEmail}>
                                {DEMO_ACCOUNTS[demoRole]}
                              </Text>
                            </View>
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.passwordHint}>
                  <Ionicons
                    name="key-outline"
                    size={14}
                    color={workspaceColors.muted}
                  />
                  <Text style={styles.passwordHintText}>
                    {text.demoPassword}:{" "}
                    <Text style={styles.passwordValue}>{DEMO_PASSWORD}</Text>
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: workspaceColors.background,
  },
  sessionLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: workspaceColors.background,
  },
  sessionLoadingText: {
    color: workspaceColors.muted,
    fontSize: 13,
  },
  glow: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    opacity: 0.12,
  },
  blueGlow: {
    top: -340,
    left: -180,
    backgroundColor: workspaceColors.blue,
  },
  redGlow: {
    bottom: -390,
    right: -220,
    backgroundColor: workspaceColors.red,
  },
  page: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 44,
    gap: 36,
  },
  pageCompact: {
    paddingHorizontal: 18,
    gap: 22,
  },
  topbar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topbarCompact: {
    minHeight: 44,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${workspaceColors.blue}88`,
    backgroundColor: `${workspaceColors.blue}18`,
    shadowColor: workspaceColors.blue,
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  brandMarkText: {
    color: workspaceColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  brand: {
    color: workspaceColors.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2.4,
  },
  demoBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    backgroundColor: workspaceColors.panel,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  demoBadgeText: {
    color: workspaceColors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  languageSwitch: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    padding: 3,
  },
  languageButton: {
    minWidth: 38,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  languageButtonActive: {
    backgroundColor: workspaceColors.panelStrong,
  },
  languageText: {
    color: workspaceColors.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  languageTextActive: {
    color: workspaceColors.text,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 64,
    paddingBottom: 30,
  },
  mainCompact: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    gap: 24,
  },
  hero: {
    flex: 1,
    maxWidth: 580,
    gap: 22,
  },
  heroCompact: {
    maxWidth: 700,
    gap: 14,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: workspaceColors.green,
    shadowColor: workspaceColors.green,
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  eyebrowText: {
    color: workspaceColors.blueSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  heroTitle: {
    color: workspaceColors.text,
    fontSize: 58,
    lineHeight: 62,
    fontWeight: "900",
    letterSpacing: -2.4,
  },
  heroTitleCompact: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.3,
  },
  heroDescription: {
    maxWidth: 500,
    color: workspaceColors.textSoft,
    fontSize: 16,
    lineHeight: 25,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  feature: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    paddingHorizontal: 11,
  },
  featureText: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  signal: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  signalLine: {
    width: 54,
    height: 1,
    opacity: 0.65,
  },
  signalContent: {
    alignItems: "center",
  },
  signalValue: {
    color: workspaceColors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  signalLabel: {
    color: workspaceColors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  authCard: {
    width: "100%",
    maxWidth: 470,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    backgroundColor: "rgba(16,20,29,0.96)",
    padding: 24,
    gap: 18,
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  modeTabs: {
    flexDirection: "row",
    borderRadius: 11,
    backgroundColor: workspaceColors.panelSoft,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: workspaceColors.panelStrong,
  },
  modeTabText: {
    color: workspaceColors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  modeTabTextActive: {
    color: workspaceColors.text,
  },
  formTitle: {
    color: workspaceColors.text,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  roleGrid: {
    flexDirection: "row",
    gap: 10,
  },
  roleCard: {
    flex: 1,
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  roleIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCopy: {
    flex: 1,
    gap: 2,
  },
  roleName: {
    color: workspaceColors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  roleDescription: {
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 13,
  },
  roleRadio: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  roleRadioInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  fields: {
    gap: 13,
  },
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  inputShell: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    backgroundColor: workspaceColors.panelSoft,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: workspaceColors.text,
    fontSize: 13,
    paddingVertical: 9,
  },
  errorBox: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: `${workspaceColors.red}55`,
    backgroundColor: `${workspaceColors.red}10`,
    paddingHorizontal: 12,
  },
  errorText: {
    flex: 1,
    color: workspaceColors.redSoft,
    fontSize: 11,
    lineHeight: 16,
  },
  submit: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: workspaceColors.line,
  },
  dividerText: {
    color: workspaceColors.muted,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  demoButtons: {
    gap: 9,
  },
  demoButton: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
  },
  demoButtonText: {
    color: workspaceColors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  demoEmail: {
    color: workspaceColors.muted,
    fontSize: 9,
    marginTop: 2,
  },
  passwordHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  passwordHintText: {
    color: workspaceColors.muted,
    fontSize: 10,
  },
  passwordValue: {
    color: workspaceColors.textSoft,
    fontWeight: "800",
  },
});
