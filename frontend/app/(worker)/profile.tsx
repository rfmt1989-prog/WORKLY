import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

type ProfileSection =
  | "home"
  | "info"
  | "skills"
  | "projects"
  | "documents"
  | "messages";
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type WorkerDashboardData = {
  worker_id: number;
  name: string;
  role: string;
  pulse: number;
  status: string;
  stats: {
    jobs_today: number;
    hours_this_week: number;
    documents_pending: number;
    unread_messages: number;
  };
  current_project: {
    project_id: number;
    name: string;
    company: string;
    location: string;
    start_time: string;
    end_time: string;
    team_leader: string;
    can_check_in: boolean;
  } | null;
};

type DocumentStatus = "valid" | "expiring" | "pending";

type WorkerDocumentsData = {
  summary: {
    completion_percentage: number;
    total_documents: number;
    valid_documents: number;
    expiring_documents: number;
    pending_documents: number;
  };
  documents: {
    id: number;
    title: string;
    category: string;
    status: DocumentStatus;
    description: string;
    expiry_date: string | null;
  }[];
};

type WorkerMessagesData = {
  unread_total: number;
  messages: {
    id: number;
    sender: string;
    role: string;
    preview: string;
    time: string;
    unread: number;
    online: boolean;
  }[];
};

const WORKER_CUTOUT = require("../../assets/images/worker-profile/worker-cutout.png");

const SECTION_THEMES: Record<
  ProfileSection,
  {
    accent: string;
    glow: string;
    gradient: readonly [string, string, string];
    code: string;
  }
> = {
  home: {
    accent: "#59B8FF",
    glow: "rgba(36, 146, 255, 0.28)",
    gradient: ["#02050A", "#07182A", "#03060C"],
    code: "WORKER // LIVE",
  },
  info: {
    accent: "#5FE0FF",
    glow: "rgba(39, 201, 255, 0.25)",
    gradient: ["#02060A", "#06232B", "#03060C"],
    code: "IDENTITY // 01",
  },
  skills: {
    accent: "#A78BFA",
    glow: "rgba(139, 92, 246, 0.25)",
    gradient: ["#05040A", "#17112D", "#03060C"],
    code: "SKILLS // 91",
  },
  projects: {
    accent: "#FFB55E",
    glow: "rgba(245, 158, 11, 0.24)",
    gradient: ["#080501", "#2B1807", "#03060C"],
    code: "FIELD // INTL",
  },
  documents: {
    accent: "#62E5AD",
    glow: "rgba(34, 197, 94, 0.23)",
    gradient: ["#020806", "#09251B", "#03060C"],
    code: "DOCS // 50%",
  },
  messages: {
    accent: "#FF7CB7",
    glow: "rgba(236, 72, 153, 0.22)",
    gradient: ["#080207", "#2A0D20", "#03060C"],
    code: "COMMS // 03",
  },
};

const SECTION_ORDER: ProfileSection[] = [
  "home",
  "info",
  "skills",
  "projects",
  "documents",
  "messages",
];

const MENU_ITEMS: {
  id: ProfileSection;
  label: string;
  icon: IoniconName;
  accessibilityLabel: string;
}[] = [
  {
    id: "home",
    label: "INÍCIO",
    icon: "grid-outline",
    accessibilityLabel: "Resumo do dashboard",
  },
  {
    id: "info",
    label: "INFO",
    icon: "person-outline",
    accessibilityLabel: "Informações profissionais",
  },
  {
    id: "skills",
    label: "SKILLS",
    icon: "build-outline",
    accessibilityLabel: "Competências técnicas",
  },
  {
    id: "projects",
    label: "OBRAS",
    icon: "construct-outline",
    accessibilityLabel: "Obras e certificados",
  },
  {
    id: "documents",
    label: "DOCS",
    icon: "document-text-outline",
    accessibilityLabel: "Documentos do trabalhador",
  },
  {
    id: "messages",
    label: "CHAT",
    icon: "chatbubble-outline",
    accessibilityLabel: "Mensagens do trabalhador",
  },
];

const DEMO_DASHBOARD: WorkerDashboardData = {
  worker_id: 1,
  name: "Rodolfo Maia",
  role: "Eletromecânico",
  pulse: 92,
  status: "available",
  stats: {
    jobs_today: 1,
    hours_this_week: 32.5,
    documents_pending: 2,
    unread_messages: 3,
  },
  current_project: {
    project_id: 101,
    name: "Hospital Lisboa",
    company: "Workly Demo Company",
    location: "Lisboa",
    start_time: "08:00",
    end_time: "17:00",
    team_leader: "Carlos Ferreira",
    can_check_in: true,
  },
};

const DEMO_DOCUMENTS: WorkerDocumentsData = {
  summary: {
    completion_percentage: 50,
    total_documents: 4,
    valid_documents: 2,
    expiring_documents: 1,
    pending_documents: 1,
  },
  documents: [
    {
      id: 1,
      title: "Cartão de Cidadão",
      category: "Identificação",
      status: "valid",
      description: "Documento de identificação validado.",
      expiry_date: "18/09/2029",
    },
    {
      id: 2,
      title: "Seguro de acidentes de trabalho",
      category: "Seguro",
      status: "expiring",
      description: "Renovação necessária antes da data de validade.",
      expiry_date: "22/08/2026",
    },
    {
      id: 3,
      title: "Certificado de segurança",
      category: "Formação",
      status: "valid",
      description: "Formação de segurança em obra concluída.",
      expiry_date: "10/04/2028",
    },
    {
      id: 4,
      title: "Contrato de trabalho",
      category: "Contrato",
      status: "pending",
      description: "A aguardar assinatura da empresa.",
      expiry_date: null,
    },
  ],
};

const DEMO_MESSAGES: WorkerMessagesData = {
  unread_total: 3,
  messages: [
    {
      id: 1,
      sender: "Carlos Ferreira",
      role: "Chefe de equipa",
      preview: "Amanhã começamos às 08:00.",
      time: "09:42",
      unread: 2,
      online: true,
    },
    {
      id: 2,
      sender: "Workly Demo Company",
      role: "Empresa",
      preview: "O contrato foi aprovado.",
      time: "Ontem",
      unread: 1,
      online: true,
    },
    {
      id: 3,
      sender: "Suporte WORKLY",
      role: "Suporte",
      preview: "Obrigado pelo contacto.",
      time: "Seg",
      unread: 0,
      online: false,
    },
  ],
};

const LANGUAGES = [
  { name: "Português", level: "Nativo", score: 5 },
  { name: "Inglês", level: "Falo bem", score: 4 },
  { name: "Espanhol", level: "Médio / baixo", score: 2 },
];

const TECHNICAL_SKILLS = [
  { name: "Infraestruturas metálicas", score: 92 },
  { name: "Eletricidade", score: 91 },
  { name: "Canalização", score: 87 },
  { name: "Sistemas AVAC", score: 89 },
  { name: "Trabalhos em altura", score: 90 },
  { name: "Leitura de esquemas técnicos", score: 88 },
  { name: "Montagem industrial", score: 90 },
  { name: "Segurança em obra", score: 93 },
];

const PROJECTS = [
  { company: "Galp Petrogal", location: "Sines", icon: "business-outline" as IoniconName },
  { company: "Sirmax", location: "Indianapolis", icon: "cube-outline" as IoniconName },
  { company: "Dal-Tile", location: "Tennessee", icon: "grid-outline" as IoniconName },
  { company: "Rennes Métropole", location: "Rennes", icon: "trail-sign-outline" as IoniconName },
];

const CERTIFICATES = [
  { label: "Trabalho em altura", icon: "accessibility-outline" as IoniconName },
  { label: "Segurança industrial", icon: "shield-checkmark-outline" as IoniconName },
  { label: "LOTO / bloqueio e etiquetagem", icon: "lock-closed-outline" as IoniconName },
  { label: "Primeiros socorros", icon: "medkit-outline" as IoniconName },
];

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.titleRule} />
    </View>
  );
}

function InfoSection() {
  return (
    <>
      <SectionHeader eyebrow="PERFIL PROFISSIONAL" title="Rodolfo Maia" />

      <View style={styles.rolePill}>
        <Ionicons name="flash-outline" size={15} color="#59B8FF" />
        <Text style={styles.roleText}>ELETROMECÂNICO</Text>
      </View>

      <View style={styles.glassCard}>
        <Text style={styles.cardLabel}>SOBRE</Text>
        <Text style={styles.bodyText}>
          Profissional com experiência sólida em ambientes industriais e projetos
          internacionais. Atuação focada em infraestruturas metálicas,
          eletricidade, canalização, sistemas AVAC, montagem técnica e segurança
          em obra. Perfil orientado para qualidade, eficiência e entrega de
          resultados.
        </Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={18} color="#319FFF" />
          <View>
            <Text style={styles.detailLabel}>IDADE</Text>
            <Text style={styles.detailValue}>36 anos</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="flag-outline" size={18} color="#319FFF" />
          <View>
            <Text style={styles.detailLabel}>NACIONALIDADE</Text>
            <Text style={styles.detailValue}>Portuguesa</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="briefcase-outline" size={18} color="#319FFF" />
          <View>
            <Text style={styles.detailLabel}>PROFISSÃO</Text>
            <Text style={styles.detailValue}>Eletromecânico</Text>
          </View>
        </View>
      </View>

      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="language-outline" size={18} color="#319FFF" />
          <Text style={styles.cardLabel}>IDIOMAS</Text>
        </View>
        {LANGUAGES.map((language) => (
          <View key={language.name} style={styles.languageRow}>
            <View style={styles.languageCopy}>
              <Text style={styles.languageName}>{language.name}</Text>
              <Text style={styles.languageLevel}>{language.level}</Text>
            </View>
            <View style={styles.dots}>
              {[0, 1, 2, 3, 4].map((dot) => (
                <View
                  key={dot}
                  style={[styles.dot, dot < language.score && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function SkillsSection() {
  return (
    <>
      <SectionHeader eyebrow="COMPETÊNCIAS" title="Skills técnicas" />

      <View style={styles.scoreCard}>
        <View>
          <Text style={styles.cardLabel}>AVALIAÇÃO GLOBAL</Text>
          <Text style={styles.scoreCaption}>Qualidade, rigor e segurança</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNumber}>91</Text>
          <Text style={styles.scoreUnit}>OVR</Text>
        </View>
      </View>

      <View style={styles.glassCard}>
        {TECHNICAL_SKILLS.map((skill) => (
          <View key={skill.name} style={styles.skillRow}>
            <View style={styles.skillCopy}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={styles.skillScore}>{skill.score}</Text>
            </View>
            <View style={styles.skillTrack}>
              <View
                style={[
                  styles.skillFill,
                  { width: `${skill.score}%` as DimensionValue },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.attributeGrid}>
        {["Organização", "Autonomia", "Rigor técnico", "Segurança", "Adaptabilidade", "Trabalho em equipa"].map(
          (attribute) => (
            <View key={attribute} style={styles.attributePill}>
              <Ionicons name="checkmark-circle" size={14} color="#319FFF" />
              <Text style={styles.attributeText}>{attribute}</Text>
            </View>
          ),
        )}
      </View>
    </>
  );
}

function ProjectsSection() {
  return (
    <>
      <SectionHeader eyebrow="EXPERIÊNCIA INTERNACIONAL" title="Obras e certificados" />

      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="construct-outline" size={19} color="#319FFF" />
          <Text style={styles.cardLabel}>MELHORES PROJETOS</Text>
        </View>
        {PROJECTS.map((project, index) => (
          <View key={`${project.company}-${project.location}`} style={styles.projectRow}>
            <View style={styles.projectIcon}>
              <Ionicons name={project.icon} size={20} color="#65BDFF" />
            </View>
            <View style={styles.projectCopy}>
              <Text style={styles.projectCompany}>{project.company}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#8492A7" />
                <Text style={styles.projectLocation}>{project.location}</Text>
              </View>
            </View>
            <Text style={styles.projectNumber}>{String(index + 1).padStart(2, "0")}</Text>
          </View>
        ))}
      </View>

      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="ribbon-outline" size={19} color="#319FFF" />
          <Text style={styles.cardLabel}>CERTIFICADOS</Text>
        </View>
        <View style={styles.certificateGrid}>
          {CERTIFICATES.map((certificate) => (
            <View key={certificate.label} style={styles.certificatePill}>
              <Ionicons name={certificate.icon} size={17} color="#59B8FF" />
              <Text style={styles.certificateText}>{certificate.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function HomeSection({
  dashboard,
  syncing,
  onOpenProject,
}: {
  dashboard: WorkerDashboardData;
  syncing: boolean;
  onOpenProject: () => void;
}) {
  const project = dashboard.current_project;

  const stats = [
    {
      label: "OBRAS HOJE",
      value: String(dashboard.stats.jobs_today),
      icon: "construct-outline" as IoniconName,
    },
    {
      label: "HORAS / SEMANA",
      value: `${dashboard.stats.hours_this_week}h`,
      icon: "time-outline" as IoniconName,
    },
    {
      label: "DOCS PENDENTES",
      value: String(dashboard.stats.documents_pending),
      icon: "document-text-outline" as IoniconName,
    },
    {
      label: "MENSAGENS",
      value: String(dashboard.stats.unread_messages),
      icon: "chatbubble-outline" as IoniconName,
    },
  ];

  return (
    <>
      <SectionHeader eyebrow="ÁREA DO TRABALHADOR" title="Dashboard" />

      <View style={styles.welcomeRow}>
        <View style={styles.welcomeCopy}>
          <Text style={styles.welcomeName}>{dashboard.name}</Text>
          <Text style={styles.welcomeRole}>{dashboard.role}</Text>
        </View>
        <View style={styles.pulseBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.pulseValue}>{dashboard.pulse}%</Text>
          <Text style={styles.pulseLabel}>PULSE</Text>
        </View>
      </View>

      <View style={styles.dashboardStats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.dashboardStatCard}>
            <Ionicons name={stat.icon} size={17} color="#59B8FF" />
            <Text style={styles.dashboardStatValue}>{stat.value}</Text>
            <Text style={styles.dashboardStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="location-outline" size={19} color="#319FFF" />
          <Text style={styles.cardLabel}>OBRA ATUAL</Text>
        </View>

        {project ? (
          <>
            <Text style={styles.currentProjectName}>{project.name}</Text>
            <Text style={styles.currentProjectCompany}>{project.company}</Text>
            <View style={styles.projectDetailsGrid}>
              <View style={styles.projectDetail}>
                <Ionicons name="navigate-outline" size={15} color="#59B8FF" />
                <View>
                  <Text style={styles.detailLabel}>LOCAL</Text>
                  <Text style={styles.projectDetailValue}>{project.location}</Text>
                </View>
              </View>
              <View style={styles.projectDetail}>
                <Ionicons name="time-outline" size={15} color="#59B8FF" />
                <View>
                  <Text style={styles.detailLabel}>HORÁRIO</Text>
                  <Text style={styles.projectDetailValue}>
                    {project.start_time} - {project.end_time}
                  </Text>
                </View>
              </View>
              <View style={styles.projectDetail}>
                <Ionicons name="person-outline" size={15} color="#59B8FF" />
                <View>
                  <Text style={styles.detailLabel}>RESPONSÁVEL</Text>
                  <Text style={styles.projectDetailValue}>{project.team_leader}</Text>
                </View>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver experiência em obras"
              onPress={onOpenProject}
              style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}
            >
              <Text style={styles.inlineActionText}>VER EXPERIÊNCIA</Text>
              <Ionicons name="arrow-forward" size={14} color="#DCEEFF" />
            </Pressable>
          </>
        ) : (
          <Text style={styles.bodyText}>Sem obra atribuída neste momento.</Text>
        )}
      </View>

      <View style={styles.syncRow}>
        <Ionicons
          name={syncing ? "sync-outline" : "cloud-done-outline"}
          size={14}
          color={syncing ? "#F7B84B" : "#52D89A"}
        />
        <Text style={styles.syncText}>
          {syncing ? "A sincronizar dados..." : "Dados atualizados"}
        </Text>
      </View>
    </>
  );
}

function DocumentsSection({ documents }: { documents: WorkerDocumentsData }) {
  const statusMeta: Record<
    DocumentStatus,
    { label: string; color: string; icon: IoniconName }
  > = {
    valid: { label: "Válido", color: "#52D89A", icon: "checkmark-circle" },
    expiring: { label: "A expirar", color: "#F7B84B", icon: "time" },
    pending: { label: "Pendente", color: "#8BA2BC", icon: "ellipsis-horizontal-circle" },
  };

  return (
    <>
      <SectionHeader eyebrow="GESTÃO DOCUMENTAL" title="Documentos" />

      <View style={styles.documentSummary}>
        <View style={styles.documentProgressBadge}>
          <Text style={styles.documentProgressValue}>
            {documents.summary.completion_percentage}%
          </Text>
          <Text style={styles.documentProgressLabel}>VALIDADO</Text>
        </View>
        <View style={styles.documentSummaryCopy}>
          <Text style={styles.documentSummaryTitle}>Estado documental</Text>
          <Text style={styles.documentSummaryText}>
            {documents.summary.valid_documents} válidos · {documents.summary.expiring_documents} a expirar · {documents.summary.pending_documents} pendente
          </Text>
          <View style={styles.documentTrack}>
            <View
              style={[
                styles.documentFill,
                {
                  width: `${documents.summary.completion_percentage}%` as DimensionValue,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.glassCard}>
        {documents.documents.map((document) => {
          const status = statusMeta[document.status];

          return (
            <View key={document.id} style={styles.documentRow}>
              <View style={styles.documentIcon}>
                <Ionicons name="document-text-outline" size={19} color="#59B8FF" />
              </View>
              <View style={styles.documentCopy}>
                <Text style={styles.documentTitle}>{document.title}</Text>
                <Text style={styles.documentCategory}>{document.category}</Text>
                {document.expiry_date ? (
                  <Text style={styles.documentExpiry}>Validade: {document.expiry_date}</Text>
                ) : null}
              </View>
              <View style={styles.documentStatus}>
                <Ionicons name={status.icon} size={13} color={status.color} />
                <Text style={[styles.documentStatusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

function MessagesSection({
  messages,
  onOpenChat,
}: {
  messages: WorkerMessagesData;
  onOpenChat: (id: number) => void;
}) {
  return (
    <>
      <SectionHeader eyebrow="COMUNICAÇÃO" title="Mensagens" />

      <View style={styles.messageSummary}>
        <View>
          <Text style={styles.messageSummaryValue}>{messages.unread_total}</Text>
          <Text style={styles.messageSummaryLabel}>POR LER</Text>
        </View>
        <View style={styles.messageSummaryIcon}>
          <Ionicons name="chatbubbles-outline" size={24} color="#59B8FF" />
        </View>
      </View>

      <View style={styles.glassCard}>
        {messages.messages.map((message) => (
          <Pressable
            key={message.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir conversa com ${message.sender}`}
            onPress={() => onOpenChat(message.id)}
            style={({ pressed }) => [styles.messageRow, pressed && styles.pressed]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {message.sender
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </Text>
              <View
                style={[
                  styles.onlineIndicator,
                  !message.online && styles.onlineIndicatorOffline,
                ]}
              />
            </View>
            <View style={styles.messageCopy}>
              <View style={styles.messageHeading}>
                <Text style={styles.messageSender}>{message.sender}</Text>
                <Text style={styles.messageTime}>{message.time}</Text>
              </View>
              <Text style={styles.messageRole}>{message.role}</Text>
              <Text numberOfLines={2} style={styles.messagePreview}>
                {message.preview}
              </Text>
            </View>
            {message.unread > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{message.unread}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.quickContacts}>
        {["Equipa", "Empresa", "Suporte"].map((contact, index) => (
          <Pressable
            key={contact}
            accessibilityRole="button"
            accessibilityLabel={`Abrir conversa com ${contact}`}
            onPress={() => onOpenChat(index + 1)}
            style={({ pressed }) => [styles.quickContact, pressed && styles.pressed]}
          >
            <Ionicons
              name={
                (["people-outline", "business-outline", "headset-outline"] as IoniconName[])[index]
              }
              size={16}
              color="#59B8FF"
            />
            <Text style={styles.quickContactText}>{contact}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function SectionContent({
  section,
  dashboard,
  documents,
  messages,
  syncing,
  onSelectSection,
  onOpenChat,
}: {
  section: ProfileSection;
  dashboard: WorkerDashboardData;
  documents: WorkerDocumentsData;
  messages: WorkerMessagesData;
  syncing: boolean;
  onSelectSection: (section: ProfileSection) => void;
  onOpenChat: (id: number) => void;
}) {
  if (section === "home") {
    return (
      <HomeSection
        dashboard={dashboard}
        syncing={syncing}
        onOpenProject={() => onSelectSection("projects")}
      />
    );
  }
  if (section === "skills") return <SkillsSection />;
  if (section === "projects") return <ProjectsSection />;
  if (section === "documents") return <DocumentsSection documents={documents} />;
  if (section === "messages") {
    return <MessagesSection messages={messages} onOpenChat={onOpenChat} />;
  }
  return <InfoSection />;
}

export default function WorkerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { logout } = useAuth();
  const compact = width < 720;
  const panelWidth = compact ? width * 0.59 : Math.min(width * 0.45, 650);
  const [section, setSection] = useState<ProfileSection>("home");
  const [dashboard, setDashboard] = useState<WorkerDashboardData>(DEMO_DASHBOARD);
  const [documents, setDocuments] = useState<WorkerDocumentsData>(DEMO_DOCUMENTS);
  const [messages, setMessages] = useState<WorkerMessagesData>(DEMO_MESSAGES);
  const [syncing, setSyncing] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const theme = SECTION_THEMES[section];

  useEffect(() => {
    let active = true;

    const loadWorkspace = async () => {
      const [dashboardResult, documentsResult, messagesResult] =
        await Promise.allSettled([
          api.get<WorkerDashboardData>("/worker/dashboard"),
          api.get<WorkerDocumentsData>("/worker/documents"),
          api.get<WorkerMessagesData>("/worker/messages"),
        ]);

      if (!active) return;

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value);
      }

      if (documentsResult.status === "fulfilled") {
        setDocuments(documentsResult.value);
      }

      if (messagesResult.status === "fulfilled") {
        setMessages(messagesResult.value);
      }

      setSyncing(false);
    };

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, []);

  const selectSection = (nextSection: ProfileSection) => {
    if (nextSection === section || transitioning) return;

    const direction =
      SECTION_ORDER.indexOf(nextSection) > SECTION_ORDER.indexOf(section) ? 1 : -1;

    setTransitioning(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -direction * Math.min(width * 0.08, 70),
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 145,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSection(nextSection);
      translateX.setValue(direction * Math.min(width * 0.08, 70));

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 22,
          stiffness: 210,
          mass: 0.72,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 210,
          useNativeDriver: true,
        }),
      ]).start(() => setTransitioning(false));
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const openChat = (id: number) => {
    router.push(`/chat/${id}` as never);
  };

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.stage,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={[styles.ambientGlow, { backgroundColor: theme.glow }]} />
        <View style={styles.gridLines} pointerEvents="none">
          {[0, 1, 2, 3, 4].map((line) => (
            <View
              key={line}
              style={[styles.gridLine, { left: `${line * 25}%` as DimensionValue }]}
            />
          ))}
        </View>

        <View style={[styles.visualLayer, compact && styles.visualLayerCompact]}>
          <Text style={[styles.visualCode, { color: theme.accent }]}>{theme.code}</Text>
          <Image
            source={WORKER_CUTOUT}
            style={styles.workerCutout}
            contentFit="contain"
            contentPosition="bottom left"
            accessibilityLabel="Rodolfo Maia, trabalhador eletromecânico"
          />
        </View>

        <LinearGradient
          colors={
            compact
              ? ["rgba(3,6,12,0.12)", "rgba(3,6,12,0.7)", "#03060C"]
              : ["rgba(3,6,12,0.01)", "rgba(3,6,12,0.44)", "#03060C"]
          }
          locations={[0, compact ? 0.4 : 0.48, 0.76]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />

        <LinearGradient
          colors={["rgba(3,6,12,0.82)", "transparent", "rgba(3,6,12,0.9)"]}
          locations={[0, 0.22, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />

        <View
          style={[
            styles.contentPanel,
            {
              top: Math.max(insets.top, 10) + 70,
              right: compact ? 9 : Math.max(width * 0.04, 28),
              bottom: Math.max(insets.bottom, 8) + 94,
              width: panelWidth,
              borderColor: theme.glow,
            },
            compact && styles.contentPanelCompact,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              compact && styles.scrollContentCompact,
            ]}
          >
            <SectionContent
              section={section}
              dashboard={dashboard}
              documents={documents}
              messages={messages}
              syncing={syncing}
              onSelectSection={selectSection}
              onOpenChat={openChat}
            />
          </ScrollView>
        </View>
      </Animated.View>

      <View
        style={[
          styles.topBar,
          {
            top: Math.max(insets.top, 10) + 8,
          },
        ]}
      >
        <View style={styles.worklyBrand}>
          <Ionicons name="pulse-outline" size={17} color={theme.accent} />
          {!compact && <Text style={styles.worklyBrandText}>WORKLY / WORKER</Text>}
        </View>

        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir notificações"
            onPress={() => router.push("/notifications")}
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

      <View
        style={[
          styles.menuDock,
          {
            bottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
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
                style={({ pressed }) => [
                  styles.menuItem,
                  active && styles.menuItemActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={compact ? 17 : 19}
                  color={active ? theme.accent : "#728096"}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    compact && styles.menuLabelCompact,
                    active && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.menuIndicator,
                    active && styles.menuIndicatorActive,
                    active && { backgroundColor: theme.accent, shadowColor: theme.accent },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const monoFont = Platform.select({ web: "monospace", default: undefined });

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#03060C",
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientGlow: {
    position: "absolute",
    top: "10%",
    left: "4%",
    width: "46%",
    height: "62%",
    borderRadius: 999,
    transform: [{ scaleX: 1.2 }],
  },
  gridLines: {
    position: "absolute",
    top: 78,
    bottom: 88,
    left: 18,
    width: "52%",
    overflow: "hidden",
    opacity: 0.18,
  },
  gridLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#A6D9FF",
  },
  visualLayer: {
    position: "absolute",
    top: 64,
    bottom: 82,
    left: 0,
    width: "58%",
  },
  visualLayerCompact: {
    width: "50%",
    opacity: 0.9,
  },
  workerCutout: {
    width: "100%",
    height: "100%",
  },
  visualCode: {
    position: "absolute",
    top: 18,
    left: 24,
    zIndex: 2,
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    opacity: 0.82,
  },
  topBar: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  worklyBrand: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(64,168,255,0.45)",
    backgroundColor: "rgba(3,8,16,0.72)",
  },
  worklyBrandText: {
    color: "#DDEEFF",
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(3,8,16,0.72)",
  },
  headerBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#07111E",
    backgroundColor: "#FF7B9D",
  },
  contentPanel: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(82,171,255,0.24)",
    backgroundColor: "rgba(3,8,16,0.7)",
    shadowColor: "#000000",
    shadowOpacity: 0.42,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
  },
  contentPanelCompact: {
    borderRadius: 16,
    backgroundColor: "rgba(3,8,16,0.78)",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 14,
  },
  scrollContentCompact: {
    paddingHorizontal: 13,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 10,
  },
  sectionHeader: {
    gap: 4,
  },
  eyebrow: {
    color: "#359FFF",
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  sectionTitle: {
    color: "#F7FAFF",
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  titleRule: {
    marginTop: 7,
    width: 46,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#319FFF",
    shadowColor: "#319FFF",
    shadowOpacity: 0.9,
    shadowRadius: 7,
  },
  rolePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(62,169,255,0.42)",
    backgroundColor: "rgba(25,112,190,0.16)",
  },
  roleText: {
    color: "#DDEEFF",
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  glassCard: {
    padding: 14,
    gap: 11,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  cardHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardLabel: {
    color: "#AFC1D8",
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.45,
  },
  bodyText: {
    color: "#D9E1EC",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  detailsCard: {
    padding: 14,
    gap: 12,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.19)",
    backgroundColor: "rgba(10,42,72,0.22)",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  detailLabel: {
    color: "#74849A",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  detailValue: {
    marginTop: 1,
    color: "#F0F5FC",
    fontSize: 12,
    fontWeight: "700",
  },
  languageRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  languageCopy: {
    flex: 1,
  },
  languageName: {
    color: "#EDF4FE",
    fontSize: 11,
    fontWeight: "700",
  },
  languageLevel: {
    color: "#8290A4",
    fontSize: 8,
    marginTop: 1,
  },
  dots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#536175",
  },
  dotActive: {
    borderColor: "#319FFF",
    backgroundColor: "#319FFF",
    shadowColor: "#319FFF",
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  scoreCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.31)",
    backgroundColor: "rgba(14,74,124,0.24)",
  },
  scoreCaption: {
    marginTop: 4,
    color: "#8997A9",
    fontSize: 9,
  },
  scoreBadge: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#319FFF",
    backgroundColor: "rgba(15,84,145,0.36)",
    shadowColor: "#2196F3",
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  scoreNumber: {
    color: "#FFFFFF",
    fontFamily: monoFont,
    fontSize: 23,
    lineHeight: 25,
    fontWeight: "900",
  },
  scoreUnit: {
    color: "#59B8FF",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  skillRow: {
    gap: 5,
  },
  skillCopy: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  skillName: {
    flex: 1,
    color: "#DDE6F2",
    fontSize: 10,
    fontWeight: "600",
  },
  skillScore: {
    color: "#79C5FF",
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: "800",
  },
  skillTrack: {
    height: 4,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  skillFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#319FFF",
    shadowColor: "#319FFF",
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  attributeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  attributePill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  attributeText: {
    color: "#C9D5E5",
    fontSize: 8,
    fontWeight: "700",
  },
  projectRow: {
    minHeight: 51,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.09)",
  },
  projectIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(49,159,255,0.12)",
  },
  projectCopy: {
    flex: 1,
  },
  projectCompany: {
    color: "#F1F6FD",
    fontSize: 11,
    fontWeight: "800",
  },
  locationRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  projectLocation: {
    color: "#8492A7",
    fontSize: 8,
  },
  projectNumber: {
    color: "rgba(89,184,255,0.38)",
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "900",
  },
  certificateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  certificatePill: {
    minWidth: "46%",
    paddingHorizontal: 9,
    paddingVertical: 8,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.2)",
    backgroundColor: "rgba(49,159,255,0.075)",
  },
  certificateText: {
    flex: 1,
    color: "#D7E2EF",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
  },
  welcomeRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.26)",
    backgroundColor: "rgba(15,72,120,0.2)",
  },
  welcomeCopy: {
    flex: 1,
  },
  welcomeName: {
    color: "#F5F9FF",
    fontSize: 17,
    fontWeight: "900",
  },
  welcomeRole: {
    marginTop: 3,
    color: "#70BFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  pulseBadge: {
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(4,10,18,0.58)",
  },
  statusDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#52D89A",
    shadowColor: "#52D89A",
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  pulseValue: {
    color: "#FFFFFF",
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: "900",
  },
  pulseLabel: {
    color: "#718299",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  dashboardStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dashboardStatCard: {
    minWidth: "45%",
    flex: 1,
    minHeight: 78,
    padding: 11,
    justifyContent: "space-between",
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  dashboardStatValue: {
    marginTop: 5,
    color: "#F4F8FF",
    fontFamily: monoFont,
    fontSize: 19,
    fontWeight: "900",
  },
  dashboardStatLabel: {
    color: "#75859A",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  currentProjectName: {
    color: "#F5F8FD",
    fontSize: 17,
    fontWeight: "900",
  },
  currentProjectCompany: {
    marginTop: -7,
    color: "#5AB9FF",
    fontSize: 9,
    fontWeight: "700",
  },
  projectDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  projectDetail: {
    minWidth: "46%",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  projectDetailValue: {
    marginTop: 1,
    color: "#DCE5F1",
    fontSize: 9,
    fontWeight: "700",
  },
  inlineAction: {
    alignSelf: "flex-start",
    minHeight: 36,
    marginTop: 2,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(89,184,255,0.38)",
    backgroundColor: "rgba(49,159,255,0.12)",
  },
  inlineActionText: {
    color: "#DCEEFF",
    fontFamily: monoFont,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  syncRow: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  syncText: {
    color: "#8999AD",
    fontSize: 8,
    fontWeight: "700",
  },
  documentSummary: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.28)",
    backgroundColor: "rgba(15,72,120,0.22)",
  },
  documentProgressBadge: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#319FFF",
    backgroundColor: "rgba(49,159,255,0.1)",
  },
  documentProgressValue: {
    color: "#FFFFFF",
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: "900",
  },
  documentProgressLabel: {
    color: "#6ABFFF",
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  documentSummaryCopy: {
    flex: 1,
    gap: 4,
  },
  documentSummaryTitle: {
    color: "#F2F7FE",
    fontSize: 13,
    fontWeight: "900",
  },
  documentSummaryText: {
    color: "#8999AD",
    fontSize: 8,
    lineHeight: 12,
  },
  documentTrack: {
    height: 4,
    marginTop: 4,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  documentFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#319FFF",
  },
  documentRow: {
    minHeight: 58,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  documentIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(49,159,255,0.11)",
  },
  documentCopy: {
    flex: 1,
  },
  documentTitle: {
    color: "#ECF3FC",
    fontSize: 9,
    fontWeight: "800",
  },
  documentCategory: {
    marginTop: 2,
    color: "#718198",
    fontSize: 7,
  },
  documentExpiry: {
    marginTop: 2,
    color: "#98A6B8",
    fontSize: 7,
  },
  documentStatus: {
    alignItems: "center",
    gap: 2,
  },
  documentStatusText: {
    fontSize: 6,
    fontWeight: "900",
  },
  messageSummary: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.28)",
    backgroundColor: "rgba(15,72,120,0.22)",
  },
  messageSummaryValue: {
    color: "#FFFFFF",
    fontFamily: monoFont,
    fontSize: 25,
    fontWeight: "900",
  },
  messageSummaryLabel: {
    color: "#6ABFFF",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },
  messageSummaryIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(49,159,255,0.12)",
  },
  messageRow: {
    minHeight: 68,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.45)",
    backgroundColor: "rgba(49,159,255,0.14)",
  },
  avatarText: {
    color: "#DDEEFF",
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "900",
  },
  onlineIndicator: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#08111E",
    backgroundColor: "#52D89A",
  },
  onlineIndicatorOffline: {
    backgroundColor: "#5C6879",
  },
  messageCopy: {
    flex: 1,
  },
  messageHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
  },
  messageSender: {
    flex: 1,
    color: "#EEF4FC",
    fontSize: 9,
    fontWeight: "900",
  },
  messageTime: {
    color: "#718198",
    fontSize: 7,
  },
  messageRole: {
    marginTop: 1,
    color: "#4EABF5",
    fontSize: 7,
    fontWeight: "700",
  },
  messagePreview: {
    marginTop: 3,
    color: "#A8B5C6",
    fontSize: 8,
    lineHeight: 11,
  },
  unreadBadge: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#268FE5",
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  quickContacts: {
    flexDirection: "row",
    gap: 7,
  },
  quickContact: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.18)",
    backgroundColor: "rgba(49,159,255,0.065)",
  },
  quickContactText: {
    color: "#AFC0D4",
    fontSize: 7,
    fontWeight: "800",
  },
  menuDock: {
    position: "absolute",
    left: 12,
    right: 12,
    alignItems: "center",
  },
  sectionMenu: {
    width: "100%",
    maxWidth: 920,
    height: 72,
    padding: 6,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(91,177,255,0.28)",
    backgroundColor: "rgba(3,8,16,0.92)",
    shadowColor: "#000000",
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  menuItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 18,
  },
  menuItemActive: {
    backgroundColor: "rgba(39,145,232,0.12)",
  },
  menuLabel: {
    color: "#728096",
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.45,
  },
  menuLabelCompact: {
    fontSize: 8,
    letterSpacing: 0.9,
  },
  menuLabelActive: {
    color: "#DCEEFF",
  },
  menuIndicator: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  menuIndicatorActive: {
    width: 34,
    backgroundColor: "#319FFF",
    shadowColor: "#319FFF",
    shadowOpacity: 0.9,
    shadowRadius: 7,
  },
  pressed: {
    opacity: 0.62,
  },
});
