import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";

import { AttendanceView } from "./AttendanceView";
import { DashboardView } from "./DashboardView";
import { DocumentsView } from "./DocumentsView";
import type { WorkspaceSection } from "./navigation";
import { ProfileView } from "./ProfileView";
import { ProjectsView } from "./ProjectsView";
import {
  Avatar,
  Button,
  Card,
  IconButton,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";
import { TeamsView } from "./TeamsView";
import { WorkersView } from "./WorkersView";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type NavItem = {
  id: WorkspaceSection;
  label: string;
  icon: IconName;
  companyOnly?: boolean;
};

export function WorkspaceShell() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    state,
    loading,
    error,
    language,
    toast,
    setLanguage,
    reload,
    resetDemo,
  } = useWorklyData();
  const { width } = useWindowDimensions();
  const [activeSection, setActiveSection] =
    useState<WorkspaceSection>("dashboard");
  const [resetBusy, setResetBusy] = useState(false);
  const isDesktop = width >= 960;
  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const t = copy[language];

  const navItems = useMemo<NavItem[]>(() => {
    const all: NavItem[] = [
      { id: "dashboard", label: t.dashboard, icon: "grid-outline" },
      {
        id: "workers",
        label: t.workers,
        icon: "people-outline",
        companyOnly: true,
      },
      {
        id: "teams",
        label: t.teams,
        icon: "git-network-outline",
        companyOnly: true,
      },
      { id: "projects", label: t.projects, icon: "business-outline" },
      { id: "attendance", label: t.attendance, icon: "time-outline" },
      { id: "documents", label: t.documents, icon: "folder-open-outline" },
      { id: "profile", label: t.profile, icon: "person-circle-outline" },
    ];
    return all.filter((item) => !item.companyOnly || role === "company");
  }, [role, t.attendance, t.dashboard, t.documents, t.profile, t.projects, t.teams, t.workers]);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleReset = async () => {
    if (resetBusy) return;
    setResetBusy(true);
    try {
      await resetDemo();
      setActiveSection("dashboard");
    } finally {
      setResetBusy(false);
    }
  };

  const content = (() => {
    if (loading && !state) {
      return <LoadingState language={language} accent={accent} />;
    }
    if (error && !state) {
      return (
        <ErrorState
          message={error}
          language={language}
          accent={accent}
          onRetry={() => void reload(true)}
        />
      );
    }
    switch (activeSection) {
      case "workers":
        return <WorkersView />;
      case "teams":
        return <TeamsView />;
      case "projects":
        return <ProjectsView />;
      case "attendance":
        return <AttendanceView />;
      case "documents":
        return <DocumentsView />;
      case "profile":
        return <ProfileView />;
      default:
        return <DashboardView onNavigate={setActiveSection} />;
    }
  })();

  return (
    <View style={styles.root}>
      <View
        pointerEvents="none"
        style={[styles.ambientGlow, { backgroundColor: `${accent}0C` }]}
      />
      {isDesktop ? (
        <Sidebar
          navItems={navItems}
          activeSection={activeSection}
          onNavigate={setActiveSection}
          accent={accent}
          role={role}
          language={language}
          onLanguage={setLanguage}
          onReset={handleReset}
          onLogout={handleLogout}
          resetBusy={resetBusy}
          userName={user.name}
        />
      ) : null}

      <View style={[styles.main, isDesktop ? styles.mainDesktop : null]}>
        <TopBar
          accent={accent}
          role={role}
          userName={user.name}
          language={language}
          onLanguage={setLanguage}
          isDesktop={isDesktop}
          onReset={handleReset}
          onLogout={handleLogout}
          resetBusy={resetBusy}
        />
        <View style={styles.screen}>{content}</View>
        {!isDesktop ? (
          <MobileNav
            items={navItems}
            active={activeSection}
            accent={accent}
            onNavigate={setActiveSection}
          />
        ) : null}
      </View>

      {toast ? (
        <View
          style={[
            styles.toast,
            {
              borderColor:
                toast.tone === "error"
                  ? `${workspaceColors.red}77`
                  : toast.tone === "info"
                    ? `${workspaceColors.blue}77`
                    : `${workspaceColors.green}77`,
            },
          ]}
        >
          <Ionicons
            name={
              toast.tone === "error"
                ? "alert-circle"
                : toast.tone === "info"
                  ? "information-circle"
                  : "checkmark-circle"
            }
            size={19}
            color={
              toast.tone === "error"
                ? workspaceColors.redSoft
                : toast.tone === "info"
                  ? workspaceColors.blueSoft
                  : workspaceColors.green
            }
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Sidebar({
  navItems,
  activeSection,
  onNavigate,
  accent,
  role,
  language,
  onLanguage,
  onReset,
  onLogout,
  resetBusy,
  userName,
}: {
  navItems: NavItem[];
  activeSection: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  accent: string;
  role: "worker" | "company";
  language: "pt" | "en";
  onLanguage: (language: "pt" | "en") => void;
  onReset: () => void;
  onLogout: () => void;
  resetBusy: boolean;
  userName: string;
}) {
  const t = copy[language];
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={[styles.logoMark, { borderColor: `${accent}99`, shadowColor: accent }]}>
          <Text style={[styles.logoLetter, { color: accent }]}>W</Text>
        </View>
        <View>
          <Text style={styles.brandName}>WORKLY</Text>
          <Text style={[styles.brandRole, { color: accent }]}>
            {role === "worker" ? "WORKER" : "COMPANY"}
          </Text>
        </View>
      </View>

      <View style={styles.sidebarProfile}>
        <Avatar name={userName} size={38} accent={accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sidebarName} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={styles.sidebarDemo}>{t.demo}</Text>
        </View>
        <View style={[styles.onlineDot, { backgroundColor: workspaceColors.green }]} />
      </View>

      <View style={styles.navList}>
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeSection === item.id}
            accent={accent}
            onPress={() => onNavigate(item.id)}
          />
        ))}
      </View>

      <View style={styles.sidebarFooter}>
        <LanguageSwitch
          language={language}
          accent={accent}
          onLanguage={onLanguage}
        />
        <Button
          compact
          label={t.resetDemo}
          icon="refresh-outline"
          variant="ghost"
          accent={accent}
          loading={resetBusy}
          onPress={onReset}
        />
        <Button
          compact
          label={t.logout}
          icon="log-out-outline"
          variant="ghost"
          accent={accent}
          onPress={onLogout}
        />
      </View>
    </View>
  );
}

function NavButton({
  item,
  active,
  accent,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navButton,
        active
          ? {
              borderColor: `${accent}55`,
              backgroundColor: `${accent}16`,
            }
          : null,
        pressed ? { opacity: 0.7 } : null,
      ]}
    >
      <View
        style={[
          styles.navIcon,
          active ? { backgroundColor: `${accent}22` } : null,
        ]}
      >
        <Ionicons
          name={item.icon}
          size={19}
          color={active ? accent : workspaceColors.muted}
        />
      </View>
      <Text style={[styles.navLabel, active ? { color: workspaceColors.text } : null]}>
        {item.label}
      </Text>
      {active ? <View style={[styles.navActive, { backgroundColor: accent }]} /> : null}
    </Pressable>
  );
}

function TopBar({
  accent,
  role,
  userName,
  language,
  onLanguage,
  isDesktop,
  onReset,
  onLogout,
  resetBusy,
}: {
  accent: string;
  role: "worker" | "company";
  userName: string;
  language: "pt" | "en";
  onLanguage: (language: "pt" | "en") => void;
  isDesktop: boolean;
  onReset: () => void;
  onLogout: () => void;
  resetBusy: boolean;
}) {
  const t = copy[language];
  return (
    <View style={styles.topbar}>
      {!isDesktop ? (
        <View style={styles.mobileBrand}>
          <View style={[styles.mobileLogo, { borderColor: accent }]}>
            <Text style={[styles.mobileLogoText, { color: accent }]}>W</Text>
          </View>
          <View>
            <Text style={styles.mobileBrandName}>WORKLY</Text>
            <Text style={[styles.mobileRole, { color: accent }]}>
              {role === "worker" ? "WORKER" : "COMPANY"}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.statusLine}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {language === "pt" ? "Demo operacional" : "Operational demo"}
          </Text>
        </View>
      )}
      <View style={styles.topbarActions}>
        {!isDesktop ? (
          <LanguageSwitch
            language={language}
            accent={accent}
            onLanguage={onLanguage}
          />
        ) : null}
        {!isDesktop ? (
          <IconButton
            icon={resetBusy ? "hourglass-outline" : "refresh-outline"}
            label={t.resetDemo}
            accent={accent}
            onPress={onReset}
          />
        ) : null}
        <View style={styles.topbarUser}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.topbarName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.topbarRole}>{t.demo}</Text>
          </View>
          <Avatar name={userName} size={35} accent={accent} />
        </View>
        {!isDesktop ? (
          <IconButton
            icon="log-out-outline"
            label={t.logout}
            accent={accent}
            onPress={onLogout}
          />
        ) : null}
      </View>
    </View>
  );
}

function LanguageSwitch({
  language,
  accent,
  onLanguage,
}: {
  language: "pt" | "en";
  accent: string;
  onLanguage: (language: "pt" | "en") => void;
}) {
  return (
    <View style={styles.languageSwitch}>
      {(["pt", "en"] as const).map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: language === item }}
          onPress={() => onLanguage(item)}
          style={[
            styles.languageButton,
            language === item
              ? { backgroundColor: `${accent}22`, borderColor: `${accent}66` }
              : null,
          ]}
        >
          <Text
            style={[
              styles.languageText,
              language === item ? { color: accent } : null,
            ]}
          >
            {item.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function MobileNav({
  items,
  active,
  accent,
  onNavigate,
}: {
  items: NavItem[];
  active: WorkspaceSection;
  accent: string;
  onNavigate: (section: WorkspaceSection) => void;
}) {
  return (
    <View style={styles.mobileNav}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileNavContent}
      >
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onNavigate(item.id)}
              style={[
                styles.mobileNavItem,
                selected ? { backgroundColor: `${accent}18` } : null,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={selected ? accent : workspaceColors.muted}
              />
              <Text
                style={[
                  styles.mobileNavLabel,
                  selected ? { color: accent } : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function LoadingState({
  language,
  accent,
}: {
  language: "pt" | "en";
  accent: string;
}) {
  return (
    <View style={styles.centerState}>
      <View style={[styles.loaderRing, { borderColor: `${accent}66` }]}>
        <ActivityIndicator color={accent} size="large" />
      </View>
      <Text style={styles.centerTitle}>{copy[language].loading}</Text>
      <Text style={sharedStyles.subtitle}>
        {language === "pt"
          ? "A sincronizar workers, equipas e obras."
          : "Syncing workers, teams and projects."}
      </Text>
    </View>
  );
}

function ErrorState({
  message,
  language,
  accent,
  onRetry,
}: {
  message: string;
  language: "pt" | "en";
  accent: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <Card accent={workspaceColors.red} style={styles.errorCard}>
        <Ionicons
          name="cloud-offline-outline"
          size={38}
          color={workspaceColors.redSoft}
        />
        <Text style={styles.centerTitle}>
          {language === "pt"
            ? "Não foi possível carregar a operação"
            : "Could not load the operation"}
        </Text>
        <Text style={[sharedStyles.subtitle, { textAlign: "center" }]}>
          {message}
        </Text>
        <Button
          label={language === "pt" ? "Tentar novamente" : "Try again"}
          icon="refresh"
          accent={accent}
          onPress={onRetry}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: workspaceColors.background,
    overflow: "hidden",
  },
  ambientGlow: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    right: -260,
    top: -260,
  },
  sidebar: {
    width: 238,
    height: "100%",
    backgroundColor: workspaceColors.backgroundElevated,
    borderRightWidth: 1,
    borderRightColor: workspaceColors.line,
    padding: 16,
    zIndex: 3,
  },
  brand: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 4,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1.5,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  logoLetter: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -2,
  },
  brandName: {
    color: workspaceColors.text,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  brandRole: {
    fontSize: 8,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  sidebarProfile: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 14,
    backgroundColor: workspaceColors.panelSoft,
    padding: 10,
    marginBottom: 15,
  },
  sidebarName: {
    color: workspaceColors.text,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  sidebarDemo: {
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  navList: {
    flex: 1,
    gap: 5,
  },
  navButton: {
    minHeight: 46,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    overflow: "hidden",
  },
  navIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    flex: 1,
    color: workspaceColors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  navActive: {
    position: "absolute",
    right: 0,
    top: 11,
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  sidebarFooter: {
    gap: 7,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: workspaceColors.line,
  },
  languageSwitch: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
  },
  languageButton: {
    minWidth: 34,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  languageText: {
    color: workspaceColors.muted,
    fontSize: 9,
    fontWeight: "800",
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  mainDesktop: {
    paddingLeft: 0,
  },
  topbar: {
    height: 66,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: workspaceColors.line,
    backgroundColor: "rgba(7,9,14,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 2,
  },
  statusLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: workspaceColors.green,
  },
  statusText: {
    color: workspaceColors.muted,
    fontSize: 10,
    fontWeight: "600",
  },
  mobileBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mobileLogo: {
    width: 35,
    height: 35,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: workspaceColors.panelSoft,
  },
  mobileLogoText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -2,
  },
  mobileBrandName: {
    color: workspaceColors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  mobileRole: {
    fontSize: 7,
    lineHeight: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  topbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  topbarUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  topbarName: {
    color: workspaceColors.textSoft,
    maxWidth: 150,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  topbarRole: {
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
  },
  screen: {
    flex: 1,
    minHeight: 0,
  },
  mobileNav: {
    height: 76,
    borderTopWidth: 1,
    borderTopColor: workspaceColors.line,
    backgroundColor: workspaceColors.backgroundElevated,
  },
  mobileNavContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 3,
    alignItems: "center",
  },
  mobileNavItem: {
    minWidth: 70,
    height: 58,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  mobileNavLabel: {
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
  },
  toast: {
    position: "absolute",
    right: 18,
    bottom: 20,
    maxWidth: 390,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    backgroundColor: workspaceColors.panelStrong,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    zIndex: 20,
  },
  toastText: {
    flex: 1,
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  loaderRing: {
    width: 74,
    height: 74,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: workspaceColors.panelSoft,
  },
  centerTitle: {
    color: workspaceColors.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
    textAlign: "center",
  },
  errorCard: {
    maxWidth: 460,
    width: "100%",
    alignItems: "center",
    gap: 13,
  },
});
