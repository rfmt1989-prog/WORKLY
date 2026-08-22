import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { resolveDemoLocation } from "@/src/demo/location";

import type { WorkspaceSection } from "./navigation";
import { premiumCopy, premiumFormat } from "./premiumCopy";
import {
  Button,
  Card,
  SectionTitle,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type Props = { onNavigate: (section: WorkspaceSection) => void };
type CompliancePayload = {
  summary: { total: number; fit: number; attention: number; blocked: number };
  rows: Array<{
    worker_id: string;
    project_id: string;
    project_name: string;
    status: "fit" | "attention" | "blocked";
    fit_for_check_in: boolean;
    issues: Array<{ label: string; code: string }>;
  }>;
};

type ActionItem = {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  detail: string;
  tone: string;
  target: WorkspaceSection;
};

export function PremiumDashboardView({ onNavigate }: Props) {
  const { user } = useAuth();
  const { state, language, checkIn, checkOut } = useWorklyData();
  const { width } = useWindowDimensions();
  const [compliance, setCompliance] = useState<CompliancePayload | null>(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const compact = width < 760;
  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const p = premiumCopy[language];

  const loadCompliance = useCallback(async () => {
    try {
      setCompliance(await api.get<CompliancePayload>("/compliance"));
    } catch {
      setCompliance(null);
    }
  }, []);

  useEffect(() => {
    void loadCompliance();
  }, [loadCompliance]);

  const worker = useMemo(
    () => state?.workers.find((item) => item.id === user?.id),
    [state?.workers, user?.id],
  );

  if (!state || !user) return null;

  if (role === "company") {
    const companyId = user.company_id ?? user.id;
    const projects = state.projects.filter((item) => item.company_id === companyId);
    const teams = state.teams.filter((item) => item.company_id === companyId);
    const attendance = state.attendance.filter((item) => item.company_id === companyId && item.check_out === null);
    const blocked = compliance?.summary.blocked ?? 0;
    const attention = compliance?.summary.attention ?? 0;
    const unassignedTeams = teams.filter((item) => !item.project_id).length;
    const atRiskProjects = projects.filter((item) => item.status === "paused").length;

    const actions: ActionItem[] = [
      ...(blocked > 0
        ? [{
            id: "blocked",
            icon: "shield-outline" as const,
            title: premiumFormat(p.blockedWorkers, { count: blocked }),
            detail: p.resolveBeforeCheckin,
            tone: workspaceColors.redSoft,
            target: "compliance" as WorkspaceSection,
          }]
        : []),
      ...(attention > 0
        ? [{
            id: "attention",
            icon: "warning-outline" as const,
            title: premiumFormat(p.requirementsAttention, { count: attention }),
            detail: p.upcomingExpiries,
            tone: workspaceColors.yellow,
            target: "compliance" as WorkspaceSection,
          }]
        : []),
      ...(unassignedTeams > 0
        ? [{
            id: "teams",
            icon: "git-network-outline" as const,
            title: premiumFormat(p.teamsWithoutSite, { count: unassignedTeams }),
            detail: p.assignTeam,
            tone: workspaceColors.blueSoft,
            target: "teams" as WorkspaceSection,
          }]
        : []),
      ...(atRiskProjects > 0
        ? [{
            id: "risk",
            icon: "pause-circle-outline" as const,
            title: premiumFormat(p.pausedSites, { count: atRiskProjects }),
            detail: p.reviewPlanning,
            tone: workspaceColors.orange,
            target: "projects" as WorkspaceSection,
          }]
        : []),
    ];

    return (
      <ScrollView contentContainerStyle={[styles.page, compact ? styles.pageCompact : null]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: `${accent}55` }]}>
          <View style={[styles.heroGlow, { backgroundColor: `${accent}14` }]} />
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={sharedStyles.label}>{p.commandCenter}</Text>
            <Text style={sharedStyles.title}>{p.attentionTitle}</Text>
            <Text style={sharedStyles.subtitle}>
              {actions.length
                ? premiumFormat(p.prioritiesNow, { count: actions.length })
                : p.stableOperation}
            </Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={[styles.liveDot, { backgroundColor: actions.length ? workspaceColors.yellow : workspaceColors.green }]} />
            <Text style={styles.liveText}>{attendance.length} {p.onSite}</Text>
          </View>
        </View>

        <View style={styles.signalRow}>
          <Signal icon="map-outline" value={projects.filter((item) => item.status === "active").length} label={p.activeSites} tone={accent} onPress={() => onNavigate("operations")} />
          <Signal icon="shield-checkmark-outline" value={compliance ? `${compliance.summary.fit}/${compliance.summary.total}` : "—"} label={p.fit} tone={workspaceColors.green} onPress={() => onNavigate("compliance")} />
          <Signal icon="radio-outline" value={attendance.length} label={p.onSite} tone={workspaceColors.blueSoft} onPress={() => onNavigate("attendance")} />
        </View>

        <View style={[styles.grid, compact ? styles.gridCompact : null]}>
          <Card style={styles.priorityCard}>
            <SectionTitle title={p.priorities} subtitle={p.decisionsOnly} />
            <View style={{ gap: 10, marginTop: 14 }}>
              {actions.length ? actions.slice(0, 5).map((item) => (
                <Pressable key={item.id} onPress={() => onNavigate(item.target)} style={({ pressed }) => [styles.actionRow, pressed ? { opacity: 0.72 } : null]}>
                  <View style={[styles.actionIcon, { backgroundColor: `${item.tone}16` }]}><Ionicons name={item.icon} size={19} color={item.tone} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.actionTitle}>{item.title}</Text><Text style={styles.actionDetail}>{item.detail}</Text></View>
                  <Ionicons name="chevron-forward" size={18} color={workspaceColors.muted} />
                </Pressable>
              )) : (
                <View style={styles.clearState}><Ionicons name="checkmark-circle-outline" size={24} color={workspaceColors.green} /><View style={{ flex: 1 }}><Text style={styles.actionTitle}>{p.allClear}</Text><Text style={styles.actionDetail}>{p.noUrgent}</Text></View></View>
              )}
            </View>
          </Card>

          <Card style={styles.launcherCard}>
            <SectionTitle title={p.quickActions} subtitle={p.rightModule} />
            <View style={styles.launcherGrid}>
              <Launcher icon="map-outline" label={p.operations} onPress={() => onNavigate("operations")} accent={accent} />
              <Launcher icon="people-outline" label={p.workers} onPress={() => onNavigate("workers")} accent={accent} />
              <Launcher icon="business-outline" label={p.projects} onPress={() => onNavigate("projects")} accent={accent} />
              <Launcher icon="shield-checkmark-outline" label={p.compliance} onPress={() => onNavigate("compliance")} accent={accent} />
            </View>
          </Card>
        </View>
      </ScrollView>
    );
  }

  const currentProject = state.projects.find((item) => item.id === worker?.current_project_id || item.worker_ids.includes(user.id));
  const active = state.attendance.find((item) => item.worker_id === user.id && item.check_out === null);
  const ownCompliance = compliance?.rows.find((item) => item.worker_id === user.id && (!currentProject || item.project_id === currentProject.id));
  const blocked = ownCompliance?.fit_for_check_in === false;

  const toggleAttendance = async () => {
    if (attendanceBusy || !currentProject || blocked) return;
    setAttendanceBusy(true);
    try {
      if (active) await checkOut();
      else {
        const location = await resolveDemoLocation(currentProject);
        await checkIn(currentProject.id, location);
      }
      await loadCompliance();
    } finally {
      setAttendanceBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.page, compact ? styles.pageCompact : null]} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { borderColor: `${accent}55` }]}>
        <View style={[styles.heroGlow, { backgroundColor: `${accent}14` }]} />
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={sharedStyles.label}>{p.today}</Text>
          <Text style={sharedStyles.title}>{active ? p.activeWorkSession : p.readyNextStep}</Text>
          <Text style={sharedStyles.subtitle}>{currentProject ? `${currentProject.name} · ${currentProject.location}` : p.noAssignedSite}</Text>
        </View>
        <View style={[styles.liveBadge, { borderColor: `${blocked ? workspaceColors.redSoft : workspaceColors.green}55` }]}>
          <View style={[styles.liveDot, { backgroundColor: blocked ? workspaceColors.redSoft : workspaceColors.green }]} />
          <Text style={styles.liveText}>{blocked ? p.checkinBlocked : p.fit}</Text>
        </View>
      </View>

      <View style={[styles.grid, compact ? styles.gridCompact : null]}>
        <Card accent={blocked ? workspaceColors.redSoft : active ? workspaceColors.green : accent} style={styles.todayCard}>
          <SectionTitle title={p.nextAction} subtitle={blocked ? p.resolveCompliance : active ? p.checkoutWhenFinish : p.validateLocation} />
          <View style={styles.currentProject}>
            <View style={[styles.bigIcon, { borderColor: `${accent}55`, backgroundColor: `${accent}14` }]}><Ionicons name="business-outline" size={24} color={accent} /></View>
            <View style={{ flex: 1 }}><Text style={styles.projectTitle}>{currentProject?.name ?? "—"}</Text><Text style={styles.actionDetail}>{currentProject?.schedule ?? "—"}</Text></View>
          </View>
          {blocked && ownCompliance?.issues[0] ? <Pressable onPress={() => onNavigate("compliance")} style={styles.blocker}><Ionicons name="alert-circle-outline" size={18} color={workspaceColors.redSoft} /><Text style={styles.blockerText}>{ownCompliance.issues[0].label}</Text><Ionicons name="chevron-forward" size={16} color={workspaceColors.redSoft} /></Pressable> : null}
          <Button label={active ? p.checkOut : p.checkIn} icon={active ? "exit-outline" : "navigate-outline"} accent={active ? workspaceColors.green : accent} disabled={!currentProject || blocked} loading={attendanceBusy} onPress={() => void toggleAttendance()} />
        </Card>

        <Card style={styles.launcherCard}>
          <SectionTitle title={p.yourWorkspace} subtitle={p.noDuplicateInfo} />
          <View style={styles.launcherGrid}>
            <Launcher icon="shield-checkmark-outline" label={p.compliance} onPress={() => onNavigate("compliance")} accent={accent} />
            <Launcher icon="time-outline" label={p.attendance} onPress={() => onNavigate("attendance")} accent={accent} />
            <Launcher icon="folder-open-outline" label={p.documents} onPress={() => onNavigate("documents")} accent={accent} />
            <Launcher icon="person-circle-outline" label={p.profile} onPress={() => onNavigate("profile")} accent={accent} />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

function Signal({ icon, value, label, tone, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; value: string | number; label: string; tone: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.signal, pressed ? { opacity: 0.72 } : null]}><Ionicons name={icon} size={18} color={tone} /><Text style={styles.signalValue}>{value}</Text><Text style={styles.signalLabel}>{label}</Text></Pressable>;
}

function Launcher({ icon, label, onPress, accent }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void; accent: string }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.launcher, pressed ? { opacity: 0.72, transform: [{ scale: 0.99 }] } : null]}><View style={[styles.launcherIcon, { backgroundColor: `${accent}14` }]}><Ionicons name={icon} size={20} color={accent} /></View><Text style={styles.launcherLabel}>{label}</Text><Ionicons name="arrow-forward" size={15} color={workspaceColors.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  page: { padding: 22, paddingBottom: 150, gap: 18 },
  pageCompact: { paddingHorizontal: 14, paddingTop: 16 },
  hero: { minHeight: 150, overflow: "hidden", borderWidth: 1, borderRadius: 24, backgroundColor: workspaceColors.panelSoft, padding: 22, flexDirection: "row", alignItems: "center", gap: 18 },
  heroGlow: { position: "absolute", width: 260, height: 260, borderRadius: 130, right: -90, top: -120 },
  liveBadge: { borderWidth: 1, borderColor: workspaceColors.lineStrong, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: workspaceColors.backgroundElevated },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { color: workspaceColors.textSoft, fontSize: 12, fontWeight: "800" },
  signalRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  signal: { minWidth: 150, flexGrow: 1, flexBasis: 0, minHeight: 76, borderWidth: 1, borderColor: workspaceColors.line, backgroundColor: workspaceColors.panel, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  signalValue: { color: workspaceColors.text, fontSize: 20, fontWeight: "900", marginLeft: 2 },
  signalLabel: { color: workspaceColors.muted, fontSize: 11, fontWeight: "700", marginLeft: "auto" },
  grid: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  gridCompact: { flexDirection: "column" },
  priorityCard: { flex: 1.3, minWidth: 0 },
  launcherCard: { flex: 0.8, minWidth: 0 },
  todayCard: { flex: 1.1, minWidth: 0 },
  actionRow: { minHeight: 68, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: workspaceColors.panelSoft },
  actionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionTitle: { color: workspaceColors.text, fontSize: 13, fontWeight: "800" },
  actionDetail: { color: workspaceColors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  clearState: { minHeight: 82, borderWidth: 1, borderColor: `${workspaceColors.green}33`, backgroundColor: `${workspaceColors.green}0B`, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  launcherGrid: { gap: 9, marginTop: 14 },
  launcher: { minHeight: 52, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 13, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: workspaceColors.panelSoft },
  launcherIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  launcherLabel: { color: workspaceColors.textSoft, fontSize: 12, fontWeight: "800", flex: 1 },
  currentProject: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  bigIcon: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  projectTitle: { color: workspaceColors.text, fontSize: 17, fontWeight: "800" },
  blocker: { marginVertical: 14, borderWidth: 1, borderColor: `${workspaceColors.redSoft}55`, backgroundColor: `${workspaceColors.redSoft}0E`, borderRadius: 12, padding: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  blockerText: { color: workspaceColors.redSoft, fontSize: 12, fontWeight: "800", flex: 1 },
});
