import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";
import { resolveDemoLocation } from "@/src/demo/location";
import type { Attendance, Project, Worker } from "@/src/demo/types";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  MetricCard,
  SectionTitle,
  StatusPill,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

function formatDate(value: string, language: "pt" | "en") {
  return new Date(value).toLocaleDateString(language === "pt" ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string, language: "pt" | "en") {
  return new Date(value).toLocaleTimeString(language === "pt" ? "pt-PT" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duration(record: Attendance) {
  if (!record.check_out) return "—";
  const milliseconds =
    new Date(record.check_out).getTime() - new Date(record.check_in).getTime();
  const minutes = Math.max(0, Math.round(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export function AttendanceView() {
  const { user } = useAuth();
  const { state, language, checkIn, checkOut } = useWorklyData();
  const { width } = useWindowDimensions();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const compact = width < 800;
  const t = copy[language];

  const relevantProjects = useMemo(() => {
    if (!state || !user) return [];
    if (user.role === "company") {
      const companyId = user.company_id ?? user.id;
      return state.projects.filter((project) => project.company_id === companyId);
    }
    return state.projects.filter((project) => project.worker_ids.includes(user.id));
  }, [state, user]);

  const records = useMemo(() => {
    if (!state || !user) return [];
    const own =
      user.role === "worker"
        ? state.attendance.filter((item) => item.worker_id === user.id)
        : state.attendance.filter(
            (item) => item.company_id === (user.company_id ?? user.id),
          );
    return [...own]
      .filter((item) => !showActiveOnly || item.check_out === null)
      .sort(
        (a, b) =>
          new Date(b.check_in).getTime() - new Date(a.check_in).getTime(),
      );
  }, [showActiveOnly, state, user]);

  if (!state || !user) return null;

  if (role === "company") {
    const active = records.filter((item) => item.check_out === null);
    const completed = records.filter((item) => item.check_out !== null);
    const totalHours = completed.reduce((sum, item) => {
      const value =
        new Date(item.check_out as string).getTime() -
        new Date(item.check_in).getTime();
      return sum + Math.max(0, value / 3_600_000);
    }, 0);

    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          compact ? styles.contentCompact : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, compact ? styles.headerCompact : null]}>
          <View style={{ flex: 1 }}>
            <Text style={sharedStyles.title}>{t.attendance}</Text>
            <Text style={sharedStyles.subtitle}>
              {language === "pt"
                ? "Monitorização de entradas, saídas e localização."
                : "Check-in, check-out and location monitoring."}
            </Text>
          </View>
          <Button
            compact
            label={
              showActiveOnly
                ? language === "pt"
                  ? "Mostrar todos"
                  : "Show all"
                : language === "pt"
                  ? "Só ativos"
                  : "Active only"
            }
            icon={showActiveOnly ? "list-outline" : "radio-outline"}
            variant="secondary"
            accent={accent}
            onPress={() => setShowActiveOnly((current) => !current)}
          />
        </View>

        <View style={styles.metrics}>
          <MetricCard
            icon="radio-outline"
            label={language === "pt" ? "Em obra agora" : "On site now"}
            value={active.length}
            detail={language === "pt" ? "Sessões ativas" : "Active sessions"}
            accent={workspaceColors.green}
          />
          <MetricCard
            icon="time-outline"
            label={language === "pt" ? "Horas registadas" : "Recorded hours"}
            value={totalHours.toFixed(1)}
            detail={language === "pt" ? "Registos concluídos" : "Completed records"}
            accent={accent}
          />
          <MetricCard
            icon="calendar-outline"
            label={language === "pt" ? "Registos" : "Records"}
            value={records.length}
            detail={language === "pt" ? "Histórico visível" : "Visible history"}
            accent={workspaceColors.blueSoft}
          />
          <MetricCard
            icon="navigate-outline"
            label="GPS / Demo"
            value={`${records.filter((item) => item.location_mode === "gps").length}/${records.filter((item) => item.location_mode === "demo").length}`}
            detail={language === "pt" ? "Origem da localização" : "Location source"}
            accent={workspaceColors.yellow}
          />
        </View>

        <Card>
          <SectionTitle
            title={t.liveMonitoring}
            subtitle={
              language === "pt"
                ? "Atualizado a partir dos registos de check-in."
                : "Updated from check-in records."
            }
          />
          <View style={{ gap: 9, marginTop: 15 }}>
            {records.length ? (
              records.map((record) => (
                <CompanyAttendanceRow
                  key={record.id}
                  record={record}
                  worker={state.workers.find(
                    (candidate) => candidate.id === record.worker_id,
                  )}
                  project={state.projects.find(
                    (candidate) => candidate.id === record.project_id,
                  )}
                  language={language}
                  accent={accent}
                />
              ))
            ) : (
              <EmptyState
                icon="time-outline"
                title={
                  language === "pt"
                    ? "Sem registos para o filtro"
                    : "No records for this filter"
                }
              />
            )}
          </View>
        </Card>
      </ScrollView>
    );
  }

  const worker = state.workers.find((item) => item.id === user.id);
  const active = state.attendance.find(
    (item) => item.worker_id === user.id && item.check_out === null,
  );
  const currentProject =
    relevantProjects.find((project) => project.id === selectedProjectId) ??
    relevantProjects.find((project) => project.id === worker?.current_project_id) ??
    relevantProjects[0];

  const toggle = async () => {
    if (busy || (!active && !currentProject)) return;
    setBusy(true);
    try {
      if (active) {
        await checkOut();
      } else if (currentProject) {
        const location = await resolveDemoLocation(currentProject);
        await checkIn(currentProject.id, location);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        compact ? styles.contentCompact : null,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>{t.attendance}</Text>
          <Text style={sharedStyles.subtitle}>
            {language === "pt"
              ? "Horário, localização e histórico de presenças."
              : "Schedule, location and attendance history."}
          </Text>
        </View>
      </View>

      <View style={[styles.workerGrid, compact ? styles.workerGridCompact : null]}>
        <Card
          accent={active ? workspaceColors.green : accent}
          style={{ flex: 1.1, minWidth: compact ? undefined : 410 }}
        >
          <View style={styles.attendanceHero}>
            <View
              style={[
                styles.attendanceIcon,
                {
                  borderColor: active ? workspaceColors.green : accent,
                  backgroundColor: active
                    ? `${workspaceColors.green}16`
                    : `${accent}16`,
                },
              ]}
            >
              <Ionicons
                name={active ? "radio" : "navigate-outline"}
                size={34}
                color={active ? workspaceColors.green : accent}
              />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={styles.attendanceTitle}>
                {active
                  ? language === "pt"
                    ? "Sessão ativa"
                    : "Active session"
                  : language === "pt"
                    ? "Pronto para entrar"
                    : "Ready to check in"}
              </Text>
              <Text style={sharedStyles.subtitle}>
                {currentProject?.name ??
                  (language === "pt" ? "Sem obra atribuída" : "No assigned project")}
              </Text>
              {active ? (
                <Text style={[styles.activeSince, { color: workspaceColors.green }]}>
                  {language === "pt" ? "Desde" : "Since"}{" "}
                  {formatTime(active.check_in, language)}
                </Text>
              ) : null}
            </View>
          </View>

          {!active && relevantProjects.length > 1 ? (
            <View style={styles.projectChoices}>
              {relevantProjects.map((project) => (
                <Button
                  key={project.id}
                  compact
                  label={project.name}
                  variant={
                    currentProject?.id === project.id ? "primary" : "secondary"
                  }
                  accent={accent}
                  onPress={() => setSelectedProjectId(project.id)}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.locationBox}>
            <Ionicons
              name="location-outline"
              size={20}
              color={workspaceColors.textSoft}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>
                {currentProject?.location ?? "—"}
              </Text>
              <Text style={styles.meta}>
                {active?.location_mode === "gps"
                  ? language === "pt"
                    ? "Localização GPS autorizada"
                    : "GPS location granted"
                  : t.gpsDemo}
              </Text>
            </View>
          </View>

          <Button
            testID="attendance-toggle"
            label={active ? t.checkOut : t.checkIn}
            icon={active ? "exit-outline" : "enter-outline"}
            accent={active ? workspaceColors.green : accent}
            disabled={!active && !currentProject}
            loading={busy}
            onPress={toggle}
          />
        </Card>

        <Card style={{ flex: 0.9, minWidth: compact ? undefined : 320 }}>
          <SectionTitle
            title={t.schedule}
            subtitle={language === "pt" ? "Próximo turno" : "Next shift"}
          />
          <View style={styles.scheduleCard}>
            <View style={[styles.dayBox, { borderColor: `${accent}77` }]}>
              <Text style={[styles.dayNumber, { color: accent }]}>30</Text>
              <Text style={styles.dayMonth}>JUL</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.scheduleTime}>
                {currentProject?.schedule ?? worker?.schedule ?? "08:00–17:00"}
              </Text>
              <Text style={styles.meta}>
                {currentProject?.name ?? "WORKLY"}
              </Text>
              <Text style={styles.meta}>{currentProject?.location ?? "Portugal"}</Text>
            </View>
          </View>
          <View style={styles.reminder}>
            <Ionicons
              name="notifications-outline"
              size={18}
              color={workspaceColors.yellow}
            />
            <Text style={styles.reminderText}>
              {language === "pt"
                ? "Chega 10 minutos antes para validar a zona GPS."
                : "Arrive 10 minutes early to validate the GPS zone."}
            </Text>
          </View>
        </Card>
      </View>

      <Card>
        <SectionTitle
          title={language === "pt" ? "Histórico de presenças" : "Attendance history"}
          subtitle={`${records.length} ${language === "pt" ? "registos" : "records"}`}
        />
        <View style={{ gap: 9, marginTop: 15 }}>
          {records.length ? (
            records.map((record) => (
              <WorkerAttendanceRow
                key={record.id}
                record={record}
                project={state.projects.find(
                  (candidate) => candidate.id === record.project_id,
                )}
                language={language}
                accent={accent}
              />
            ))
          ) : (
            <EmptyState
              icon="calendar-clear-outline"
              title={
                language === "pt"
                  ? "Ainda não há registos"
                  : "No records yet"
              }
            />
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

function CompanyAttendanceRow({
  record,
  worker,
  project,
  language,
  accent,
}: {
  record: Attendance;
  worker?: Worker;
  project?: Project;
  language: "pt" | "en";
  accent: string;
}) {
  const active = record.check_out === null;
  return (
    <View style={styles.companyRow}>
      <Avatar
        name={worker?.name ?? "Worker"}
        flag={worker?.flag}
        size={42}
        accent={accent}
      />
      <View style={{ flex: 1, minWidth: 160 }}>
        <Text style={styles.rowTitle}>{worker?.name ?? record.worker_id}</Text>
        <Text style={styles.meta}>
          {project?.name ?? record.project_id} · {formatDate(record.check_in, language)}
        </Text>
      </View>
      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>{language === "pt" ? "Entrada" : "In"}</Text>
        <Text style={styles.timeValue}>{formatTime(record.check_in, language)}</Text>
      </View>
      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>{language === "pt" ? "Saída" : "Out"}</Text>
        <Text style={styles.timeValue}>
          {record.check_out ? formatTime(record.check_out, language) : "—"}
        </Text>
      </View>
      <View style={styles.modeBadge}>
        <Ionicons
          name={record.location_mode === "gps" ? "navigate" : "flask-outline"}
          size={13}
          color={
            record.location_mode === "gps"
              ? workspaceColors.green
              : workspaceColors.yellow
          }
        />
        <Text style={styles.modeText}>{record.location_mode.toUpperCase()}</Text>
      </View>
      <StatusPill
        status={active ? "on_site" : "completed"}
        label={
          active
            ? language === "pt"
              ? "Em obra"
              : "On site"
            : language === "pt"
              ? "Concluído"
              : "Complete"
        }
      />
    </View>
  );
}

function WorkerAttendanceRow({
  record,
  project,
  language,
  accent,
}: {
  record: Attendance;
  project?: Project;
  language: "pt" | "en";
  accent: string;
}) {
  return (
    <View style={styles.workerRow}>
      <View
        style={[styles.rowIcon, { backgroundColor: `${accent}16` }]}
      >
        <Ionicons name="calendar-outline" size={18} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 150 }}>
        <Text style={styles.rowTitle}>{project?.name ?? record.project_id}</Text>
        <Text style={styles.meta}>{formatDate(record.check_in, language)}</Text>
      </View>
      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>{language === "pt" ? "Entrada" : "In"}</Text>
        <Text style={styles.timeValue}>{formatTime(record.check_in, language)}</Text>
      </View>
      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>{language === "pt" ? "Saída" : "Out"}</Text>
        <Text style={styles.timeValue}>
          {record.check_out ? formatTime(record.check_out, language) : "—"}
        </Text>
      </View>
      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>{language === "pt" ? "Duração" : "Duration"}</Text>
        <Text style={styles.timeValue}>{duration(record)}</Text>
      </View>
      <StatusPill
        status={record.check_out ? "completed" : "on_site"}
        label={
          record.check_out
            ? language === "pt"
              ? "Concluído"
              : "Complete"
            : language === "pt"
              ? "Ativo"
              : "Active"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: workspaceColors.background,
  },
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerCompact: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  companyRow: {
    minHeight: 64,
    padding: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 11,
  },
  rowTitle: {
    color: workspaceColors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  meta: {
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  timeBlock: {
    minWidth: 64,
    alignItems: "flex-start",
  },
  timeLabel: {
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  timeValue: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  modeBadge: {
    minHeight: 28,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  modeText: {
    color: workspaceColors.textSoft,
    fontSize: 8,
    fontWeight: "700",
  },
  workerGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
  },
  workerGridCompact: {
    flexDirection: "column",
  },
  attendanceHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 17,
  },
  attendanceIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  attendanceTitle: {
    color: workspaceColors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
  },
  activeSince: {
    fontSize: 11,
    fontWeight: "700",
  },
  projectChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 13,
  },
  locationBox: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 13,
    backgroundColor: workspaceColors.panelSoft,
    padding: 11,
    marginBottom: 14,
  },
  locationTitle: {
    color: workspaceColors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginVertical: 18,
  },
  dayBox: {
    width: 64,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
  },
  dayMonth: {
    color: workspaceColors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  scheduleTime: {
    color: workspaceColors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  reminder: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: `${workspaceColors.yellow}44`,
    borderRadius: 12,
    backgroundColor: `${workspaceColors.yellow}0E`,
    padding: 11,
  },
  reminderText: {
    flex: 1,
    color: workspaceColors.textSoft,
    fontSize: 10,
    lineHeight: 15,
  },
  workerRow: {
    minHeight: 61,
    padding: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 11,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});

