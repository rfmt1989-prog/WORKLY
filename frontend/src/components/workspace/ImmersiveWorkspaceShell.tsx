import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LanguageSelector } from "@/src/components/LanguageSelector";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";
import { uiText } from "@/src/demo/fullUi";
import type { CompanyPermission } from "@/src/demo/types";

import { AccessView, accessNavLabel } from "./AccessView";
import { AttendanceView } from "./AttendanceView";
import { DashboardView } from "./DashboardView";
import { DocumentsView } from "./DocumentsView";
import { OperationsMapView } from "./OperationsMapView";
import type { WorkspaceSection } from "./navigation";
import { ProfileView } from "./ProfileView";
import { ProjectsView } from "./ProjectsView";
import { Avatar, Button, roleAccent, workspaceColors } from "./primitives";
import { TeamsView } from "./TeamsView";
import { WorkersView } from "./WorkersView";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type NavItem = {
  id: WorkspaceSection;
  label: string;
  icon: IconName;
  companyOnly?: boolean;
  workerOnly?: boolean;
  permission?: CompanyPermission;
};

export function ImmersiveWorkspaceShell() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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
  const [activeSection, setActiveSection] =
    useState<WorkspaceSection>("dashboard");
  const [resetBusy, setResetBusy] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const t = copy[language];
  const compact = width < 760;

  useEffect(() => {
    fade.stopAnimation();
    fade.setValue(0);
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: 170,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [activeSection, fade]);

  if (!user) return null;

  const allNavItems: NavItem[] = [
    { id: "dashboard", label: t.dashboard, icon: "grid-outline" },
    {
      id: "operations",
      label: t.operations,
      icon: "map-outline",
      companyOnly: true,
      permission: "operations.read",
    },
    {
      id: "workers",
      label: t.workers,
      icon: "people-outline",
      companyOnly: true,
      permission: "workers.read",
    },
    {
      id: "teams",
      label: t.teams,
      icon: "git-network-outline",
      companyOnly: true,
      permission: "teams.read",
    },
    { id: "projects", label: t.projects, icon: "business-outline", permission: "projects.read" },
    { id: "attendance", label: t.attendance, icon: "radio-outline", permission: "attendance.read" },
    { id: "documents", label: t.documents, icon: "folder-open-outline", permission: "documents.read" },
    { id: "access", label: accessNavLabel(language), icon: "key-outline", companyOnly: true },
    {
      id: "certificates",
      label: t.certificates,
      icon: "ribbon-outline",
      workerOnly: true,
    },
    {
      id: "best-projects",
      label: t.bestProjects,
      icon: "trophy-outline",
      workerOnly: true,
    },
    { id: "profile", label: t.profile, icon: "person-circle-outline" },
  ];
  const navItems = allNavItems.filter(
    (item) =>
      (!item.companyOnly || role === "company") &&
      (!item.workerOnly || role === "worker") &&
      (role !== "company" || !item.permission || user.permissions?.includes(item.permission)),
  );

  const operational = (() => {
    if (!state) {
      return {
        primary: t.syncing,
        secondary: "WORKLY",
        activeWorkers: 0,
        activeProjects: 0,
      };
    }

    if (role === "company") {
      const companyId = user.company_id ?? user.id;
      const activeWorkers = state.attendance.filter(
        (item) => item.company_id === companyId && item.check_out === null,
      ).length;
      const activeProjects = state.projects.filter(
        (item) => item.company_id === companyId && item.status === "active",
      ).length;

      return {
        primary:
          activeWorkers > 0 ? `${activeWorkers} ${t.onSiteNow}` : t.operationReady,
        secondary: `${activeProjects} ${t.activeProjects}`,
        activeWorkers,
        activeProjects,
      };
    }

    const activeAttendance = state.attendance.find(
      (item) => item.worker_id === user.id && item.check_out === null,
    );
    const projectId =
      activeAttendance?.project_id ??
      state.workers.find((worker) => worker.id === user.id)?.current_project_id;
    const project = state.projects.find((item) => item.id === projectId);
    const activeProjects = state.projects.filter((item) =>
      item.worker_ids.includes(user.id),
    ).length;

    return {
      primary: activeAttendance ? t.activeSession : t.readyCheckIn,
      secondary:
        project?.name ??
        t.noProject,
      activeWorkers: activeAttendance ? 1 : 0,
      activeProjects,
    };
  })();

  const navigate = (section: WorkspaceSection) => {
    setActiveSection(section);
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

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const content = (() => {
    if (loading && !state) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color={accent} size="large" />
          <Text style={styles.stateTitle}>{t.loading}</Text>
        </View>
      );
    }

    if (error && !state) {
      return (
        <View style={styles.centerState}>
          <Ionicons
            name="cloud-offline-outline"
            size={34}
            color={workspaceColors.redSoft}
          />
          <Text style={styles.stateTitle}>
            {t.connectionUnavailable}
          </Text>
          <Text style={styles.stateText}>{error}</Text>
          <Button
            compact
            label={t.tryAgain}
            icon="refresh-outline"
            accent={accent}
            onPress={() => void reload(true)}
          />
        </View>
      );
    }

    switch (activeSection) {
      case "operations":
        return <OperationsMapView />;
      case "workers":
        return <WorkersView />;
      case "teams":
        return <TeamsView />;
      case "projects":
        return <ProjectsView />;
      case "attendance":
        return <AttendanceView />;
      case "documents":
        return <DocumentsView key="archive" mode="archive" />;
      case "access":
        return <AccessView />;
      case "certificates":
        return <DocumentsView key="certificates" mode="certificates" />;
      case "best-projects":
        return <DocumentsView key="best-projects" mode="bestProjects" />;
      case "profile":
        return <ProfileView />;
      default:
        return <DashboardView onNavigate={navigate} />;
    }
  })();

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.topbar,
          {
            paddingTop: Math.max(insets.top, 8),
            borderBottomColor: `${accent}24`,
          },
        ]}
      >
        <View style={styles.brandBlock}>
          <View style={[styles.logo, { borderColor: `${accent}99` }]}>
            <Text style={[styles.logoText, { color: accent }]}>W</Text>
          </View>
          <View>
            <Text style={styles.brandName}>WORKLY</Text>
            <Text style={[styles.roleLabel, { color: accent }]}>
              {uiText(language, role === "worker" ? "TRABALHADOR" : "EMPRESA", role === "worker" ? "WORKER" : "COMPANY")}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            role === "company" ? t.openOperations : t.openAttendance
          }
          onPress={() => navigate(role === "company" ? "operations" : "attendance")}
          style={({ pressed }) => [
            styles.liveStrip,
            { borderColor: `${accent}38` },
            pressed ? { opacity: 0.76 } : null,
          ]}
        >
          <View style={styles.liveDot} />
          <View style={{ minWidth: 0 }}>
            <Text style={styles.livePrimary} numberOfLines={1}>
              {operational.primary}
            </Text>
            <Text style={styles.liveSecondary} numberOfLines={1}>
              {operational.secondary}
            </Text>
          </View>
        </Pressable>

        {!compact ? (
          <View style={styles.metricStrip}>
            <MetricMini
              icon="people-outline"
              value={operational.activeWorkers}
              label={t.onSite}
              accent={accent}
            />
            <MetricMini
              icon="business-outline"
              value={operational.activeProjects}
              label={t.projects}
              accent={accent}
            />
          </View>
        ) : null}

        <View style={styles.topActions}>
          <LanguageSelector
            language={language}
            accent={accent}
            onChange={setLanguage}
          />
          {!compact ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.resetDemo}
              disabled={resetBusy}
              onPress={() => void handleReset()}
              style={({ pressed }) => [
                styles.iconAction,
                pressed ? { opacity: 0.7 } : null,
              ]}
            >
              {resetBusy ? (
                <ActivityIndicator color={workspaceColors.textSoft} size="small" />
              ) : (
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={workspaceColors.textSoft}
                />
              )}
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.logout}
            onPress={() => void handleLogout()}
            style={({ pressed }) => [
              styles.userAction,
              pressed ? { opacity: 0.74 } : null,
            ]}
          >
            <Avatar name={user.name} size={34} accent={accent} />
            {!compact ? (
              <View style={{ maxWidth: 150 }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.logoutHint}>{t.logout}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        {content}
      </Animated.View>

      <View
        style={[
          styles.dockArea,
          {
            paddingBottom: Math.max(insets.bottom, 10),
            borderTopColor: `${accent}22`,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dockContent}
        >
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                onPress={() => navigate(item.id)}
                style={({ pressed }) => [
                  styles.dockButton,
                  active
                    ? {
                        borderColor: `${accent}66`,
                        backgroundColor: `${accent}16`,
                      }
                    : null,
                  pressed ? { opacity: 0.7 } : null,
                ]}
              >
                <View
                  style={[
                    styles.dockIcon,
                    active ? { backgroundColor: `${accent}22` } : null,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? accent : workspaceColors.muted}
                  />
                </View>
                <Text
                  style={[
                    styles.dockLabel,
                    active ? { color: workspaceColors.text } : null,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {active ? (
                  <View style={[styles.activeLine, { backgroundColor: accent }]} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {toast ? (
        <View style={[styles.toast, { borderColor: `${accent}55` }]}>
          <Ionicons
            name={toast.tone === "error" ? "alert-circle" : "checkmark-circle"}
            size={18}
            color={
              toast.tone === "error" ? workspaceColors.redSoft : workspaceColors.green
            }
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}
    </View>
  );
}

function MetricMini({
  icon,
  value,
  label,
  accent,
}: {
  icon: IconName;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.metricMini}>
      <Ionicons name={icon} size={14} color={accent} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    backgroundColor: workspaceColors.background,
  },
  topbar: {
    minHeight: 66,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    backgroundColor: workspaceColors.backgroundElevated,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minWidth: 126,
  },
  logo: {
    width: 35,
    height: 35,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: workspaceColors.panelSoft,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  brandName: {
    color: workspaceColors.text,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  roleLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  liveStrip: {
    flex: 1,
    minWidth: 0,
    maxWidth: 390,
    minHeight: 42,
    paddingHorizontal: 11,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: workspaceColors.green,
  },
  livePrimary: {
    color: workspaceColors.text,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  liveSecondary: {
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 13,
  },
  metricStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricMini: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricValue: {
    color: workspaceColors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  metricLabel: {
    color: workspaceColors.muted,
    fontSize: 8,
    fontWeight: "600",
  },
  topActions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  languageToggle: {
    padding: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
  },
  languageButton: {
    minWidth: 31,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  languageText: {
    color: workspaceColors.muted,
    fontSize: 9,
    fontWeight: "800",
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  userAction: {
    minHeight: 38,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    color: workspaceColors.textSoft,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  logoutHint: {
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 11,
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: workspaceColors.background,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  stateTitle: {
    color: workspaceColors.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    maxWidth: 520,
    color: workspaceColors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  dockArea: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 10,
    backgroundColor: workspaceColors.backgroundElevated,
    zIndex: 20,
  },
  dockContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 2,
  },
  dockButton: {
    position: "relative",
    minWidth: 84,
    height: 57,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dockIcon: {
    width: 30,
    height: 25,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dockLabel: {
    maxWidth: 100,
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
  },
  activeLine: {
    position: "absolute",
    bottom: 2,
    width: 22,
    height: 2,
    borderRadius: 2,
  },
  toast: {
    position: "absolute",
    right: 16,
    bottom: 92,
    maxWidth: 390,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 13,
    backgroundColor: workspaceColors.panelStrong,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 100,
  },
  toastText: {
    flex: 1,
    color: workspaceColors.textSoft,
    fontSize: 10,
    lineHeight: 15,
  },
});
