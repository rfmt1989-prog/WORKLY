import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";
import { resolveDemoLocation } from "@/src/demo/location";
import type { Project, Worker } from "@/src/demo/types";

import type { WorkspaceSection } from "./navigation";
import {
  Avatar,
  Button,
  Card,
  MetricCard,
  ProgressBar,
  Score,
  SectionTitle,
  StatusPill,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type Props = {
  onNavigate: (section: WorkspaceSection) => void;
};

export function DashboardView({ onNavigate }: Props) {
  const { user } = useAuth();
  const { state, language, checkIn, checkOut } = useWorklyData();
  const { width } = useWindowDimensions();
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const t = copy[language];
  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const compact = width < 760;

  const worker = useMemo(
    () => state?.workers.find((item) => item.id === user?.id),
    [state?.workers, user?.id],
  );
  const company = useMemo(
    () =>
      state?.companies.find(
        (item) => item.id === (user?.company_id ?? user?.id),
      ),
    [state?.companies, user?.company_id, user?.id],
  );

  if (!state || !user) return null;

  if (role === "company") {
    const companyId = user.company_id ?? user.id;
    const companyProjects = state.projects.filter(
      (item) => item.company_id === companyId,
    );
    const companyTeams = state.teams.filter(
      (item) => item.company_id === companyId,
    );
    const associatedWorkers = state.workers.filter(
      (item) =>
        item.company_id === companyId ||
        companyProjects.some((project) => project.worker_ids.includes(item.id)),
    );
    const activeAttendance = state.attendance.filter(
      (item) => item.company_id === companyId && item.check_out === null,
    );

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, compact ? styles.contentCompact : null]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { borderColor: `${accent}4D` }]}>
          <View style={[styles.heroGlow, { backgroundColor: `${accent}16` }]} />
          <View style={styles.heroHeader}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={sharedStyles.label}>{t.liveMonitoring}</Text>
              <Text style={sharedStyles.title}>
                {language === "pt" ? "Operação sob controlo" : "Operation under control"}
              </Text>
              <Text style={sharedStyles.subtitle}>
                {company?.name ?? user.name} · {activeAttendance.length}{" "}
                {language === "pt" ? "trabalhadores em obra" : "workers on site"}
              </Text>
            </View>
            <View style={styles.heroScores}>
              <Score
                value={company?.trust_score ?? 8.5}
                label={t.trust}
                accent={accent}
                compact={compact}
              />
              <Score
                value={company?.productivity_score ?? 8.5}
                label={t.productivity}
                accent={workspaceColors.green}
                compact={compact}
              />
            </View>
          </View>
          <View style={styles.quickRow}>
            <Button
              compact
              icon="person-add-outline"
              label={language === "pt" ? "Procurar talento" : "Find talent"}
              accent={accent}
              onPress={() => onNavigate("workers")}
            />
            <Button
              compact
              icon="add-circle-outline"
              label={language === "pt" ? "Nova obra" : "New project"}
              variant="secondary"
              accent={accent}
              onPress={() => onNavigate("projects")}
            />
            <Button
              compact
              icon="people-outline"
              label={language === "pt" ? "Gerir equipas" : "Manage teams"}
              variant="secondary"
              accent={accent}
              onPress={() => onNavigate("teams")}
            />
          </View>
        </View>

        <View style={styles.metrics}>
          <MetricCard
            icon="business-outline"
            label={language === "pt" ? "Obras ativas" : "Active projects"}
            value={companyProjects.filter((item) => item.status === "active").length}
            detail={`${companyProjects.length} ${language === "pt" ? "no total" : "total"}`}
            accent={accent}
          />
          <MetricCard
            icon="people-outline"
            label={language === "pt" ? "Equipas" : "Teams"}
            value={companyTeams.length}
            detail={`${associatedWorkers.length} ${language === "pt" ? "profissionais" : "professionals"}`}
            accent={workspaceColors.blueSoft}
          />
          <MetricCard
            icon="location-outline"
            label={language === "pt" ? "Em obra agora" : "On site now"}
            value={activeAttendance.length}
            detail={language === "pt" ? "Presenças ativas" : "Active attendance"}
            accent={workspaceColors.green}
          />
          <MetricCard
            icon="document-text-outline"
            label={language === "pt" ? "Contratos" : "Contracts"}
            value={
              state.contracts.filter((item) => item.company_id === companyId).length
            }
            detail={language === "pt" ? "Consultáveis" : "Available to view"}
            accent={workspaceColors.yellow}
          />
        </View>

        <View style={[styles.dashboardGrid, compact ? styles.dashboardGridCompact : null]}>
          <Card style={{ flex: 1, minWidth: compact ? undefined : 380 }}>
            <SectionTitle
              title={language === "pt" ? "Monitorização da equipa" : "Team monitoring"}
              subtitle={
                language === "pt"
                  ? "Entradas ativas e estado operacional"
                  : "Active check-ins and operational status"
              }
              action={
                <Pressable onPress={() => onNavigate("attendance")}>
                  <Text style={[styles.link, { color: accent }]}>
                    {language === "pt" ? "Ver tudo" : "View all"}
                  </Text>
                </Pressable>
              }
            />
            <View style={{ gap: 10, marginTop: 14 }}>
              {activeAttendance.length ? (
                activeAttendance.slice(0, 4).map((record) => {
                  const item = state.workers.find(
                    (candidate) => candidate.id === record.worker_id,
                  );
                  const project = state.projects.find(
                    (candidate) => candidate.id === record.project_id,
                  );
                  if (!item) return null;
                  return (
                    <MonitorRow
                      key={record.id}
                      worker={item}
                      project={project}
                      checkedAt={record.check_in}
                      language={language}
                      accent={accent}
                    />
                  );
                })
              ) : (
                <View style={styles.miniEmpty}>
                  <Ionicons
                    name="radio-button-off"
                    size={20}
                    color={workspaceColors.muted}
                  />
                  <Text style={sharedStyles.subtitle}>
                    {language === "pt"
                      ? "Sem presenças ativas neste momento."
                      : "No active attendance right now."}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          <Card style={{ flex: 1, minWidth: compact ? undefined : 340 }}>
            <SectionTitle
              title={language === "pt" ? "Pulso das obras" : "Project pulse"}
              subtitle={
                language === "pt"
                  ? "Progresso das frentes principais"
                  : "Progress across key sites"
              }
              action={
                <Pressable onPress={() => onNavigate("projects")}>
                  <Text style={[styles.link, { color: accent }]}>
                    {language === "pt" ? "Gerir" : "Manage"}
                  </Text>
                </Pressable>
              }
            />
            <View style={{ gap: 16, marginTop: 16 }}>
              {companyProjects.slice(0, 3).map((project) => (
                <View key={project.id} style={{ gap: 7 }}>
                  <View style={styles.projectHeading}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{project.name}</Text>
                      <Text style={styles.itemMeta}>{project.location}</Text>
                    </View>
                    <Text style={[styles.progressValue, { color: accent }]}>
                      {project.progress}%
                    </Text>
                  </View>
                  <ProgressBar value={project.progress} accent={accent} />
                </View>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>
    );
  }

  const currentProject = state.projects.find(
    (item) =>
      item.id === worker?.current_project_id || item.worker_ids.includes(user.id),
  );
  const activeCheckIn = state.attendance.find(
    (item) => item.worker_id === user.id && item.check_out === null,
  );
  const workerAttendance = state.attendance.filter(
    (item) => item.worker_id === user.id,
  );
  const completedHours = workerAttendance.reduce((total, item) => {
    if (!item.check_out) return total;
    const duration =
      new Date(item.check_out).getTime() - new Date(item.check_in).getTime();
    return total + Math.max(0, duration / 3_600_000);
  }, 0);

  const toggleAttendance = async () => {
    if (!currentProject || attendanceBusy) return;
    setAttendanceBusy(true);
    try {
      if (activeCheckIn) {
        await checkOut();
      } else {
        const location = await resolveDemoLocation(currentProject);
        await checkIn(currentProject.id, location);
      }
    } finally {
      setAttendanceBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, compact ? styles.contentCompact : null]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.workerHero, { borderColor: `${accent}55` }]}>
        <View style={[styles.heroGlow, { backgroundColor: `${accent}1A` }]} />
        <View style={[styles.heroHeader, compact ? { alignItems: "flex-start" } : null]}>
          <View style={styles.workerIdentity}>
            <Avatar
              name={worker?.name ?? user.name}
              flag={worker?.flag}
              size={compact ? 58 : 68}
              accent={accent}
            />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={sharedStyles.label}>
                {language === "pt" ? "WORKER PULSE" : "WORKER PULSE"}
              </Text>
              <Text style={sharedStyles.title}>{worker?.name ?? user.name}</Text>
              <Text style={sharedStyles.subtitle}>
                {worker?.profession ?? user.title} · {worker?.location ?? "Portugal"}
              </Text>
              <StatusPill
                status={worker?.status ?? "available"}
                label={
                  worker?.status === "on_site"
                    ? t.onSite
                    : worker?.status === "contracted"
                      ? t.contracted
                      : t.available
                }
              />
            </View>
          </View>
          <View style={styles.heroScores}>
            <Score
              value={worker?.trust_score ?? 5}
              label={t.trust}
              accent={accent}
              compact={compact}
            />
            <Score
              value={worker?.productivity_score ?? 5}
              label={t.productivity}
              accent={workspaceColors.green}
              compact={compact}
            />
          </View>
        </View>
      </View>

      <View style={styles.metrics}>
        <MetricCard
          icon="time-outline"
          label={language === "pt" ? "Horas registadas" : "Recorded hours"}
          value={completedHours.toFixed(1)}
          detail={language === "pt" ? "Últimos registos demo" : "Recent demo records"}
          accent={accent}
        />
        <MetricCard
          icon="ribbon-outline"
          label={t.certificates}
          value={worker?.certificates.length ?? 0}
          detail={language === "pt" ? "Válidos e consultáveis" : "Valid and viewable"}
          accent={workspaceColors.yellow}
        />
        <MetricCard
          icon="briefcase-outline"
          label={t.bestProjects}
          value={worker?.best_projects.length ?? 0}
          detail={language === "pt" ? "Portefólio profissional" : "Professional portfolio"}
          accent={workspaceColors.green}
        />
        <MetricCard
          icon="document-text-outline"
          label={t.contracts}
          value={
            state.contracts.filter((item) => item.worker_id === user.id).length
          }
          detail={language === "pt" ? "Disponíveis no arquivo" : "Available in records"}
          accent={workspaceColors.blueSoft}
        />
      </View>

      <View style={[styles.dashboardGrid, compact ? styles.dashboardGridCompact : null]}>
        <Card
          accent={activeCheckIn ? workspaceColors.green : accent}
          style={{ flex: 1.15, minWidth: compact ? undefined : 410 }}
        >
          <SectionTitle
            title={language === "pt" ? "Obra atual" : "Current project"}
            subtitle={
              activeCheckIn
                ? language === "pt"
                  ? "Sessão de trabalho ativa"
                  : "Work session active"
                : language === "pt"
                  ? "Pronto para registar a entrada"
                  : "Ready to check in"
            }
          />
          {currentProject ? (
            <View style={{ gap: 14, marginTop: 16 }}>
              <View style={styles.projectHeading}>
                <View
                  style={[
                    styles.largeIcon,
                    { backgroundColor: `${accent}18`, borderColor: `${accent}55` },
                  ]}
                >
                  <Ionicons name="business" size={23} color={accent} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.largeItemTitle}>{currentProject.name}</Text>
                  <Text style={styles.itemMeta}>{currentProject.location}</Text>
                </View>
                <StatusPill status={currentProject.status} label={t.active} />
              </View>
              <View style={styles.projectFacts}>
                <Fact
                  icon="time-outline"
                  label={language === "pt" ? "Horário" : "Schedule"}
                  value={currentProject.schedule}
                />
                <Fact
                  icon="calendar-outline"
                  label={language === "pt" ? "Fim previsto" : "Expected end"}
                  value={currentProject.end_date}
                />
                <Fact
                  icon="navigate-outline"
                  label={language === "pt" ? "Localização" : "Location"}
                  value={activeCheckIn?.location_mode === "gps" ? "GPS" : "Demo GPS"}
                />
              </View>
              <Button
                testID="dashboard-attendance-toggle"
                icon={activeCheckIn ? "exit-outline" : "enter-outline"}
                label={activeCheckIn ? t.checkOut : t.checkIn}
                accent={activeCheckIn ? workspaceColors.green : accent}
                onPress={toggleAttendance}
                loading={attendanceBusy}
              />
            </View>
          ) : (
            <View style={styles.miniEmpty}>
              <Text style={sharedStyles.subtitle}>
                {language === "pt"
                  ? "Ainda não existe uma obra atribuída."
                  : "No project has been assigned yet."}
              </Text>
            </View>
          )}
        </Card>

        <Card style={{ flex: 0.85, minWidth: compact ? undefined : 320 }}>
          <SectionTitle
            title={language === "pt" ? "Próximo turno" : "Next shift"}
            subtitle={language === "pt" ? "Planeamento diário" : "Daily planning"}
            action={
              <Pressable onPress={() => onNavigate("attendance")}>
                <Text style={[styles.link, { color: accent }]}>
                  {language === "pt" ? "Horários" : "Schedule"}
                </Text>
              </Pressable>
            }
          />
          <View style={styles.shiftBox}>
            <View style={[styles.shiftDay, { borderColor: `${accent}77` }]}>
              <Text style={[styles.shiftDayNumber, { color: accent }]}>30</Text>
              <Text style={styles.shiftDayMonth}>JUL</Text>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={styles.largeItemTitle}>08:00 — 17:00</Text>
              <Text style={styles.itemMeta}>
                {currentProject?.name ??
                  (language === "pt" ? "Sem obra atribuída" : "No assigned project")}
              </Text>
              <Text style={styles.shiftNote}>
                {language === "pt"
                  ? "Check-in disponível junto à obra."
                  : "Check-in available near the site."}
              </Text>
            </View>
          </View>
          <Button
            compact
            variant="secondary"
            icon="calendar-outline"
            accent={accent}
            label={language === "pt" ? "Ver presenças" : "View attendance"}
            onPress={() => onNavigate("attendance")}
          />
        </Card>
      </View>

      <Card>
        <SectionTitle
          title={language === "pt" ? "Competências em destaque" : "Top skills"}
          subtitle={
            language === "pt"
              ? "Evolução profissional validada"
              : "Validated professional development"
          }
          action={
            <Pressable onPress={() => onNavigate("profile")}>
              <Text style={[styles.link, { color: accent }]}>{t.edit}</Text>
            </Pressable>
          }
        />
        <View style={styles.skillsGrid}>
          {(worker?.skills ?? []).slice(0, 4).map((skill) => (
            <View key={skill.name} style={styles.skillItem}>
              <View style={styles.projectHeading}>
                <Text style={styles.itemTitle}>{skill.name}</Text>
                <Text style={[styles.skillLevel, { color: accent }]}>
                  {skill.level}%
                </Text>
              </View>
              <ProgressBar value={skill.level} accent={accent} />
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function MonitorRow({
  worker,
  project,
  checkedAt,
  language,
  accent,
}: {
  worker: Worker;
  project: Project | undefined;
  checkedAt: string;
  language: "pt" | "en";
  accent: string;
}) {
  const time = new Date(checkedAt).toLocaleTimeString(
    language === "pt" ? "pt-PT" : "en-GB",
    { hour: "2-digit", minute: "2-digit" },
  );
  return (
    <View style={styles.monitorRow}>
      <Avatar name={worker.name} flag={worker.flag} size={42} accent={accent} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.itemTitle}>{worker.name}</Text>
        <Text style={styles.itemMeta}>
          {project?.name ?? "—"} · {time}
        </Text>
      </View>
      <StatusPill
        status="on_site"
        label={language === "pt" ? "Em obra" : "On site"}
      />
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={17} color={workspaceColors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 46,
    gap: 16,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },
  contentCompact: {
    padding: 14,
    paddingBottom: 100,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    backgroundColor: workspaceColors.panelSoft,
    overflow: "hidden",
    gap: 20,
  },
  workerHero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    backgroundColor: workspaceColors.panelSoft,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -230,
    right: -80,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  heroScores: {
    flexDirection: "row",
    gap: 16,
  },
  workerIdentity: {
    flex: 1,
    minWidth: 250,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  dashboardGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
  },
  dashboardGridCompact: {
    flexDirection: "column",
  },
  link: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  monitorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 10,
    borderRadius: 13,
    backgroundColor: workspaceColors.panelSoft,
    borderWidth: 1,
    borderColor: workspaceColors.line,
  },
  itemTitle: {
    color: workspaceColors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  largeItemTitle: {
    color: workspaceColors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  itemMeta: {
    color: workspaceColors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  miniEmpty: {
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  projectHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  largeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  projectFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fact: {
    flex: 1,
    minWidth: 130,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 12,
    padding: 10,
    backgroundColor: workspaceColors.panelSoft,
  },
  factLabel: {
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 13,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  factValue: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  shiftBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 18,
  },
  shiftDay: {
    width: 62,
    height: 70,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  shiftDayNumber: {
    fontSize: 24,
    lineHeight: 27,
    fontWeight: "900",
  },
  shiftDayMonth: {
    color: workspaceColors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  shiftNote: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 16,
  },
  skillsGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  skillItem: {
    flex: 1,
    minWidth: 220,
    gap: 8,
  },
  skillLevel: {
    fontSize: 12,
    fontWeight: "800",
  },
});
