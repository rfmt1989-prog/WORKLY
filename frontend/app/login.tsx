import Ionicons from "@expo/vector-icons/Ionicons";
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


import { LanguageSelector } from "@/src/components/LanguageSelector";
import { type UserRole, useAuth } from "@/src/context/AuthContext";
import { loginCopy, readableAuthError } from "@/src/demo/loginI18n";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { IdentityDocumentType } from "@/src/demo/types";

const workspaceColors = {
  background: "#F5F7F8", panel: "#F8FAFB", panelSoft: "#F1F5F6", panelStrong: "#E4EFF2",
  line: "#DEE8EB", lineStrong: "#C7D9DF", text: "#233944", textSoft: "#506D79", muted: "#697F89",
  blue: "#4B7E91", blueSoft: "#4B7E91", red: "#A36363", redSoft: "#A36363", green: "#558777",
};
const roleAccent = (role: UserRole) => role === "worker" ? workspaceColors.blue : workspaceColors.red;
type ScreenMode = "login" | "register";

const DEMO_PASSWORD = "WorklyDemo!";
const DEMO_ACCOUNTS: Record<UserRole, string> = {
  worker: "worker.demo@workly.app",
  company: "company.demo@workly.app",
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

const WORKER_IDENTITY_COPY = {
  pt: {
    title: "Identificação oficial",
    nationality: "Nacionalidade",
    document: "Documento de identificação",
    citizenCard: "Cartão de Cidadão",
    passport: "Passaporte",
    number: "Número do documento",
    privacy: "O número do documento é usado para criar a identidade WORKLY. A verificação depende da análise posterior do documento e o número não aparece no perfil.",
  },
  en: {
    title: "Official identification",
    nationality: "Nationality",
    document: "Identity document",
    citizenCard: "Citizen card",
    passport: "Passport",
    number: "Document number",
    privacy: "The document number creates your WORKLY identity. Verification requires a later review, and the number is never displayed on your profile.",
  },
  fr: {
    title: "Identification officielle",
    nationality: "Nationalité",
    document: "Pièce d’identité",
    citizenCard: "Carte d’identité",
    passport: "Passeport",
    number: "Numéro du document",
    privacy: "Le numéro du document sert uniquement à créer/vérifier une identité WORKLY unique et n’apparaît jamais sur le profil.",
  },
  es: {
    title: "Identificación oficial",
    nationality: "Nacionalidad",
    document: "Documento de identidad",
    citizenCard: "Documento de identidad",
    passport: "Pasaporte",
    number: "Número del documento",
    privacy: "El número del documento solo se usa para crear/verificar una única identidad WORKLY y nunca aparece en el perfil.",
  },
  ro: {
    title: "Identificare oficială",
    nationality: "Naționalitate",
    document: "Document de identitate",
    citizenCard: "Carte de identitate",
    passport: "Pașaport",
    number: "Numărul documentului",
    privacy: "Numărul documentului este folosit doar pentru crearea/verificarea unei singure identități WORKLY și nu apare niciodată în profil.",
  },
  de: {
    title: "Amtliche Identifikation",
    nationality: "Staatsangehörigkeit",
    document: "Ausweisdokument",
    citizenCard: "Personalausweis",
    passport: "Reisepass",
    number: "Dokumentnummer",
    privacy: "Die Dokumentnummer wird nur zur Erstellung/Prüfung einer eindeutigen WORKLY-Identität verwendet und niemals im Profil angezeigt.",
  },
  nl: {
    title: "Officiële identificatie",
    nationality: "Nationaliteit",
    document: "Identiteitsdocument",
    citizenCard: "Identiteitskaart",
    passport: "Paspoort",
    number: "Documentnummer",
    privacy: "Het documentnummer wordt alleen gebruikt om één WORKLY-identiteit aan te maken/te verifiëren en wordt nooit op het profiel getoond.",
  },
} as const;

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 860;
  const { user, loading: sessionLoading, login, register } = useAuth();
  const { language, setLanguage } = useWorklyData();
  const text = loginCopy[language];
  const identityText = WORKER_IDENTITY_COPY[language];

  const [mode, setMode] = useState<ScreenMode>("login");
  const [role, setRole] = useState<UserRole>("worker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [nationality, setNationality] = useState("");
  const [documentType, setDocumentType] = useState<IdentityDocumentType>("citizen_card");
  const [documentNumber, setDocumentNumber] = useState("");
  const [identityConsent, setIdentityConsent] = useState(false);
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
      (mode === "register" && !demoRole && !cleanName) ||
      (mode === "register" &&
        !demoRole &&
        selectedRole === "worker" &&
        (!nationality.trim() || !documentNumber.trim()))
    ) {
      setError(text.required);
      return;
    }
    if (mode === "register" && !demoRole && cleanPassword.length < 10) {
      setError(language === "pt" ? "A palavra-passe deve ter pelo menos 10 caracteres." : "Password must be at least 10 characters.");
      return;
    }
    if (mode === "register" && !demoRole && selectedRole === "worker" && !identityConsent) {
      setError(language === "pt" ? "Confirma que estás a registar os teus próprios dados de identificação." : "Confirm that you are registering your own identity details.");
      return;
    }

    try {
      setSubmitting(demoRole ? `demo-${demoRole}` : "form");
      if (mode === "register" && !demoRole) {
        await register(
          cleanName,
          cleanEmail,
          cleanPassword,
          selectedRole,
          selectedRole === "company" ? inviteToken : undefined,
          selectedRole === "worker"
            ? {
                nationality: nationality.trim(),
                documentType,
                documentNumber: documentNumber.trim(),
              }
            : undefined,
        );
      } else {
        await login(cleanEmail, cleanPassword, selectedRole);
      }
      router.replace("/workspace");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : text.genericError;
      setError(readableAuthError(message, language));
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
        colors={["#F8FAFB", "#EDF3F5", "#F5F7F8"]}
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
          <LanguageSelector language={language} onChange={setLanguage} accent={workspaceColors.blue} />
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
            {!compact && mode === "login" ? (
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
                        role === "company" ? "Nome da empresa" : "Nome conforme documento"
                      }
                      placeholderTextColor={workspaceColors.muted}
                      style={styles.input}
                    />
                  </View>
                </View>
              ) : null}
              {mode === "register" && role === "worker" ? (
                <View style={styles.identityBlock}>
                  <Text style={styles.identityBlockTitle}>{identityText.title}</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>{identityText.nationality}</Text>
                    <View style={styles.inputShell}>
                      <Ionicons name="flag-outline" color={workspaceColors.muted} size={18} />
                      <TextInput
                        accessibilityLabel={identityText.nationality}
                        value={nationality}
                        onChangeText={setNationality}
                        placeholder={language === "pt" ? "Ex.: Portuguesa" : "e.g. Portuguese"}
                        placeholderTextColor={workspaceColors.muted}
                        style={styles.input}
                      />
                    </View>
                  </View>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>{identityText.document}</Text>
                    <View style={styles.documentTypeGrid}>
                      {([
                        ["citizen_card", identityText.citizenCard],
                        ["passport", identityText.passport],
                      ] as [IdentityDocumentType, string][]).map(([value, label]) => {
                        const selected = documentType === value;
                        return (
                          <Pressable
                            key={value}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() => setDocumentType(value)}
                            style={[
                              styles.documentTypeButton,
                              selected && styles.documentTypeButtonActive,
                            ]}
                          >
                            <Ionicons
                              name={value === "passport" ? "book-outline" : "card-outline"}
                              color={selected ? workspaceColors.blueSoft : workspaceColors.muted}
                              size={17}
                            />
                            <Text
                              style={[
                                styles.documentTypeText,
                                selected && styles.documentTypeTextActive,
                              ]}
                            >
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>{identityText.number}</Text>
                    <View style={styles.inputShell}>
                      <Ionicons name="finger-print-outline" color={workspaceColors.muted} size={18} />
                      <TextInput
                        accessibilityLabel={identityText.number}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        value={documentNumber}
                        onChangeText={setDocumentNumber}
                        placeholder="••••••••"
                        placeholderTextColor={workspaceColors.muted}
                        style={styles.input}
                      />
                    </View>
                  </View>
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: identityConsent }} onPress={() => setIdentityConsent(value => !value)} style={styles.identityConsent}>
                    <Ionicons name={identityConsent ? "checkbox" : "square-outline"} size={21} color={workspaceColors.blue} />
                    <Text style={styles.identityConsentText}>{language === "pt" ? "Confirmo que são os meus dados e que irei apresentar um documento para análise. O envio não garante verificação automática." : "I confirm these are my details and will submit an ID for review. Uploading does not automatically verify my identity."}</Text>
                  </Pressable>
                  <View style={styles.identityPrivacy}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={workspaceColors.blueSoft} />
                    <Text style={styles.identityPrivacyText}>{identityText.privacy}</Text>
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
                    placeholder={role === "worker" ? "email@exemplo.pt" : "empresa@exemplo.pt"}
                    placeholderTextColor={workspaceColors.muted}
                    style={styles.input}
                  />
                </View>
              </View>
              {mode === "register" && role === "company" ? (
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{INVITE_CODE_LABEL[language]}</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="key-outline" color={workspaceColors.muted} size={18} />
                    <TextInput
                      accessibilityLabel={INVITE_CODE_LABEL[language]}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      value={inviteToken}
                      onChangeText={setInviteToken}
                      placeholder="WLY-XXXXXXXXXXXX"
                      placeholderTextColor={workspaceColors.muted}
                      style={styles.input}
                    />
                  </View>
                </View>
              ) : null}
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
                { backgroundColor: `${accent}15`, borderColor: `${accent}75`, shadowColor: accent },
                pressed ? { opacity: 0.8 } : null,
                submitting ? { opacity: 0.65 } : null,
              ]}
            >
              {submitting === "form" ? (
                <ActivityIndicator color={accent} />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    {mode === "login" ? text.submitLogin : text.submitRegister}
                  </Text>
                  <Ionicons name="arrow-forward" color={accent} size={18} />
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
    backgroundColor: "#F9FBFC",
    padding: 24,
    gap: 18,
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 20,
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
  identityBlock: {
    gap: 12,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: "#F0F5F7",
    borderRadius: 14,
    padding: 12,
  },
  identityBlockTitle: {
    color: workspaceColors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  documentTypeGrid: {
    flexDirection: "row",
    gap: 8,
  },
  documentTypeButton: {
    flex: 1,
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    backgroundColor: workspaceColors.panelSoft,
    paddingHorizontal: 9,
  },
  documentTypeButtonActive: {
    borderColor: workspaceColors.blue,
    backgroundColor: "#E7F0F3",
  },
  documentTypeText: {
    color: workspaceColors.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  documentTypeTextActive: {
    color: workspaceColors.text,
  },
  identityConsent: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 11, borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D2E1E6" },
  identityConsentText: { flex: 1, fontSize: 10, color: "#536E7A", lineHeight: 16 },
  identityPrivacy: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  identityPrivacyText: {
    flex: 1,
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 14,
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
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 5 },
  },
  submitText: {
    color: workspaceColors.blue,
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
