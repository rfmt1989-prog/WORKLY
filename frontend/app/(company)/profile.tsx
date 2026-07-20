import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

type CompanySection =
  | "home"
  | "projects"
  | "workers"
  | "schedule"
  | "documents"
  | "teams"
  | "messages"
  | "company";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type CompanyDashboardData = {
  company_id: number;
  company_name: string;
  plan: string;
  pulse: number;
  stats: {
    active_workers: number;
    active_projects: number;
    monthly_cost: number;
    unread_messages: number;
  };
  next_task: {
    project_name: string;
    client: string;
    start_time: string;
    workers_required: number;
  };
};

type Project = {
  id: number;
  name: string;
  client: string;
  location: string;
  progress: number;
  workers: number;
  status: string;
};

type Worker = {
  id: number;
  name: string;
  role: string;
  project: string;
  pulse: number;
  status: "Disponível" | "Em obra";
};

type Team = {
  id: number;
  name: string;
  lead: string;
  project: string;
  members: number;
  coverage: string;
};

type Message = {
  id: number;
  sender: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
};

type Shift = {
  id: number;
  start: string;
  end: string;
  title: string;
  project: string;
  team: string;
  checkedIn: number;
  expected: number;
  status: "Em curso" | "Confirmado" | "A iniciar";
};

type CompanyDocument = {
  id: number;
  title: string;
  category: string;
  owner: string;
  updated: string;
  status: "Válido" | "A expirar" | "Pendente";
  completion: number;
};

const COMPANY_CUTOUT = require("../../assets/images/company-profile/company-cutout.png");
const COMPANY_ACCENT = "#59B8FF";
const COMPANY_BACKGROUND = "#02060B";

const SECTION_META: Record<CompanySection, { code: string }> = {
  home: { code: "COMMAND // LIVE" },
  projects: { code: "PROJECTS // 04 ACTIVE" },
  workers: { code: "WORKFORCE // 18 LIVE" },
  schedule: { code: "SCHEDULE // TODAY" },
  documents: { code: "DOCS // COMPLIANCE" },
  teams: { code: "TEAMS // 03 NETWORKS" },
  messages: { code: "COMMS // SECURE" },
  company: { code: "COMPANY // VERIFIED" },
};

const MENU_ITEMS: {
  id: CompanySection;
  label: string;
  icon: IoniconName;
  accessibilityLabel: string;
}[] = [
  { id: "home", label: "CENTRO", icon: "grid-outline", accessibilityLabel: "Centro de operações" },
  { id: "projects", label: "OBRAS", icon: "business-outline", accessibilityLabel: "Obras da empresa" },
  { id: "workers", label: "WORKERS", icon: "people-outline", accessibilityLabel: "Trabalhadores" },
  { id: "schedule", label: "TURNOS", icon: "calendar-outline", accessibilityLabel: "Horários e turnos" },
  { id: "documents", label: "DOCS", icon: "documents-outline", accessibilityLabel: "Documentação da empresa" },
  { id: "teams", label: "EQUIPAS", icon: "git-network-outline", accessibilityLabel: "Equipas" },
  { id: "messages", label: "CHAT", icon: "chatbubble-outline", accessibilityLabel: "Mensagens" },
  { id: "company", label: "EMPRESA", icon: "shield-checkmark-outline", accessibilityLabel: "Perfil da empresa" },
];

const DEMO_DASHBOARD: CompanyDashboardData = {
  company_id: 10,
  company_name: "Workly Demo Company",
  plan: "Enterprise",
  pulse: 96,
  stats: {
    active_workers: 18,
    active_projects: 4,
    monthly_cost: 42350,
    unread_messages: 7,
  },
  next_task: {
    project_name: "Hospital Lisboa",
    client: "Hospital Central",
    start_time: "08:00",
    workers_required: 6,
  },
};

const PROJECTS: Project[] = [
  { id: 101, name: "Hospital Lisboa", client: "Hospital Central", location: "Lisboa", progress: 72, workers: 6, status: "Em execução" },
  { id: 102, name: "Centro Logístico Sines", client: "Galp Petrogal", location: "Sines", progress: 48, workers: 8, status: "Em execução" },
  { id: 103, name: "Retrofit Industrial Porto", client: "Norte Energia", location: "Porto", progress: 18, workers: 4, status: "Planeamento" },
  { id: 104, name: "Rennes Métropole", client: "Métropole Rennes", location: "Rennes", progress: 84, workers: 5, status: "Fase final" },
];

const WORKERS: Worker[] = [
  { id: 1, name: "Rodolfo Maia", role: "Eletromecânico", project: "Hospital Lisboa", pulse: 92, status: "Disponível" },
  { id: 2, name: "Carlos Ferreira", role: "Chefe de equipa", project: "Hospital Lisboa", pulse: 95, status: "Em obra" },
  { id: 3, name: "Sofia Martins", role: "Técnica AVAC", project: "Centro Logístico Sines", pulse: 89, status: "Disponível" },
  { id: 4, name: "Miguel Costa", role: "Montador industrial", project: "Retrofit Industrial Porto", pulse: 86, status: "Em obra" },
];

const TEAMS: Team[] = [
  { id: 201, name: "Equipa Lisboa", lead: "Carlos Ferreira", project: "Hospital Lisboa", members: 6, coverage: "Lisboa" },
  { id: 202, name: "Equipa Norte", lead: "Sofia Martins", project: "Centro Logístico Sines", members: 8, coverage: "Sines · Porto" },
  { id: 203, name: "Internacional", lead: "Rodolfo Maia", project: "Rennes Métropole", members: 5, coverage: "França" },
];

const MESSAGES: Message[] = [
  { id: 1, sender: "Rodolfo Maia", role: "Eletromecânico", preview: "Confirmação de entrada concluída.", time: "09:42", unread: 2, online: true },
  { id: 2, sender: "Carlos Ferreira", role: "Chefe de equipa", preview: "A equipa de Lisboa está completa.", time: "09:18", unread: 3, online: true },
  { id: 3, sender: "Sofia Martins", role: "Técnica AVAC", preview: "Enviei o relatório da intervenção.", time: "Ontem", unread: 1, online: false },
  { id: 4, sender: "Suporte WORKLY", role: "Suporte", preview: "A sincronização foi concluída.", time: "Seg", unread: 1, online: true },
];

const SHIFTS: Shift[] = [
  { id: 301, start: "07:30", end: "08:00", title: "Briefing de segurança", project: "Hospital Lisboa", team: "Equipa Lisboa", checkedIn: 6, expected: 6, status: "Confirmado" },
  { id: 302, start: "08:00", end: "17:00", title: "Instalação eletromecânica", project: "Hospital Lisboa", team: "Equipa Lisboa", checkedIn: 5, expected: 6, status: "Em curso" },
  { id: 303, start: "08:30", end: "17:30", title: "Montagem de infraestrutura", project: "Centro Logístico Sines", team: "Equipa Norte", checkedIn: 8, expected: 8, status: "Em curso" },
  { id: 304, start: "18:00", end: "22:00", title: "Janela de manutenção", project: "Rennes Métropole", team: "Internacional", checkedIn: 0, expected: 5, status: "A iniciar" },
];

const COMPANY_DOCUMENTS: CompanyDocument[] = [
  { id: 401, title: "Seguro de responsabilidade civil", category: "Seguro", owner: "Administração", updated: "18 Jul 2026", status: "Válido", completion: 100 },
  { id: 402, title: "Dossier Hospital Lisboa", category: "Obra", owner: "Carlos Ferreira", updated: "Hoje, 09:12", status: "Válido", completion: 92 },
  { id: 403, title: "Certificados de segurança", category: "Compliance", owner: "Recursos Humanos", updated: "Ontem, 16:40", status: "A expirar", completion: 76 },
  { id: 404, title: "Relatórios de horas — julho", category: "Operação", owner: "Equipas", updated: "Hoje, 10:05", status: "Pendente", completion: 64 },
];

const monoFont = Platform.select({ web: "monospace", default: undefined });

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  accent,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={[styles.titleRule, { backgroundColor: accent, shadowColor: accent }]} />
    </View>
  );
}

function MetricCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: IoniconName;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={17} color={accent} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function HomeSection({
  dashboard,
  syncing,
  accent,
  onSelectSection,
}: {
  dashboard: CompanyDashboardData;
  syncing: boolean;
  accent: string;
  onSelectSection: (section: CompanySection) => void;
}) {
  const stats = [
    { icon: "people-outline" as IoniconName, value: String(dashboard.stats.active_workers), label: "TRABALHADORES" },
    { icon: "business-outline" as IoniconName, value: String(dashboard.stats.active_projects), label: "OBRAS ATIVAS" },
    { icon: "wallet-outline" as IoniconName, value: `${Math.round(dashboard.stats.monthly_cost / 1000)}K€`, label: "CUSTO MENSAL" },
    { icon: "chatbubble-outline" as IoniconName, value: String(dashboard.stats.unread_messages), label: "POR LER" },
  ];

  const actions: { section: CompanySection; label: string; icon: IoniconName }[] = [
    { section: "projects", label: "Gerir obras", icon: "construct-outline" },
    { section: "workers", label: "Monitorizar workers", icon: "people-outline" },
    { section: "schedule", label: "Controlar turnos", icon: "calendar-outline" },
    { section: "documents", label: "Validar documentos", icon: "documents-outline" },
    { section: "teams", label: "Organizar equipas", icon: "git-network-outline" },
    { section: "messages", label: "Abrir mensagens", icon: "chatbubbles-outline" },
  ];

  return (
    <>
      <SectionHeader
        eyebrow="CENTRO DE OPERAÇÕES"
        title="Command Center"
        subtitle="Obras, pessoas, horários e conformidade numa única leitura operacional."
        accent={accent}
      />

      <View style={styles.identityCard}>
        <View style={styles.identityCopy}>
          <View style={styles.verifiedRow}>
            <Text style={styles.companyName}>{dashboard.company_name}</Text>
            <Ionicons name="checkmark-circle" size={17} color="#62E5AD" />
          </View>
          <Text style={styles.planText}>PLANO {dashboard.plan.toUpperCase()}</Text>
        </View>
        <View style={styles.pulseBadge}>
          <Text style={styles.pulseValue}>{dashboard.pulse}%</Text>
          <Text style={styles.pulseLabel}>PULSE</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {stats.map((stat) => <MetricCard key={stat.label} {...stat} accent={accent} />)}
      </View>

      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="flash-outline" size={18} color={accent} />
          <Text style={styles.cardLabel}>PRÓXIMA OPERAÇÃO</Text>
        </View>
        <Text style={styles.operationTitle}>{dashboard.next_task.project_name}</Text>
        <Text style={styles.operationClient}>{dashboard.next_task.client}</Text>
        <View style={styles.operationMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={accent} />
            <Text style={styles.metaText}>{dashboard.next_task.start_time}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={accent} />
            <Text style={styles.metaText}>{dashboard.next_task.workers_required} pessoas</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir gestão de obras"
          onPress={() => onSelectSection("projects")}
          style={({ pressed }) => [styles.primaryAction, { backgroundColor: accent }, pressed && styles.pressed]}
        >
          <Text style={styles.primaryActionText}>ABRIR OPERAÇÃO</Text>
          <Ionicons name="arrow-forward" size={15} color="#05070A" />
        </Pressable>
      </View>

      <View style={styles.actionGrid}>
        {actions.map((action) => (
          <Pressable
            key={action.section}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => onSelectSection(action.section)}
            style={({ pressed }) => [styles.actionTile, pressed && styles.pressed]}
          >
            <Ionicons name={action.icon} size={18} color={accent} />
            <Text style={styles.actionTileText}>{action.label}</Text>
            <Ionicons name="chevron-forward" size={13} color="#708096" />
          </Pressable>
        ))}
      </View>

      <View style={styles.syncRow}>
        <Ionicons name={syncing ? "sync-outline" : "cloud-done-outline"} size={14} color={syncing ? "#FFB353" : "#62E5AD"} />
        <Text style={styles.syncText}>{syncing ? "A sincronizar operação..." : "Operação sincronizada"}</Text>
      </View>
    </>
  );
}

function ProjectsSection({
  accent,
  selectedId,
  onSelect,
}: {
  accent: string;
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="PORTFÓLIO ATIVO"
        title="Obras"
        subtitle="Selecione uma obra para consultar equipa, progresso e estado."
        accent={accent}
      />
      <View style={styles.summaryStrip}>
        <Text style={styles.summaryValue}>4</Text>
        <Text style={styles.summaryLabel}>OBRAS EM CURSO</Text>
        <View style={styles.summaryDivider} />
        <Text style={styles.summaryValue}>23</Text>
        <Text style={styles.summaryLabel}>PESSOAS ALOCADAS</Text>
      </View>
      <View style={styles.listStack}>
        {PROJECTS.map((project) => {
          const active = selectedId === project.id;
          return (
            <View key={project.id} style={[styles.selectableCard, active && { borderColor: accent, backgroundColor: "rgba(255,255,255,0.075)" }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Selecionar obra ${project.name}`}
                accessibilityState={{ selected: active }}
                onPress={() => onSelect(project.id)}
                style={({ pressed }) => [styles.selectableHeading, pressed && styles.pressed]}
              >
                <View style={[styles.indexBadge, { borderColor: accent }]}>
                  <Text style={[styles.indexText, { color: accent }]}>{String(project.id - 100).padStart(2, "0")}</Text>
                </View>
                <View style={styles.selectableCopy}>
                  <Text style={styles.selectableTitle}>{project.name}</Text>
                  <Text style={styles.selectableSubtitle}>{project.client} · {project.location}</Text>
                </View>
                <Text style={[styles.statusText, { color: accent }]}>{project.status}</Text>
              </Pressable>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${project.progress}%` as DimensionValue, backgroundColor: accent }]} />
              </View>
              {active ? (
                <View style={styles.expandedDetails}>
                  <View style={styles.metaItem}>
                    <Ionicons name="analytics-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>{project.progress}% concluído</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>{project.workers} profissionais</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>{project.location}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </>
  );
}

function WorkersSection({
  accent,
  selectedId,
  onSelect,
  onOpenChat,
}: {
  accent: string;
  selectedId: number;
  onSelect: (id: number) => void;
  onOpenChat: (id: number) => void;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="REDE PROFISSIONAL"
        title="Pessoas"
        subtitle="Disponibilidade, obra atual e desempenho da equipa."
        accent={accent}
      />
      <View style={styles.listStack}>
        {WORKERS.map((worker) => {
          const active = selectedId === worker.id;
          return (
            <View key={worker.id} style={[styles.selectableCard, active && { borderColor: accent, backgroundColor: "rgba(255,255,255,0.075)" }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ${worker.name}`}
                accessibilityState={{ selected: active }}
                onPress={() => onSelect(worker.id)}
                style={({ pressed }) => [styles.selectableHeading, pressed && styles.pressed]}
              >
                <View style={[styles.avatar, { borderColor: accent }]}>
                  <Text style={styles.avatarText}>{worker.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</Text>
                  <View style={[styles.onlineDot, worker.status === "Em obra" && styles.busyDot]} />
                </View>
                <View style={styles.selectableCopy}>
                  <Text style={styles.selectableTitle}>{worker.name}</Text>
                  <Text style={styles.selectableSubtitle}>{worker.role}</Text>
                </View>
                <View style={styles.pulseMini}>
                  <Text style={[styles.pulseMiniValue, { color: accent }]}>{worker.pulse}</Text>
                  <Text style={styles.pulseMiniLabel}>PULSE</Text>
                </View>
              </Pressable>
              {active ? (
                <View style={styles.expandedDetails}>
                  <View style={styles.metaItem}>
                    <Ionicons name="business-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>{worker.project}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="radio-button-on" size={13} color={worker.status === "Disponível" ? "#62E5AD" : "#FFB353"} />
                    <Text style={styles.metaText}>{worker.status}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Conversar com ${worker.name}`}
                    onPress={() => onOpenChat(worker.id)}
                    style={({ pressed }) => [styles.secondaryAction, { borderColor: accent }, pressed && styles.pressed]}
                  >
                    <Ionicons name="chatbubble-outline" size={14} color={accent} />
                    <Text style={[styles.secondaryActionText, { color: accent }]}>ABRIR CHAT</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </>
  );
}

function ScheduleSection({
  accent,
  selectedId,
  onSelect,
}: {
  accent: string;
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="PLANEAMENTO EM TEMPO REAL"
        title="Turnos e horários"
        subtitle="Presenças, equipas e janelas operacionais numa linha temporal única."
        accent={accent}
      />
      <View style={styles.summaryStrip}>
        <Text style={styles.summaryValue}>19</Text>
        <Text style={styles.summaryLabel}>CHECK-INS CONFIRMADOS</Text>
        <View style={styles.summaryDivider} />
        <Text style={styles.summaryValue}>1</Text>
        <Text style={styles.summaryLabel}>PRESENÇA EM FALTA</Text>
      </View>
      <View style={styles.listStack}>
        {SHIFTS.map((shift) => {
          const active = selectedId === shift.id;
          const attendance = Math.round((shift.checkedIn / shift.expected) * 100);

          return (
            <View
              key={shift.id}
              style={[
                styles.selectableCard,
                active && {
                  borderColor: accent,
                  backgroundColor: "rgba(89,184,255,0.055)",
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Selecionar turno ${shift.title}`}
                accessibilityState={{ selected: active }}
                onPress={() => onSelect(shift.id)}
                style={({ pressed }) => [styles.selectableHeading, pressed && styles.pressed]}
              >
                <View style={styles.timeBlock}>
                  <Text style={[styles.timeStart, { color: accent }]}>{shift.start}</Text>
                  <Text style={styles.timeEnd}>{shift.end}</Text>
                </View>
                <View style={styles.selectableCopy}>
                  <Text style={styles.selectableTitle}>{shift.title}</Text>
                  <Text style={styles.selectableSubtitle}>{shift.project} · {shift.team}</Text>
                </View>
                <Text style={[styles.statusText, { color: accent }]}>{shift.status}</Text>
              </Pressable>
              {active ? (
                <View style={styles.expandedColumn}>
                  <View style={styles.attendanceRow}>
                    <Text style={styles.attendanceLabel}>PRESENÇAS</Text>
                    <Text style={[styles.attendanceValue, { color: accent }]}>
                      {shift.checkedIn}/{shift.expected} · {attendance}%
                    </Text>
                  </View>
                  <View style={styles.progressTrackWide}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${attendance}%` as DimensionValue,
                          backgroundColor: accent,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.expandedDetailsFlat}>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={14} color={accent} />
                      <Text style={styles.metaText}>{shift.team}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="business-outline" size={14} color={accent} />
                      <Text style={styles.metaText}>{shift.project}</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </>
  );
}

function DocumentsSection({
  accent,
  selectedId,
  onSelect,
}: {
  accent: string;
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="CONTROLO DOCUMENTAL"
        title="Documentação"
        subtitle="Validade, responsáveis e progresso documental de toda a operação."
        accent={accent}
      />
      <View style={styles.documentControlCard}>
        <View>
          <Text style={styles.cardLabel}>COMPLIANCE GLOBAL</Text>
          <Text style={styles.documentControlCopy}>Operação pronta para auditoria</Text>
        </View>
        <Text style={[styles.documentControlValue, { color: accent }]}>92%</Text>
      </View>
      <View style={styles.listStack}>
        {COMPANY_DOCUMENTS.map((document) => {
          const active = selectedId === document.id;

          return (
            <View
              key={document.id}
              style={[
                styles.selectableCard,
                active && {
                  borderColor: accent,
                  backgroundColor: "rgba(89,184,255,0.055)",
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Selecionar documento ${document.title}`}
                accessibilityState={{ selected: active }}
                onPress={() => onSelect(document.id)}
                style={({ pressed }) => [styles.selectableHeading, pressed && styles.pressed]}
              >
                <View style={[styles.documentModuleIcon, { borderColor: accent }]}>
                  <Ionicons name="document-text-outline" size={19} color={accent} />
                </View>
                <View style={styles.selectableCopy}>
                  <Text style={styles.selectableTitle}>{document.title}</Text>
                  <Text style={styles.selectableSubtitle}>{document.category} · {document.owner}</Text>
                </View>
                <Text style={[styles.statusText, { color: accent }]}>{document.status}</Text>
              </Pressable>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${document.completion}%` as DimensionValue,
                      backgroundColor: accent,
                    },
                  ]}
                />
              </View>
              {active ? (
                <View style={styles.expandedDetails}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>{document.owner}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="sync-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>{document.updated}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="analytics-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>{document.completion}% completo</Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </>
  );
}

function TeamsSection({
  accent,
  selectedId,
  onSelect,
  onOpenChat,
}: {
  accent: string;
  selectedId: number;
  onSelect: (id: number) => void;
  onOpenChat: (id: number) => void;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="ORGANIZAÇÃO"
        title="Equipas"
        subtitle="Canais operacionais organizados por obra e cobertura."
        accent={accent}
      />
      <View style={styles.listStack}>
        {TEAMS.map((team) => {
          const active = selectedId === team.id;
          return (
            <View key={team.id} style={[styles.selectableCard, active && { borderColor: accent, backgroundColor: "rgba(255,255,255,0.075)" }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ${team.name}`}
                accessibilityState={{ selected: active }}
                onPress={() => onSelect(team.id)}
                style={({ pressed }) => [styles.selectableHeading, pressed && styles.pressed]}
              >
                <View style={[styles.teamIcon, { backgroundColor: `${accent}1A` }]}>
                  <Ionicons name="git-network-outline" size={21} color={accent} />
                </View>
                <View style={styles.selectableCopy}>
                  <Text style={styles.selectableTitle}>{team.name}</Text>
                  <Text style={styles.selectableSubtitle}>{team.project}</Text>
                </View>
                <Text style={[styles.teamCount, { color: accent }]}>{team.members}</Text>
              </Pressable>
              {active ? (
                <View style={styles.expandedDetails}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>Responsável: {team.lead}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="map-outline" size={14} color={accent} />
                    <Text style={styles.metaText}>{team.coverage}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir canal da ${team.name}`}
                    onPress={() => onOpenChat(team.id)}
                    style={({ pressed }) => [styles.secondaryAction, { borderColor: accent }, pressed && styles.pressed]}
                  >
                    <Ionicons name="chatbubbles-outline" size={14} color={accent} />
                    <Text style={[styles.secondaryActionText, { color: accent }]}>ABRIR CANAL</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </>
  );
}

function MessagesSection({
  accent,
  onOpenChat,
}: {
  accent: string;
  onOpenChat: (id: number) => void;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="COMUNICAÇÃO"
        title="Mensagens"
        subtitle="Converse diretamente com trabalhadores, equipas e suporte."
        accent={accent}
      />
      <View style={styles.messageSummary}>
        <Text style={styles.messageSummaryValue}>7</Text>
        <Text style={styles.messageSummaryLabel}>MENSAGENS POR LER</Text>
        <Ionicons name="chatbubbles-outline" size={24} color={accent} />
      </View>
      <View style={styles.listStack}>
        {MESSAGES.map((message) => (
          <Pressable
            key={message.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir conversa com ${message.sender}`}
            onPress={() => onOpenChat(message.id)}
            style={({ pressed }) => [styles.messageCard, pressed && styles.pressed]}
          >
            <View style={[styles.avatar, { borderColor: accent }]}>
              <Text style={styles.avatarText}>{message.sender.split(" ").map((part) => part[0]).slice(0, 2).join("")}</Text>
              <View style={[styles.onlineDot, !message.online && styles.offlineDot]} />
            </View>
            <View style={styles.messageCopy}>
              <View style={styles.messageHeading}>
                <Text style={styles.messageSender}>{message.sender}</Text>
                <Text style={styles.messageTime}>{message.time}</Text>
              </View>
              <Text style={[styles.messageRole, { color: accent }]}>{message.role}</Text>
              <Text numberOfLines={2} style={styles.messagePreview}>{message.preview}</Text>
            </View>
            {message.unread > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: accent }]}>
                <Text style={styles.unreadText}>{message.unread}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={15} color="#657287" />
          </Pressable>
        ))}
      </View>
    </>
  );
}

function CompanySectionContent({
  dashboard,
  accent,
  onOpenNotifications,
}: {
  dashboard: CompanyDashboardData;
  accent: string;
  onOpenNotifications: () => void;
}) {
  const details = [
    { icon: "document-text-outline" as IoniconName, label: "NIF", value: "PT 509 884 210" },
    { icon: "location-outline" as IoniconName, label: "SEDE", value: "Lisboa, Portugal" },
    { icon: "mail-outline" as IoniconName, label: "EMAIL", value: "company@workly.pt" },
    { icon: "globe-outline" as IoniconName, label: "ATUAÇÃO", value: "Portugal · França" },
  ];

  return (
    <>
      <SectionHeader
        eyebrow="IDENTIDADE CORPORATIVA"
        title="Empresa"
        subtitle="Dados essenciais, conformidade e canais de suporte."
        accent={accent}
      />
      <View style={styles.companyProfileCard}>
        <View style={[styles.companyMark, { borderColor: accent }]}>
          <Ionicons name="business-outline" size={26} color={accent} />
        </View>
        <View style={styles.identityCopy}>
          <View style={styles.verifiedRow}>
            <Text style={styles.companyName}>{dashboard.company_name}</Text>
            <Ionicons name="checkmark-circle" size={17} color="#62E5AD" />
          </View>
          <Text style={[styles.planText, { color: accent }]}>EMPRESA VERIFICADA · {dashboard.plan.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.detailsGrid}>
        {details.map((detail) => (
          <View key={detail.label} style={styles.detailCard}>
            <Ionicons name={detail.icon} size={17} color={accent} />
            <Text style={styles.detailLabel}>{detail.label}</Text>
            <Text style={styles.detailValue}>{detail.value}</Text>
          </View>
        ))}
      </View>
      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={accent} />
          <Text style={styles.cardLabel}>CONFORMIDADE</Text>
        </View>
        {["Seguro de responsabilidade válido", "Documentação fiscal verificada", "18 perfis profissionais validados"].map((item) => (
          <View key={item} style={styles.complianceRow}>
            <Ionicons name="checkmark-circle" size={15} color="#62E5AD" />
            <Text style={styles.complianceText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.companyActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Configurar notificações"
          onPress={onOpenNotifications}
          style={({ pressed }) => [styles.companyAction, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={18} color={accent} />
          <Text style={styles.companyActionText}>Notificações</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Contactar suporte WORKLY por email"
          onPress={() => void Linking.openURL("mailto:suporte@workly.pt?subject=Suporte%20WORKLY")}
          style={({ pressed }) => [styles.companyAction, pressed && styles.pressed]}
        >
          <Ionicons name="headset-outline" size={18} color={accent} />
          <Text style={styles.companyActionText}>Suporte</Text>
        </Pressable>
      </View>
    </>
  );
}

function DashboardContent({
  section,
  dashboard,
  syncing,
  accent,
  selectedProject,
  selectedWorker,
  selectedShift,
  selectedDocument,
  selectedTeam,
  onSelectSection,
  onSelectProject,
  onSelectWorker,
  onSelectShift,
  onSelectDocument,
  onSelectTeam,
  onOpenChat,
  onOpenNotifications,
}: {
  section: CompanySection;
  dashboard: CompanyDashboardData;
  syncing: boolean;
  accent: string;
  selectedProject: number;
  selectedWorker: number;
  selectedShift: number;
  selectedDocument: number;
  selectedTeam: number;
  onSelectSection: (section: CompanySection) => void;
  onSelectProject: (id: number) => void;
  onSelectWorker: (id: number) => void;
  onSelectShift: (id: number) => void;
  onSelectDocument: (id: number) => void;
  onSelectTeam: (id: number) => void;
  onOpenChat: (id: number) => void;
  onOpenNotifications: () => void;
}) {
  if (section === "home") {
    return <HomeSection dashboard={dashboard} syncing={syncing} accent={accent} onSelectSection={onSelectSection} />;
  }
  if (section === "projects") {
    return <ProjectsSection accent={accent} selectedId={selectedProject} onSelect={onSelectProject} />;
  }
  if (section === "workers") {
    return <WorkersSection accent={accent} selectedId={selectedWorker} onSelect={onSelectWorker} onOpenChat={onOpenChat} />;
  }
  if (section === "schedule") {
    return <ScheduleSection accent={accent} selectedId={selectedShift} onSelect={onSelectShift} />;
  }
  if (section === "documents") {
    return <DocumentsSection accent={accent} selectedId={selectedDocument} onSelect={onSelectDocument} />;
  }
  if (section === "teams") {
    return <TeamsSection accent={accent} selectedId={selectedTeam} onSelect={onSelectTeam} onOpenChat={onOpenChat} />;
  }
  if (section === "messages") {
    return <MessagesSection accent={accent} onOpenChat={onOpenChat} />;
  }
  return <CompanySectionContent dashboard={dashboard} accent={accent} onOpenNotifications={onOpenNotifications} />;
}

export default function CompanyDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { logout } = useAuth();
  const phone = width < 520;
  const compact = width < 820;
  const panelWidth = phone ? width - 24 : compact ? width * 0.62 : Math.min(width * 0.46, 680);
  const [section, setSection] = useState<CompanySection | null>(null);
  const [dashboard, setDashboard] = useState<CompanyDashboardData>(DEMO_DASHBOARD);
  const [syncing, setSyncing] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].id);
  const [selectedWorker, setSelectedWorker] = useState(WORKERS[0].id);
  const [selectedShift, setSelectedShift] = useState(SHIFTS[1].id);
  const [selectedDocument, setSelectedDocument] = useState(COMPANY_DOCUMENTS[0].id);
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0].id);
  const panelProgress = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const result = await api.get<CompanyDashboardData>("/company/dashboard");
        if (active) setDashboard(result);
      } catch {
        // A demonstração continua funcional mesmo quando o backend ainda está a iniciar.
      } finally {
        if (active) setSyncing(false);
      }
    };

    void loadDashboard();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 3600, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 3600, useNativeDriver: true }),
      ]),
    );
    const scanning = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 10000, useNativeDriver: true }),
    );

    breathing.start();
    scanning.start();
    return () => {
      breathing.stop();
      scanning.stop();
    };
  }, [breath, scan]);

  const selectSection = (nextSection: CompanySection) => {
    if (transitioning) return;
    setTransitioning(true);

    if (nextSection === section) {
      Animated.timing(panelProgress, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start(() => {
        setSection(null);
        setTransitioning(false);
      });
      return;
    }

    const reveal = () => {
      setSection(nextSection);
      panelProgress.setValue(0);
      Animated.spring(panelProgress, {
        toValue: 1,
        damping: 24,
        stiffness: 180,
        mass: 0.82,
        useNativeDriver: true,
      }).start(() => setTransitioning(false));
    };

    if (section === null) {
      reveal();
      return;
    }

    Animated.timing(panelProgress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(reveal);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const openChat = (id: number) => router.push(`/chat/${id}` as never);
  const openNotifications = () => router.push("/notifications");
  const panelTranslateX = panelProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.min(width * 0.18, 210), 0],
  });
  const photoTranslateX = panelProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -Math.min(width * 0.045, 54)],
  });
  const photoTranslateY = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [2, -5],
  });
  const photoScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.01],
  });
  const scanTranslateX = scan.interpolate({
    inputRange: [0, 1],
    outputRange: [-Math.max(width * 0.35, 240), Math.max(width, 720)],
  });

  return (
    <View style={styles.screen}>
      <View style={styles.stage}>
        <View style={styles.gridLines} pointerEvents="none">
          {[0, 1, 2, 3, 4].map((line) => (
            <View key={line} style={[styles.gridLine, { left: `${line * 25}%` as DimensionValue }]} />
          ))}
          {[0, 1, 2, 3].map((line) => (
            <View
              key={`horizontal-${line}`}
              style={[styles.gridLineHorizontal, { top: `${line * 33.33}%` as DimensionValue }]}
            />
          ))}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[styles.scanLine, { transform: [{ translateX: scanTranslateX }] }]}
        />

        <Animated.View
          style={[
            styles.visualLayer,
            compact && styles.visualLayerCompact,
            phone && styles.visualLayerPhone,
            {
              opacity: phone
                ? panelProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.14] })
                : 1,
              transform: [
                { translateX: photoTranslateX },
                { translateY: photoTranslateY },
                { scale: photoScale },
              ],
            },
          ]}
        >
          <Text style={styles.visualCode}>
            {section ? SECTION_META[section].code : "OPERATIONS // READY"}
          </Text>
          <Image
            source={COMPANY_CUTOUT}
            style={styles.companyCutout}
            contentFit="contain"
            contentPosition="bottom center"
            accessibilityLabel="Complexo industrial moderno da empresa"
          />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.idlePrompt,
            phone && styles.idlePromptPhone,
            {
              opacity: panelProgress.interpolate({
                inputRange: [0, 0.18, 1],
                outputRange: [1, 0, 0],
              }),
              transform: [{ translateY: photoTranslateY }],
            },
          ]}
        >
          <View style={styles.idleSignal}>
            <View style={styles.idleSignalDot} />
            <Text style={styles.idleSignalText}>OPERATIONAL TWIN ONLINE</Text>
          </View>
          <Text style={styles.idleTitle}>A obra respira. A WORKLY acompanha.</Text>
          <Text style={styles.idleCopy}>
            Abra um módulo para monitorizar obras, workers, horários e documentação.
          </Text>
          <Ionicons name="arrow-down" size={17} color={COMPANY_ACCENT} />
        </Animated.View>

        {section ? (
          <Animated.View
            style={[
              styles.contentPanel,
              {
                top: Math.max(insets.top, 10) + 70,
                right: phone ? 12 : compact ? 10 : Math.max(width * 0.04, 28),
                bottom: Math.max(insets.bottom, 8) + 94,
                width: panelWidth,
                opacity: panelProgress,
                transform: [{ translateX: panelTranslateX }],
              },
              phone && styles.contentPanelPhone,
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, phone && styles.scrollContentPhone]}
            >
              <DashboardContent
                section={section}
                dashboard={dashboard}
                syncing={syncing}
                accent={COMPANY_ACCENT}
                selectedProject={selectedProject}
                selectedWorker={selectedWorker}
                selectedShift={selectedShift}
                selectedDocument={selectedDocument}
                selectedTeam={selectedTeam}
                onSelectSection={selectSection}
                onSelectProject={setSelectedProject}
                onSelectWorker={setSelectedWorker}
                onSelectShift={setSelectedShift}
                onSelectDocument={setSelectedDocument}
                onSelectTeam={setSelectedTeam}
                onOpenChat={openChat}
                onOpenNotifications={openNotifications}
              />
            </ScrollView>
          </Animated.View>
        ) : null}
      </View>

      <View style={[styles.topBar, { top: Math.max(insets.top, 10) + 8 }]}>
        <View style={styles.worklyBrand}>
          <Ionicons name="pulse-outline" size={17} color={COMPANY_ACCENT} />
          {!phone ? <Text style={styles.worklyBrandText}>WORKLY / COMPANY</Text> : null}
        </View>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir notificações"
            onPress={openNotifications}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={18} color="#F5F8FF" />
            {dashboard.stats.unread_messages > 0 ? <View style={styles.headerBadge} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Terminar sessão"
            onPress={() => void handleLogout()}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Ionicons name="log-out-outline" size={19} color="#F5F8FF" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.menuDock, { bottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.sectionMenu} accessibilityRole="tablist">
          {MENU_ITEMS.map((item) => {
            const active = section === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityLabel={item.accessibilityLabel}
                accessibilityState={{ selected: active }}
                onPress={() => selectSection(item.id)}
                style={({ pressed }) => [styles.menuItem, active && styles.menuItemActive, pressed && styles.pressed]}
              >
                <Ionicons name={item.icon} size={phone ? 16 : 18} color={active ? COMPANY_ACCENT : "#728096"} />
                <Text style={[styles.menuLabel, phone && styles.menuLabelPhone, active && styles.menuLabelActive]}>{item.label}</Text>
                <View style={[styles.menuIndicator, active && styles.menuIndicatorActive, active && { backgroundColor: COMPANY_ACCENT, shadowColor: COMPANY_ACCENT }]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden", backgroundColor: COMPANY_BACKGROUND },
  stage: { ...StyleSheet.absoluteFillObject },
  gridLines: { position: "absolute", top: 72, right: 0, bottom: 82, left: 0, overflow: "hidden", opacity: 0.065 },
  gridLine: { position: "absolute", top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: "#E4F1FF" },
  gridLineHorizontal: { position: "absolute", right: 0, left: 0, height: StyleSheet.hairlineWidth, backgroundColor: "#E4F1FF" },
  scanLine: { position: "absolute", top: 72, bottom: 82, width: 1, backgroundColor: "rgba(89,184,255,0.12)" },
  visualLayer: { position: "absolute", top: 82, bottom: 88, left: "2%", width: "58%" },
  visualLayerCompact: { left: 0, width: "54%" },
  visualLayerPhone: { left: 0, width: "100%" },
  companyCutout: { width: "100%", height: "100%" },
  visualCode: { position: "absolute", top: 4, left: 20, zIndex: 2, color: COMPANY_ACCENT, fontFamily: monoFont, fontSize: 9, fontWeight: "900", letterSpacing: 1.8, opacity: 0.84 },
  idlePrompt: { position: "absolute", top: "37%", right: "7%", width: "34%", maxWidth: 540, alignItems: "flex-start", gap: 10 },
  idlePromptPhone: { top: "auto", right: 24, bottom: 108, left: 24, width: "auto", alignItems: "center" },
  idleSignal: { flexDirection: "row", alignItems: "center", gap: 7 },
  idleSignalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COMPANY_ACCENT, shadowColor: COMPANY_ACCENT, shadowOpacity: 0.9, shadowRadius: 7 },
  idleSignalText: { color: COMPANY_ACCENT, fontFamily: monoFont, fontSize: 8, fontWeight: "900", letterSpacing: 1.45 },
  idleTitle: { color: "#F4F8FD", fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -1 },
  idleCopy: { maxWidth: 410, color: "#718096", fontSize: 11, lineHeight: 17, fontWeight: "600" },
  topBar: { position: "absolute", left: 14, right: 14, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  worklyBrand: { minWidth: 40, height: 40, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(5,7,10,0.76)" },
  worklyBrandText: { color: "#DDEEFF", fontFamily: monoFont, fontSize: 10, fontWeight: "800", letterSpacing: 1.25 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(5,7,10,0.76)" },
  headerBadge: { position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: "#090B10", backgroundColor: COMPANY_ACCENT },
  contentPanel: { position: "absolute", overflow: "hidden", borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(89,184,255,0.2)", backgroundColor: "rgba(4,9,15,0.96)", shadowColor: "#000000", shadowOpacity: 0.48, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } },
  contentPanelPhone: { borderRadius: 17, backgroundColor: "rgba(4,9,15,0.98)" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 26, gap: 14 },
  scrollContentPhone: { paddingHorizontal: 14, paddingTop: 17, paddingBottom: 20, gap: 11 },
  sectionHeader: { gap: 5 },
  eyebrow: { fontFamily: monoFont, fontSize: 9, fontWeight: "900", letterSpacing: 1.8 },
  sectionTitle: { color: "#F8FAFC", fontSize: 28, lineHeight: 32, fontWeight: "900", letterSpacing: -0.8 },
  sectionSubtitle: { maxWidth: 470, color: "#8996A8", fontSize: 10, lineHeight: 15, fontWeight: "500" },
  titleRule: { marginTop: 5, width: 48, height: 2, borderRadius: 1, shadowOpacity: 0.85, shadowRadius: 7 },
  identityCard: { padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.11)", backgroundColor: "rgba(255,255,255,0.055)" },
  identityCopy: { flex: 1 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  companyName: { flexShrink: 1, color: "#F7FAFF", fontSize: 16, fontWeight: "900" },
  planText: { marginTop: 4, color: COMPANY_ACCENT, fontFamily: monoFont, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  pulseBadge: { minWidth: 62, paddingHorizontal: 10, paddingVertical: 8, alignItems: "center", borderRadius: 12, backgroundColor: "rgba(2,4,8,0.56)" },
  pulseValue: { color: "#FFFFFF", fontFamily: monoFont, fontSize: 18, fontWeight: "900" },
  pulseLabel: { color: "#718096", fontSize: 7, fontWeight: "900", letterSpacing: 1.1 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricCard: { minWidth: "45%", flex: 1, minHeight: 78, padding: 11, justifyContent: "space-between", borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.045)" },
  metricValue: { marginTop: 5, color: "#F5F8FD", fontFamily: monoFont, fontSize: 19, fontWeight: "900" },
  metricLabel: { color: "#758398", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  glassCard: { padding: 14, gap: 11, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.045)" },
  cardHeadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabel: { color: "#B5C1D0", fontFamily: monoFont, fontSize: 9, fontWeight: "900", letterSpacing: 1.35 },
  operationTitle: { color: "#F7FAFF", fontSize: 17, fontWeight: "900" },
  operationClient: { marginTop: -7, color: "#98A6B8", fontSize: 9, fontWeight: "600" },
  operationMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: "#C7D1DF", fontSize: 9, fontWeight: "700" },
  primaryAction: { alignSelf: "flex-start", minHeight: 38, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999 },
  primaryActionText: { color: "#05070A", fontFamily: monoFont, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionTile: { minWidth: "45%", flex: 1, minHeight: 46, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.04)" },
  actionTileText: { flex: 1, color: "#CCD5E1", fontSize: 8, fontWeight: "800" },
  syncRow: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.045)" },
  syncText: { color: "#8998AA", fontSize: 8, fontWeight: "700" },
  summaryStrip: { padding: 13, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.045)" },
  summaryValue: { color: "#FFFFFF", fontFamily: monoFont, fontSize: 18, fontWeight: "900" },
  summaryLabel: { flex: 1, color: "#76869A", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: "rgba(255,255,255,0.12)" },
  listStack: { gap: 8 },
  selectableCard: { overflow: "hidden", borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)" },
  selectableHeading: { minHeight: 58, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  indexBadge: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.035)" },
  indexText: { fontFamily: monoFont, fontSize: 10, fontWeight: "900" },
  selectableCopy: { flex: 1 },
  selectableTitle: { color: "#F1F5FB", fontSize: 10, fontWeight: "900" },
  selectableSubtitle: { marginTop: 3, color: "#7F8EA2", fontSize: 8, lineHeight: 11 },
  statusText: { maxWidth: 68, textAlign: "right", fontSize: 7, fontWeight: "900" },
  progressTrack: { height: 3, marginHorizontal: 12, marginBottom: 10, overflow: "hidden", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.09)" },
  progressFill: { height: "100%", borderRadius: 2 },
  expandedDetails: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)" },
  timeBlock: { width: 48, alignItems: "center", justifyContent: "center" },
  timeStart: { fontFamily: monoFont, fontSize: 12, fontWeight: "900" },
  timeEnd: { marginTop: 2, color: "#6E7D91", fontFamily: monoFont, fontSize: 7, fontWeight: "800" },
  expandedColumn: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)" },
  attendanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  attendanceLabel: { color: "#718096", fontFamily: monoFont, fontSize: 7, fontWeight: "900", letterSpacing: 0.9 },
  attendanceValue: { fontFamily: monoFont, fontSize: 9, fontWeight: "900" },
  progressTrackWide: { height: 4, overflow: "hidden", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.09)" },
  expandedDetailsFlat: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  documentControlCard: { padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(89,184,255,0.2)", backgroundColor: "rgba(255,255,255,0.04)" },
  documentControlCopy: { marginTop: 4, color: "#8998AA", fontSize: 9, fontWeight: "600" },
  documentControlValue: { fontFamily: monoFont, fontSize: 24, fontWeight: "900" },
  documentModuleIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.035)" },
  avatar: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.055)" },
  avatarText: { color: "#EFF4FA", fontFamily: monoFont, fontSize: 10, fontWeight: "900" },
  onlineDot: { position: "absolute", right: 0, bottom: 0, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: "#091019", backgroundColor: "#62E5AD" },
  busyDot: { backgroundColor: "#FFB353" },
  offlineDot: { backgroundColor: "#657287" },
  pulseMini: { alignItems: "center" },
  pulseMiniValue: { fontFamily: monoFont, fontSize: 13, fontWeight: "900" },
  pulseMiniLabel: { color: "#647287", fontSize: 6, fontWeight: "900", letterSpacing: 0.7 },
  secondaryAction: { minHeight: 30, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.035)" },
  secondaryActionText: { fontFamily: monoFont, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  teamIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11 },
  teamCount: { minWidth: 30, fontFamily: monoFont, fontSize: 20, fontWeight: "900", textAlign: "center" },
  messageSummary: { padding: 13, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.045)" },
  messageSummaryValue: { color: "#FFFFFF", fontFamily: monoFont, fontSize: 23, fontWeight: "900" },
  messageSummaryLabel: { flex: 1, color: "#8190A4", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  messageCard: { minHeight: 70, padding: 11, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)" },
  messageCopy: { flex: 1 },
  messageHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 },
  messageSender: { flex: 1, color: "#EEF4FC", fontSize: 9, fontWeight: "900" },
  messageTime: { color: "#718198", fontSize: 7 },
  messageRole: { marginTop: 1, fontSize: 7, fontWeight: "800" },
  messagePreview: { marginTop: 3, color: "#A8B5C6", fontSize: 8, lineHeight: 11 },
  unreadBadge: { minWidth: 19, height: 19, paddingHorizontal: 5, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  unreadText: { color: "#05070A", fontSize: 8, fontWeight: "900" },
  companyProfileCard: { padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)" },
  companyMark: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.035)" },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detailCard: { minWidth: "45%", flex: 1, minHeight: 86, padding: 11, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.04)" },
  detailLabel: { marginTop: 8, color: "#68778B", fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  detailValue: { marginTop: 3, color: "#E8EEF6", fontSize: 9, fontWeight: "800" },
  complianceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  complianceText: { color: "#C6D0DD", fontSize: 9, fontWeight: "600" },
  companyActions: { flexDirection: "row", gap: 8 },
  companyAction: { flex: 1, minHeight: 46, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.045)" },
  companyActionText: { color: "#D8E1EC", fontSize: 9, fontWeight: "800" },
  menuDock: { position: "absolute", left: 12, right: 12, alignItems: "center" },
  sectionMenu: { width: "100%", maxWidth: 1180, height: 72, padding: 6, flexDirection: "row", alignItems: "stretch", borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(89,184,255,0.22)", backgroundColor: "rgba(3,8,14,0.96)", shadowColor: "#000000", shadowOpacity: 0.58, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  menuItem: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 18 },
  menuItemActive: { backgroundColor: "rgba(255,255,255,0.065)" },
  menuLabel: { color: "#728096", fontFamily: monoFont, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  menuLabelPhone: { fontSize: 6, letterSpacing: 0.15 },
  menuLabelActive: { color: "#EDF3FA" },
  menuIndicator: { width: 18, height: 2, borderRadius: 1, backgroundColor: "transparent" },
  menuIndicatorActive: { width: 34, shadowOpacity: 0.9, shadowRadius: 7 },
  pressed: { opacity: 0.62 },
});
