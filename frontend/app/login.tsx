import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { LanguageSelector } from "@/src/components/LanguageSelector";
import { workspaceColors } from "@/src/components/workspace/primitives";
import { ApiError } from "@/src/api/client";
import { type UserRole, useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { loginCopy, readableAuthError } from "@/src/demo/loginI18n";

type ScreenMode = "login" | "register";

const DEMO_PASSWORD = "WorklyDemo!";
const DEMO_IDS: Record<UserRole, string> = {
  worker: "worker-1",
  company: "company-1",
};

const INVITE_CODE_LABEL = {
  pt: "Código de convite (opcional)",
  en: "Invitation code (optional)",
  fr: "Code d’invitation (facultatif)",
  es: "Código de invitación (opcional)",
  ro: "Cod de invitație (opțional)",
  de: "Einladungscode (optional)",
  nl: "Uitnodigingscode (optioneel)",
} as const;

function WorklyMark() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Workly"
      testID="login-workly-mark"
      style={styles.mark}
    >
      <Svg width={112} height={96} viewBox="0 0 128 108" accessible={false}>
        <Path
          d="M9 18H28L41 69L57 28H71L87 69L100 18H119L99 90H81L64 50L47 90H29Z"
          fill={workspaceColors.blue}
        />
      </Svg>
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: sessionLoading, login, register } = useAuth();
  const { language, setLanguage } = useWorklyData();
  const text = loginCopy[language];
  const passwordInput = useRef<TextInput>(null);
  const identifierInput = useRef<TextInput>(null);
  const requestInFlight = useRef(false);

  const [mode, setMode] = useState<ScreenMode>("login");
  const [role, setRole] = useState<UserRole>("worker");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const registering = mode === "register";
  const busy = submitting !== null;

  useEffect(() => {
    if (!sessionLoading && user) router.replace("/workspace");
  }, [router, sessionLoading, user]);

  const changeMode = () => {
    if (requestInFlight.current) return;
    setMode(registering ? "login" : "register");
    setIdentifier((value) => (value.includes("@") ? value : ""));
    setPassword("");
    setPasswordVisible(false);
    setDemoOpen(false);
    setError("");
  };

  const authenticate = async (demoRole?: UserRole) => {
    if (requestInFlight.current) return;
    Keyboard.dismiss();
    setError("");
    const cleanIdentifier = demoRole ? DEMO_IDS[demoRole] : identifier.trim();
    const cleanPassword = demoRole ? DEMO_PASSWORD : password;
    const cleanName = name.trim();

    if (!cleanIdentifier || !cleanPassword || (registering && !demoRole && !cleanName)) {
      setError(text.required);
      return;
    }

    requestInFlight.current = true;
    setSubmitting(demoRole ? `demo-${demoRole}` : "form");
    try {
      if (registering && !demoRole) {
        await register(
          cleanName,
          cleanIdentifier,
          cleanPassword,
          role,
          role === "company" ? inviteToken : undefined,
        );
      } else {
        // The authenticated account determines its workspace, never a UI role switch.
        await login(cleanIdentifier, cleanPassword);
      }
      router.replace("/workspace");
    } catch (caughtError) {
      const message = caughtError instanceof ApiError
        ? String(caughtError.status)
        : caughtError instanceof Error ? caughtError.message : text.genericError;
      setError(readableAuthError(message, language));
    } finally {
      requestInFlight.current = false;
      setSubmitting(null);
    }
  };

  if (sessionLoading) {
    return (
      <View style={styles.sessionLoading}>
        <WorklyMark />
        <ActivityIndicator size="small" color={workspaceColors.blue} />
        <Text style={styles.hint}>{text.loading}</Text>
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
      <View pointerEvents="none" style={[styles.glow, styles.blueGlow]} />
      <View pointerEvents="none" style={[styles.glow, styles.redGlow]} />
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topbar}>
          <LanguageSelector language={language} onChange={setLanguage} />
        </View>
        <View style={styles.main}>
          <View style={styles.authContent} testID="login-unified-form">
            <WorklyMark />
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.formTitle}>
                {registering ? text.register : text.login}
              </Text>
              <Text style={styles.subtitle}>
                {registering ? text.selectRole : text.unifiedHint}
              </Text>
            </View>

            {registering ? (
              <View accessibilityRole="radiogroup" style={styles.roleGrid}>
                {(["worker", "company"] as UserRole[]).map((item) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: role === item, disabled: busy }}
                    disabled={busy}
                    key={item}
                    testID={`register-role-${item}`}
                    onPress={() => { setRole(item); setError(""); }}
                    style={[styles.roleOption, role === item ? styles.roleSelected : null]}
                  >
                    <Ionicons
                      name={item === "worker" ? "person-outline" : "business-outline"}
                      color={role === item ? workspaceColors.blueSoft : workspaceColors.muted}
                      size={18}
                    />
                    <Text style={[styles.roleName, role === item ? styles.roleNameSelected : null]}>
                      {item === "worker" ? text.worker : text.company}
                    </Text>
                    {role === item ? <Ionicons name="checkmark" size={16} color={workspaceColors.blueSoft} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.fields}>
              {registering ? (
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{role === "company" ? text.companyName : text.name}</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name={role === "company" ? "business-outline" : "person-outline"} color={workspaceColors.muted} size={18} />
                    <TextInput
                      accessibilityLabel={role === "company" ? text.companyName : text.name}
                      testID="register-name-input"
                      autoComplete={role === "worker" ? "name" : "off"}
                      editable={!busy}
                      value={name}
                      onChangeText={setName}
                      placeholder={role === "company" ? text.companyName : text.name}
                      placeholderTextColor={workspaceColors.muted}
                      style={styles.input}
                      returnKeyType="next"
                      onSubmitEditing={() => identifierInput.current?.focus()}
                    />
                  </View>
                </View>
              ) : null}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{registering ? text.email : text.identifier}</Text>
                <View style={styles.inputShell}>
                  <Ionicons name={registering ? "mail-outline" : "finger-print-outline"} color={workspaceColors.muted} size={19} />
                  <TextInput
                    ref={identifierInput}
                    accessibilityLabel={registering ? text.email : text.identifier}
                    testID={registering ? "register-email-input" : "login-identifier-input"}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={registering ? "email" : "username"}
                    keyboardType={registering ? "email-address" : "default"}
                    textContentType={registering ? "emailAddress" : "username"}
                    editable={!busy}
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder={registering ? text.email : text.identifierPlaceholder}
                    placeholderTextColor={workspaceColors.muted}
                    style={styles.input}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInput.current?.focus()}
                  />
                </View>
                {!registering ? <Text style={styles.hint}>{text.emailHint}</Text> : null}
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{text.password}</Text>
                <View style={styles.inputShell}>
                  <Ionicons name="lock-closed-outline" color={workspaceColors.muted} size={18} />
                  <TextInput
                    ref={passwordInput}
                    accessibilityLabel={text.password}
                    testID={registering ? "register-password-input" : "login-password-input"}
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={registering ? "new-password" : "current-password"}
                    textContentType={registering ? "newPassword" : "password"}
                    editable={!busy}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={workspaceColors.muted}
                    style={styles.input}
                    returnKeyType="go"
                    onSubmitEditing={() => void authenticate()}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={passwordVisible ? text.hidePassword : text.showPassword}
                    accessibilityState={{ disabled: busy }}
                    disabled={busy}
                    onPress={() => setPasswordVisible((value) => !value)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={19} color={workspaceColors.muted} />
                  </Pressable>
                </View>
              </View>
              {registering && role === "company" ? (
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{INVITE_CODE_LABEL[language]}</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="key-outline" color={workspaceColors.muted} size={18} />
                    <TextInput
                      accessibilityLabel={INVITE_CODE_LABEL[language]}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!busy}
                      value={inviteToken}
                      onChangeText={setInviteToken}
                      placeholder="WLY-XXXXXXXXXXXX"
                      placeholderTextColor={workspaceColors.muted}
                      style={styles.input}
                      onSubmitEditing={() => void authenticate()}
                    />
                  </View>
                </View>
              ) : null}
            </View>

            {error ? (
              <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" color={workspaceColors.redSoft} size={18} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={registering ? text.submitRegister : text.submitLogin}
              accessibilityState={{ disabled: busy, busy }}
              testID={registering ? "register-submit-button" : "login-submit-button"}
              disabled={busy}
              onPress={() => void authenticate()}
              style={({ pressed }) => [styles.submit, pressed ? styles.pressed : null, busy ? styles.disabled : null]}
            >
              {submitting === "form" ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Text style={styles.submitText}>{registering ? text.submitRegister : text.login}</Text>
                  <Ionicons name="arrow-forward" color="#FFFFFF" size={18} />
                </>
              )}
            </Pressable>

            <View style={styles.modeRow}>
              <Text style={styles.hint}>{registering ? text.hasAccount : text.noAccount}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                testID={registering ? "register-login-link" : "login-register-link"}
                onPress={changeMode}
                style={styles.textButton}
              >
                <Text style={styles.link}>{registering ? text.login : text.register}</Text>
              </Pressable>
            </View>

            {!registering ? (
              <View style={styles.demoSection}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: demoOpen, disabled: busy }}
                  testID="login-demo-toggle"
                  disabled={busy}
                  onPress={() => setDemoOpen((value) => !value)}
                  style={styles.demoToggle}
                >
                  <Text style={styles.hint}>{text.tryDemo}</Text>
                  <Ionicons name={demoOpen ? "chevron-up" : "chevron-down"} color={workspaceColors.muted} size={13} />
                </Pressable>
                {demoOpen ? (
                  <View style={styles.demoPanel}>
                    {(["worker", "company"] as UserRole[]).map((demoRole) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={demoRole === "worker" ? text.workerDemo : text.companyDemo}
                        accessibilityState={{ disabled: busy }}
                        testID={`demo-login-${demoRole}`}
                        key={demoRole}
                        disabled={busy}
                        onPress={() => void authenticate(demoRole)}
                        style={({ pressed }) => [styles.demoButton, pressed ? styles.pressed : null]}
                      >
                        <Ionicons name={demoRole === "worker" ? "person-outline" : "business-outline"} size={18} color={workspaceColors.blueSoft} />
                        <View style={styles.demoCopy}>
                          <Text style={styles.demoName}>{demoRole === "worker" ? text.workerDemo : text.companyDemo}</Text>
                          <Text style={styles.hint}>{DEMO_IDS[demoRole]}</Text>
                        </View>
                        {submitting === `demo-${demoRole}` ? <ActivityIndicator color={workspaceColors.blue} size="small" /> : null}
                      </Pressable>
                    ))}
                    <Text style={styles.hint}>{text.demoPassword}: {DEMO_PASSWORD}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07090E" },
  sessionLoading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "#07090E" },
  glow: { position: "absolute", width: 380, height: 380, borderRadius: 190, opacity: 0.055 },
  blueGlow: { top: "12%", left: "-20%", backgroundColor: workspaceColors.blue },
  redGlow: { right: "-25%", bottom: "2%", backgroundColor: workspaceColors.red },
  page: { flexGrow: 1, paddingHorizontal: 24 },
  topbar: { alignItems: "flex-end", minHeight: 44, zIndex: 100 },
  main: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 36 },
  authContent: { width: "100%", maxWidth: 400, gap: 22 },
  mark: { alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  heading: { alignItems: "center", gap: 8 },
  formTitle: { color: workspaceColors.text, fontSize: 25, fontWeight: "700", letterSpacing: -0.7 },
  subtitle: { color: workspaceColors.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  fields: { gap: 18 },
  inputWrap: { gap: 8 },
  inputLabel: { color: workspaceColors.textSoft, fontSize: 12, fontWeight: "600" },
  inputShell: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 13, borderWidth: 1, borderColor: workspaceColors.lineStrong, backgroundColor: "#0D1420", paddingLeft: 15, paddingRight: 6 },
  input: { flex: 1, minWidth: 0, minHeight: 52, color: workspaceColors.text, fontSize: 15, paddingVertical: 12 },
  passwordToggle: { minWidth: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  hint: { color: workspaceColors.muted, fontSize: 12, lineHeight: 18 },
  roleGrid: { flexDirection: "row", gap: 10 },
  roleOption: { flex: 1, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderColor: workspaceColors.lineStrong, paddingHorizontal: 12 },
  roleSelected: { borderColor: workspaceColors.blue, backgroundColor: "#102239" },
  roleName: { color: workspaceColors.muted, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  roleNameSelected: { color: workspaceColors.blueSoft },
  submit: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 13, backgroundColor: "#1466CE" },
  submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.65 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 12, borderWidth: 1, borderColor: "#733542", backgroundColor: "#26131D", padding: 13 },
  errorText: { flex: 1, color: workspaceColors.redSoft, fontSize: 12, lineHeight: 18 },
  modeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: 6 },
  textButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  link: { color: workspaceColors.blueSoft, fontSize: 13, fontWeight: "600" },
  demoSection: { gap: 10 },
  demoToggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  demoPanel: { gap: 10, borderTopWidth: 1, borderTopColor: workspaceColors.line, paddingTop: 18 },
  demoButton: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, borderColor: workspaceColors.lineStrong, padding: 13 },
  demoCopy: { flex: 1, gap: 3 },
  demoName: { color: workspaceColors.textSoft, fontSize: 12, fontWeight: "600" },
});
