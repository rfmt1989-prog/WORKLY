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
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

type CompanySection =
  | "home"
  | "projects"
  | "workers"
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

const COMPANY_CUTOUT = require("../../assets/images/company-profile/company-cutout.png");

const SECTION_ORDER: CompanySection[] = [
  "home",
  "projects",
  "workers",
  "teams",
  "messages",
  "company",
];

const SECTION_THEMES: Record<
  CompanySection,
  {
    accent: string;
    glow: string;
    gradient: readonly [string, string, string];
    code: string;
  }
> = {
  home: {
    accent: "#FF705C",
    glow: "rgba(255, 83, 64, 0.25)",
    gradient: ["#070303", "#2A0D0B", "#05070A"],
    code: "OPS // LIVE",
  },
  projects: {
    accent: "#FFB353",
    glow: "rgba(245, 158, 11, 0.24)",
    gradient: ["#080501", "#2B1907", "#05070A"],
    code: "PROJECTS // 04",
  },
  workers: {
    accent: "#5FD4FF",
    glow: "rgba(14, 165, 233, 0.24)",
    gradient: ["#020609", "#082535", "#05070A"],
    code: "PEOPLE // 18",
  },
  teams: {
    accent: "#A995FF",
    glow: "rgba(139, 92, 246, 0.24)",
    gradient: ["#050309", "#1C1237", "#05070A"],
    code: "TEAMS // 03",
  },
  messages: {
    accent: "#FF78B5",
    glow: "rgba(236, 72, 153, 0.22)",
    gradient: ["#080207", "#2A0D20", "#05070A"],
    code: "COMMS // 07",
  },
  company: {
    accent: "#62E5AD",
    glow: "rgba(34, 197, 94, 0.22)",
    gradient: ["#020806", "#0A281C", "#05070A"],
    code: "COMPANY // VERIFIED",
  },
};

const MENU_ITEMS: {
  id: CompanySection;
  label: string;
  icon: IoniconName;
  accessibilityLabel: string;
}[] = [
  { id: "home", label: "INÍCIO", icon: "grid-outline", accessibilityLabel: "Centro de operações" },
  { id: "projects", label: "OBRAS", icon: "business-outline", accessibilityLabel: "Obras da empresa" },
  { id: "workers", label: "PESSOAS", icon: "people-outline", accessibilityLabel: "Trabalhadores" },
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

const monoFont = Platform.select({ web: "monospace", default: undefined });

function sectionFromPath(pathname: string): CompanySection {
  if (pathname.endsWith("/projects")) return "projects";
  if (pathname.endsWith("/workers")) return "workers";
  if (pathname.endsWith("/teams")) return "teams";
  if (pathname.endsWith("/messages")) return "messages";
  if (pathname.endsWith("/profile")) return "company";
  return "home";
}

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
    { section: "workers", label: "Ver pessoas", icon: "person-add-outline" },
    { section: "teams", label: "Organizar equipas", icon: "git-network-outline" },
    { section: "messages", label: "Abrir mensagens", icon: "chatbubbles-outline" },
  ];

  return (
    <>
      <SectionHeader
        eyebrow="CENTRO DE OPERAÇÕES"
        title="Visão geral"
        subtitle="Estado da operação em tempo real, sem ruído nem informação repetida."
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
  selectedTeam,
  onSelectSection,
  onSelectProject,
  onSelectWorker,
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
  selectedTeam: number;
  onSelectSection: (section: CompanySection) => void;
  onSelectProject: (id: number) => void;
  onSelectWorker: (id: number) => void;
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
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { logout } = useAuth();
  const phone = width < 520;
  const compact = width < 820;
  const panelWidth = phone ? width - 24 : compact ? width * 0.62 : Math.min(width * 0.46, 680);
  const [section, setSection] = useState<CompanySection>(() => sectionFromPath(pathname));
  const [dashboard, setDashboard] = useState<CompanyDashboardData>(DEMO_DASHBOARD);
  const [syncing, setSyncing] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].id);
  const [selectedWorker, setSelectedWorker] = useState(WORKERS[0].id);
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0].id);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const theme = SECTION_THEMES[section];

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

  const selectSection = (nextSection: CompanySection) => {
    if (nextSection === section || transitioning) return;
    const direction = SECTION_ORDER.indexOf(nextSection) > SECTION_ORDER.indexOf(section) ? 1 : -1;
    setTransitioning(true);

    Animated.parallel([
      Animated.timing(translateX, { toValue: -direction * Math.min(width * 0.08, 70), duration: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 135, useNativeDriver: true }),
    ]).start(() => {
      setSection(nextSection);
      translateX.setValue(direction * Math.min(width * 0.08, 70));
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, damping: 22, stiffness: 210, mass: 0.72, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 210, useNativeDriver: true }),
      ]).start(() => setTransitioning(false));
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const openChat = (id: number) => router.push(`/chat/${id}` as never);
  const openNotifications = () => router.push("/notifications");

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.stage, { opacity, transform: [{ translateX }] }]}>
        <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.ambientGlow, { backgroundColor: theme.glow }]} />
        <View style={styles.gridLines} pointerEvents="none">
          {[0, 1, 2, 3, 4].map((line) => (
            <View key={line} style={[styles.gridLine, { left: `${line * 25}%` as DimensionValue }]} />
          ))}
        </View>

        <View style={[styles.visualLayer, compact && styles.visualLayerCompact, phone && styles.visualLayerPhone]}>
          <Text style={[styles.visualCode, { color: theme.accent }]}>{theme.code}</Text>
          <Image
            source={COMPANY_CUTOUT}
            style={styles.companyCutout}
            contentFit="contain"
            contentPosition="bottom left"
            accessibilityLabel="Complexo industrial moderno da empresa"
          />
        </View>

        <LinearGradient
          colors={phone ? ["rgba(5,7,10,0.4)", "rgba(5,7,10,0.76)", "#05070A"] : ["rgba(5,7,10,0.01)", "rgba(5,7,10,0.46)", "#05070A"]}
          locations={[0, phone ? 0.28 : 0.48, 0.78]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />

        <View
          style={[
            styles.contentPanel,
            {
              top: Math.max(insets.top, 10) + 70,
              right: phone ? 12 : compact ? 10 : Math.max(width * 0.04, 28),
              bottom: Math.max(insets.bottom, 8) + 94,
              width: panelWidth,
              borderColor: theme.glow,
            },
            phone && styles.contentPanelPhone,
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, phone && styles.scrollContentPhone]}>
            <DashboardContent
              section={section}
              dashboard={dashboard}
              syncing={syncing}
              accent={theme.accent}
              selectedProject={selectedProject}
              selectedWorker={selectedWorker}
              selectedTeam={selectedTeam}
              onSelectSection={selectSection}
              onSelectProject={setSelectedProject}
              onSelectWorker={setSelectedWorker}
              onSelectTeam={setSelectedTeam}
              onOpenChat={openChat}
              onOpenNotifications={openNotifications}
            />
          </ScrollView>
        </View>
      </Animated.View>

      <View style={[styles.topBar, { top: Math.max(insets.top, 10) + 8 }]}>
        <View style={styles.worklyBrand}>
          <Ionicons name="pulse-outline" size={17} color={theme.accent} />
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
                <Ionicons name={item.icon} size={phone ? 17 : 19} color={active ? theme.accent : "#728096"} />
                <Text style={[styles.menuLabel, phone && styles.menuLabelPhone, active && styles.menuLabelActive]}>{item.label}</Text>
                <View style={[styles.menuIndicator, active && styles.menuIndicatorActive, active && { backgroundColor: theme.accent, shadowColor: theme.accent }]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden", backgroundColor: "#05070A" },
  stage: { ...StyleSheet.absoluteFillObject },
  ambientGlow: { position: "absolute", top: "9%", left: "4%", width: "49%", height: "65%", borderRadius: 999, transform: [{ scaleX: 1.25 }] },
  gridLines: { position: "absolute", top: 72, bottom: 88, left: 18, width: "55%", overflow: "hidden", opacity: 0.17 },
  gridLine: { position: "absolute", top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: "#E4F1FF" },
  visualLayer: { position: "absolute", top: 68, bottom: 80, left: 0, width: "62%" },
  visualLayerCompact: { width: "56%", opacity: 0.88 },
  visualLayerPhone: { width: "100%", opacity: 0.28 },
  companyCutout: { width: "100%", height: "100%" },
  visualCode: { position: "absolute", top: 16, left: 24, zIndex: 2, fontFamily: monoFont, fontSize: 9, fontWeight: "900", letterSpacing: 1.8, opacity: 0.85 },
  topBar: { position: "absolute", left: 14, right: 14, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  worklyBrand: { minWidth: 40, height: 40, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(5,7,10,0.76)" },
  worklyBrandText: { color: "#F6E6E4", fontFamily: monoFont, fontSize: 10, fontWeight: "800", letterSpacing: 1.25 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(5,7,10,0.76)" },
  headerBadge: { position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: "#090B10", backgroundColor: "#FF705C" },
  contentPanel: { position: "absolute", overflow: "hidden", borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, backgroundColor: "rgba(5,8,13,0.74)", shadowColor: "#000000", shadowOpacity: 0.48, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } },
  contentPanelPhone: { borderRadius: 17, backgroundColor: "rgba(5,8,13,0.88)" },
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
  planText: { marginTop: 4, color: "#FF8B7A", fontFamily: monoFont, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
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
  sectionMenu: { width: "100%", maxWidth: 940, height: 72, padding: 6, flexDirection: "row", alignItems: "stretch", borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(5,7,10,0.93)", shadowColor: "#000000", shadowOpacity: 0.58, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  menuItem: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 18 },
  menuItemActive: { backgroundColor: "rgba(255,255,255,0.065)" },
  menuLabel: { color: "#728096", fontFamily: monoFont, fontSize: 10, fontWeight: "900", letterSpacing: 1.25 },
  menuLabelPhone: { fontSize: 7, letterSpacing: 0.45 },
  menuLabelActive: { color: "#EDF3FA" },
  menuIndicator: { width: 18, height: 2, borderRadius: 1, backgroundColor: "transparent" },
  menuIndicatorActive: { width: 34, shadowOpacity: 0.9, shadowRadius: 7 },
  pressed: { opacity: 0.62 },
});
