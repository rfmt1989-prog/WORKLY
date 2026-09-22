import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LanguageSelector } from "@/src/components/LanguageSelector";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { LanguageCode } from "@/src/demo/types";

import { AttendanceView } from "./AttendanceView";
import { DocumentsView } from "./DocumentsView";
import { NotificationCenter } from "./NotificationCenter";
import { WorkerProfileView } from "./WorkerProfileView";
import { ProjectsView } from "./ProjectsView";
import { Avatar, roleAccent, workspaceColors } from "./primitives";

type WorkerSection = "home" | "points" | "projects" | "documents";
type IconName = React.ComponentProps<typeof Ionicons>["name"];

type WorkerNavLabels = {
  home: string;
  points: string;
  projects: string;
  documents: string;
  worker: string;
  logout: string;
};

const workerNavCopy: Record<LanguageCode, WorkerNavLabels> = {
  pt: {
    home: "Início",
    points: "Pontos",
    projects: "Obras",
    documents: "Documentos",
    worker: "TRABALHADOR",
    logout: "Sair",
  },
  en: {
    home: "Home",
    points: "Check-in",
    projects: "Projects",
    documents: "Documents",
    worker: "WORKER",
    logout: "Log out",
  },
  fr: {
    home: "Accueil",
    points: "Pointage",
    projects: "Chantiers",
    documents: "Documents",
    worker: "TRAVAILLEUR",
    logout: "Déconnexion",
  },
  es: {
    home: "Inicio",
    points: "Fichaje",
    projects: "Obras",
    documents: "Documentos",
    worker: "TRABAJADOR",
    logout: "Salir",
  },
  ro: {
    home: "Acasă",
    points: "Pontaj",
    projects: "Șantiere",
    documents: "Documente",
    worker: "LUCRĂTOR",
    logout: "Ieșire",
  },
  de: {
    home: "Start",
    points: "Zeiterfassung",
    projects: "Baustellen",
    documents: "Dokumente",
    worker: "MITARBEITER",
    logout: "Abmelden",
  },
  nl: {
    home: "Start",
    points: "Registratie",
    projects: "Projecten",
    documents: "Documenten",
    worker: "WERKNEMER",
    logout: "Uitloggen",
  },
};

export function WorkerWorkspaceShell() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useWorklyData();
  const [activeSection, setActiveSection] = useState<WorkerSection>("home");
  const fade = useRef(new Animated.Value(1)).current;
  const compact = width < 720;
  const accent = roleAccent("worker");
  const labels = workerNavCopy[language];

  useEffect(() => {
    fade.stopAnimation();
    fade.setValue(0);
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [activeSection, fade]);

  if (!user) return null;

  const navItems: Array<{
    id: WorkerSection;
    label: string;
    icon: IconName;
  }> = [
    { id: "home", label: labels.home, icon: "home-outline" },
    { id: "points", label: labels.points, icon: "location-outline" },
    { id: "projects", label: labels.projects, icon: "business-outline" },
    { id: "documents", label: labels.documents, icon: "folder-open-outline" },
  ];

  const content = (() => {
    switch (activeSection) {
      case "points":
        return <AttendanceView />;
      case "projects":
        return <ProjectsView />;
      case "documents":
        return <DocumentsView key="worker-documents" mode="archive" />;
      default:
        return <WorkerProfileView />;
    }
  })();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

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
            <Text style={[styles.roleLabel, { color: accent }]}>{labels.worker}</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <NotificationCenter />
          <LanguageSelector
            language={language}
            accent={accent}
            onChange={setLanguage}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.logout}
            onPress={() => void handleLogout()}
            style={({ pressed }) => [
              styles.userAction,
              pressed ? { opacity: 0.72 } : null,
            ]}
          >
            <Avatar name={user.name} size={36} accent={accent} />
            {!compact ? (
              <View style={styles.userText}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.logoutHint}>{labels.logout}</Text>
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
            borderTopColor: `${accent}28`,
          },
        ]}
      >
        <View style={styles.dockContent}>
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                onPress={() => setActiveSection(item.id)}
                style={({ pressed }) => [
                  styles.dockButton,
                  active
                    ? {
                        borderColor: `${accent}66`,
                        backgroundColor: `${accent}16`,
                      }
                    : null,
                  pressed ? { opacity: 0.72 } : null,
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
                    size={21}
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
        </View>
      </View>
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
    minHeight: 64,
    paddingHorizontal: 14,
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
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: workspaceColors.panelSoft,
  },
  logoText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
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
    letterSpacing: 1,
  },
  topActions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  userAction: {
    minHeight: 38,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userText: {
    maxWidth: 150,
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
  dockArea: {
    borderTopWidth: 1,
    paddingTop: 7,
    paddingHorizontal: 8,
    backgroundColor: workspaceColors.backgroundElevated,
    zIndex: 20,
  },
  dockContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  dockButton: {
    position: "relative",
    flex: 1,
    minWidth: 0,
    height: 57,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dockIcon: {
    width: 32,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dockLabel: {
    maxWidth: "95%",
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  activeLine: {
    position: "absolute",
    bottom: 2,
    width: 24,
    height: 2,
    borderRadius: 2,
  },
});