import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";
import type { DemoDocument, Project } from "@/src/demo/types";

import {
  Button,
  Card,
  EmptyState,
  ModalPanel,
  SectionTitle,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type Tab = "documents" | "contracts" | "certificates" | "bestProjects";
type DocumentsMode = "archive" | "certificates" | "bestProjects";
type DocumentScope = "workers" | "projects" | "company";

type ViewerItem = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  meta: string[];
};

function projectFallbackDocuments(project: Project): DemoDocument[] {
  const slug = project.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);

  return [
    {
      id: `doc-${project.id}-safety`,
      owner_type: "project",
      owner_id: project.id,
      title: "Plano de Segurança e Saúde",
      category: "safety",
      file_name: `pss_${slug}.pdf`,
      status: "valid",
      updated_at: `${project.start_date}T08:00:00Z`,
      demo_content: `Plano de Segurança e Saúde de demonstração para ${project.name}. Inclui organização preventiva, regras de acesso, riscos principais e medidas de controlo da obra.`,
    },
    {
      id: `doc-${project.id}-drawings`,
      owner_type: "project",
      owner_id: project.id,
      title: "Desenhos e peças de montagem",
      category: "technical",
      file_name: `desenhos_${slug}.pdf`,
      status: "valid",
      updated_at: `${project.start_date}T08:30:00Z`,
      demo_content: `Conjunto técnico de demonstração associado a ${project.name}: implantação, referências de montagem, zonas de intervenção e notas de execução.`,
    },
    {
      id: `doc-${project.id}-schedule`,
      owner_type: "project",
      owner_id: project.id,
      title: "Planeamento e cronograma",
      category: "planning",
      file_name: `cronograma_${slug}.pdf`,
      status: project.status === "completed" ? "valid" : "active",
      updated_at: `${project.start_date}T09:00:00Z`,
      demo_content: `Planeamento de demonstração da obra ${project.name}, com período ${project.start_date} a ${project.end_date}, horário ${project.schedule} e progresso atual de ${project.progress}%.`,
    },
  ];
}

function projectDocuments(project: Project): DemoDocument[] {
  return project.documents?.length ? project.documents : projectFallbackDocuments(project);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function categoryLabel(category: string, language: "pt" | "en") {
  const labels: Record<string, [string, string]> = {
    identity: ["Identificação", "Identity"],
    insurance: ["Seguro", "Insurance"],
    medical: ["Saúde", "Medical"],
    safety: ["Segurança", "Safety"],
    technical: ["Técnico", "Technical"],
    planning: ["Planeamento", "Planning"],
    legal: ["Legal", "Legal"],
    license: ["Licença", "License"],
  };
  const item = labels[category];
  return item ? item[language === "pt" ? 0 : 1] : category;
}

export function DocumentsView({ mode = "archive" }: { mode?: DocumentsMode }) {
  const { user } = useAuth();
  const { state, language } = useWorklyData();
  const { width } = useWindowDimensions();
  const initialTab: Tab = mode === "archive" ? "documents" : mode;
  const [tab, setTab] = useState<Tab>(() => initialTab);
  const [scope, setScope] = useState<DocumentScope>("workers");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [viewer, setViewer] = useState<ViewerItem | null>(null);

  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const t = copy[language];
  const compact = width < 760;
  const splitCompact = width < 1040;

  const workerIds = useMemo(() => {
    if (!state || !user) return new Set<string>();
    if (user.role === "worker") return new Set([user.id]);
    const companyId = user.company_id ?? user.id;
    const projectWorkerIds = state.projects
      .filter((project) => project.company_id === companyId)
      .flatMap((project) => project.worker_ids);
    return new Set([
      ...state.workers
        .filter((worker) => worker.company_id === companyId)
        .map((worker) => worker.id),
      ...projectWorkerIds,
    ]);
  }, [state, user]);

  if (!state || !user) return null;

  const ownCompanyId = user.company_id ?? user.id;
  const relevantWorkers = state.workers.filter((worker) => workerIds.has(worker.id));
  const relevantProjects = state.projects.filter((project) =>
    user.role === "worker"
      ? project.worker_ids.includes(user.id)
      : project.company_id === ownCompanyId,
  );
  const company = state.companies.find((item) => item.id === ownCompanyId);

  const workerDocuments = relevantWorkers.flatMap((worker) =>
    worker.documents.map((document) => ({
      ...document,
      ownerName: worker.name,
    })),
  );
  const projectDocumentCount = relevantProjects.reduce(
    (total, project) => total + projectDocuments(project).length,
    0,
  );
  const companyDocuments = user.role === "company" ? company?.documents ?? [] : [];
  const documentsCount =
    workerDocuments.length + projectDocumentCount + companyDocuments.length;

  const contracts = state.contracts.filter((contract) =>
    user.role === "worker"
      ? contract.worker_id === user.id
      : contract.company_id === ownCompanyId,
  );
  const certificates = relevantWorkers.flatMap((worker) =>
    worker.certificates.map((certificate) => ({
      ...certificate,
      workerId: worker.id,
      workerName: worker.name,
    })),
  );
  const projects = relevantWorkers.flatMap((worker) =>
    worker.best_projects.map((project) => ({
      ...project,
      workerId: worker.id,
      workerName: worker.name,
    })),
  );

  const tabs: {
    id: Tab;
    label: string;
    count: number;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }[] = [
    {
      id: "documents",
      label: t.documents,
      count: documentsCount,
      icon: "folder-open-outline",
    },
    {
      id: "contracts",
      label: t.contracts,
      count: contracts.length,
      icon: "document-text-outline",
    },
    {
      id: "certificates",
      label: t.certificates,
      count: certificates.length,
      icon: "ribbon-outline",
    },
    {
      id: "bestProjects",
      label: t.bestProjects,
      count: projects.length,
      icon: "trophy-outline",
    },
  ];

  const visibleTabs =
    mode === "archive"
      ? user.role === "worker"
        ? tabs.filter((item) => item.id === "documents" || item.id === "contracts")
        : tabs
      : [];

  const sectionTitle =
    tab === "contracts"
      ? t.contracts
      : tab === "certificates"
        ? t.certificates
        : tab === "bestProjects"
          ? t.bestProjects
          : t.documents;

  const sectionDescription =
    tab === "documents"
      ? language === "pt"
        ? "Arquivo organizado por trabalhador e por obra, com acesso imediato a cada documento."
        : "Archive organised by worker and project, with immediate access to every document."
      : tab === "certificates"
        ? language === "pt"
          ? "Certificações profissionais válidas e prontas a consultar."
          : "Valid professional certifications ready to view."
        : tab === "bestProjects"
          ? language === "pt"
            ? "Portefólio de trabalhos verificados e resultados em obra."
            : "A portfolio of verified work and on-site results."
          : language === "pt"
            ? "Contratos ligados a trabalhadores, empresas e obras."
            : "Contracts linked to workers, companies and projects.";

  const normalizedQuery = query.trim().toLowerCase();
  const visibleWorkers = relevantWorkers.filter((worker) =>
    normalizedQuery
      ? `${worker.name} ${worker.profession} ${worker.location}`
          .toLowerCase()
          .includes(normalizedQuery)
      : true,
  );
  const visibleProjects = relevantProjects.filter((project) =>
    normalizedQuery
      ? `${project.name} ${project.client} ${project.location}`
          .toLowerCase()
          .includes(normalizedQuery)
      : true,
  );
  const activeWorker =
    relevantWorkers.find((worker) => worker.id === selectedWorkerId) ??
    visibleWorkers[0] ??
    relevantWorkers[0];
  const activeProject =
    relevantProjects.find((project) => project.id === selectedProjectId) ??
    visibleProjects[0] ??
    relevantProjects[0];

  const scopes: {
    id: DocumentScope;
    label: string;
    subtitle: string;
    count: number;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }[] = [
    {
      id: "workers",
      label:
        user.role === "worker"
          ? language === "pt"
            ? "Pessoais"
            : "Personal"
          : language === "pt"
            ? "Trabalhadores"
            : "Workers",
      subtitle:
        user.role === "worker"
          ? language === "pt"
            ? "Os teus documentos"
            : "Your documents"
          : language === "pt"
            ? `${relevantWorkers.length} trabalhadores`
            : `${relevantWorkers.length} workers`,
      count: workerDocuments.length,
      icon: "people-outline",
    },
    {
      id: "projects",
      label: language === "pt" ? "Obras" : "Projects",
      subtitle:
        language === "pt"
          ? `${relevantProjects.length} obras`
          : `${relevantProjects.length} projects`,
      count: projectDocumentCount,
      icon: "business-outline",
    },
    ...(user.role === "company"
      ? [
          {
            id: "company" as const,
            label: language === "pt" ? "Empresa" : "Company",
            subtitle:
              language === "pt" ? "Arquivo legal" : "Legal archive",
            count: companyDocuments.length,
            icon: "briefcase-outline" as const,
          },
        ]
      : []),
  ];

  const openDocument = (document: DemoDocument, ownerName: string) => {
    setViewer({
      id: document.id,
      title: document.title,
      subtitle: document.file_name,
      content: document.demo_content,
      icon: "document-text-outline",
      meta: [
        ownerName,
        categoryLabel(document.category, language),
        `${language === "pt" ? "Atualizado" : "Updated"} ${document.updated_at.slice(0, 10)}`,
      ],
    });
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, compact ? styles.headerCompact : null]}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>{sectionTitle}</Text>
          <Text style={sharedStyles.subtitle}>{sectionDescription}</Text>
        </View>
        <View style={styles.securityBadge}>
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color={workspaceColors.green}
          />
          <Text style={styles.securityText}>
            {language === "pt" ? "Arquivo protegido" : "Protected archive"}
          </Text>
        </View>
      </View>

      {visibleTabs.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={[
            styles.tabs,
            compact ? { paddingHorizontal: 14 } : null,
          ]}
        >
          {visibleTabs.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setTab(item.id);
                  setQuery("");
                }}
                style={[
                  styles.tab,
                  active
                    ? { borderColor: `${accent}88`, backgroundColor: `${accent}18` }
                    : null,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={17}
                  color={active ? accent : workspaceColors.muted}
                />
                <Text style={[styles.tabText, active ? { color: accent } : null]}>
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.tabCount,
                    active ? { backgroundColor: `${accent}25` } : null,
                  ]}
                >
                  <Text style={styles.tabCountText}>{item.count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          compact ? styles.contentCompact : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "documents" ? (
          <View style={{ gap: 14 }}>
            <View style={styles.scopeGrid}>
              {scopes.map((item) => {
                const active = scope === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setScope(item.id);
                      setQuery("");
                    }}
                    style={({ pressed }) => [
                      styles.scopeCard,
                      active
                        ? {
                            borderColor: `${accent}88`,
                            backgroundColor: `${accent}12`,
                          }
                        : null,
                      pressed ? { opacity: 0.75 } : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.scopeIcon,
                        { backgroundColor: active ? `${accent}20` : workspaceColors.panelStrong },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={23}
                        color={active ? accent : workspaceColors.textSoft}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, active ? { color: accent } : null]}>
                        {item.label}
                      </Text>
                      <Text style={styles.scopeSubtitle}>{item.subtitle}</Text>
                    </View>
                    <View style={[styles.scopeCount, active ? { borderColor: `${accent}55` } : null]}>
                      <Text style={styles.scopeCountText}>{item.count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {scope !== "company" ? (
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color={workspaceColors.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={
                    scope === "workers"
                      ? language === "pt"
                        ? "Procurar trabalhador..."
                        : "Search worker..."
                      : language === "pt"
                        ? "Procurar obra..."
                        : "Search project..."
                  }
                  placeholderTextColor={workspaceColors.muted}
                  style={styles.searchInput}
                />
                {query ? (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={workspaceColors.muted} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {scope === "workers" ? (
              <View style={[styles.archiveSplit, splitCompact ? styles.archiveSplitCompact : null]}>
                <Card style={[styles.folderPane, splitCompact ? styles.folderPaneCompact : null]}>
                  <SectionTitle
                    title={
                      user.role === "worker"
                        ? language === "pt"
                          ? "Pasta pessoal"
                          : "Personal folder"
                        : language === "pt"
                          ? "Trabalhadores"
                          : "Workers"
                    }
                    subtitle={
                      language === "pt"
                        ? "Seleciona uma pasta para ver apenas os documentos desse trabalhador."
                        : "Select a folder to see only that worker's documents."
                    }
                  />
                  <View style={styles.folderList}>
                    {visibleWorkers.length ? (
                      visibleWorkers.map((worker) => {
                        const active = activeWorker?.id === worker.id;
                        return (
                          <Pressable
                            key={worker.id}
                            onPress={() => setSelectedWorkerId(worker.id)}
                            style={({ pressed }) => [
                              styles.folderRow,
                              active
                                ? {
                                    borderColor: `${accent}66`,
                                    backgroundColor: `${accent}10`,
                                  }
                                : null,
                              pressed ? { opacity: 0.7 } : null,
                            ]}
                          >
                            <View style={[styles.avatar, { borderColor: active ? accent : workspaceColors.line }]}>
                              <Text style={[styles.avatarText, active ? { color: accent } : null]}>
                                {initials(worker.name)}
                              </Text>
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text numberOfLines={1} style={styles.folderTitle}>
                                {worker.name}
                              </Text>
                              <Text numberOfLines={1} style={styles.folderSubtitle}>
                                {worker.profession}
                              </Text>
                            </View>
                            <View style={styles.folderCounter}>
                              <Text style={styles.folderCounterText}>{worker.documents.length}</Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={active ? accent : workspaceColors.muted}
                            />
                          </Pressable>
                        );
                      })
                    ) : (
                      <EmptyState
                        icon="people-outline"
                        title={language === "pt" ? "Sem resultados" : "No results"}
                      />
                    )}
                  </View>
                </Card>

                <Card style={styles.detailPane}>
                  {activeWorker ? (
                    <>
                      <EntityHeader
                        icon="person-outline"
                        title={activeWorker.name}
                        subtitle={`${activeWorker.profession} · ${activeWorker.location}`}
                        accent={accent}
                        stats={[
                          {
                            label: language === "pt" ? "Documentos" : "Documents",
                            value: activeWorker.documents.length,
                          },
                          {
                            label: language === "pt" ? "Certificados" : "Certificates",
                            value: activeWorker.certificates.length,
                          },
                          {
                            label: language === "pt" ? "Contratos" : "Contracts",
                            value: contracts.filter((item) => item.worker_id === activeWorker.id).length,
                          },
                        ]}
                      />
                      <View style={styles.documentList}>
                        {activeWorker.documents.length ? (
                          activeWorker.documents.map((document) => (
                            <ArchiveRow
                              key={document.id}
                              icon="document-text-outline"
                              title={document.title}
                              subtitle={`${categoryLabel(document.category, language)} · ${document.file_name}`}
                              status={document.status}
                              accent={accent}
                              language={language}
                              onPress={() => openDocument(document, activeWorker.name)}
                            />
                          ))
                        ) : (
                          <EmptyState
                            icon="folder-open-outline"
                            title={language === "pt" ? "Pasta vazia" : "Empty folder"}
                          />
                        )}
                      </View>
                    </>
                  ) : (
                    <EmptyState
                      icon="person-outline"
                      title={language === "pt" ? "Sem trabalhadores" : "No workers"}
                    />
                  )}
                </Card>
              </View>
            ) : null}

            {scope === "projects" ? (
              <View style={[styles.archiveSplit, splitCompact ? styles.archiveSplitCompact : null]}>
                <Card style={[styles.folderPane, splitCompact ? styles.folderPaneCompact : null]}>
                  <SectionTitle
                    title={language === "pt" ? "Obras" : "Projects"}
                    subtitle={
                      language === "pt"
                        ? "Cada obra possui o seu próprio arquivo técnico."
                        : "Each project has its own technical archive."
                    }
                  />
                  <View style={styles.folderList}>
                    {visibleProjects.length ? (
                      visibleProjects.map((project) => {
                        const active = activeProject?.id === project.id;
                        const docs = projectDocuments(project);
                        return (
                          <Pressable
                            key={project.id}
                            onPress={() => setSelectedProjectId(project.id)}
                            style={({ pressed }) => [
                              styles.folderRow,
                              active
                                ? {
                                    borderColor: `${accent}66`,
                                    backgroundColor: `${accent}10`,
                                  }
                                : null,
                              pressed ? { opacity: 0.7 } : null,
                            ]}
                          >
                            <View style={[styles.projectIcon, { borderColor: active ? accent : workspaceColors.line }]}>
                              <Ionicons
                                name="business-outline"
                                size={19}
                                color={active ? accent : workspaceColors.textSoft}
                              />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text numberOfLines={1} style={styles.folderTitle}>
                                {project.name}
                              </Text>
                              <Text numberOfLines={1} style={styles.folderSubtitle}>
                                {project.location} · {project.progress}%
                              </Text>
                            </View>
                            <View style={styles.folderCounter}>
                              <Text style={styles.folderCounterText}>{docs.length}</Text>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={active ? accent : workspaceColors.muted}
                            />
                          </Pressable>
                        );
                      })
                    ) : (
                      <EmptyState
                        icon="business-outline"
                        title={language === "pt" ? "Sem resultados" : "No results"}
                      />
                    )}
                  </View>
                </Card>

                <Card style={styles.detailPane}>
                  {activeProject ? (
                    <>
                      <EntityHeader
                        icon="business-outline"
                        title={activeProject.name}
                        subtitle={`${activeProject.client} · ${activeProject.location}`}
                        accent={accent}
                        stats={[
                          {
                            label: language === "pt" ? "Documentos" : "Documents",
                            value: projectDocuments(activeProject).length,
                          },
                          {
                            label: language === "pt" ? "Trabalhadores" : "Workers",
                            value: activeProject.worker_ids.length,
                          },
                          {
                            label: language === "pt" ? "Progresso" : "Progress",
                            value: `${activeProject.progress}%`,
                          },
                        ]}
                      />
                      <View style={styles.documentList}>
                        {projectDocuments(activeProject).map((document) => (
                          <ArchiveRow
                            key={document.id}
                            icon={
                              document.category === "safety"
                                ? "shield-checkmark-outline"
                                : document.category === "planning"
                                  ? "calendar-outline"
                                  : "construct-outline"
                            }
                            title={document.title}
                            subtitle={`${categoryLabel(document.category, language)} · ${document.file_name}`}
                            status={document.status}
                            accent={accent}
                            language={language}
                            onPress={() => openDocument(document, activeProject.name)}
                          />
                        ))}
                      </View>

                      <View style={styles.linkedSection}>
                        <Text style={styles.linkedTitle}>
                          {language === "pt" ? "Contratos ligados à obra" : "Contracts linked to project"}
                        </Text>
                        {contracts.filter((item) => item.project_id === activeProject.id).length ? (
                          contracts
                            .filter((item) => item.project_id === activeProject.id)
                            .map((contract) => {
                              const worker = state.workers.find((item) => item.id === contract.worker_id);
                              return (
                                <ArchiveRow
                                  key={contract.id}
                                  icon="newspaper-outline"
                                  title={contract.title}
                                  subtitle={`${worker?.name ?? "Worker"} · ${contract.file_name}`}
                                  status={contract.status}
                                  accent={workspaceColors.yellow}
                                  language={language}
                                  onPress={() =>
                                    setViewer({
                                      id: contract.id,
                                      title: contract.title,
                                      subtitle: contract.file_name,
                                      content: contract.demo_content,
                                      icon: "newspaper-outline",
                                      meta: [
                                        activeProject.name,
                                        worker?.name ?? "Worker",
                                        `${contract.start_date} → ${contract.end_date}`,
                                      ],
                                    })
                                  }
                                />
                              );
                            })
                        ) : (
                          <Text style={styles.linkedEmpty}>
                            {language === "pt"
                              ? "Ainda não existem contratos associados a esta obra."
                              : "No contracts are linked to this project yet."}
                          </Text>
                        )}
                      </View>
                    </>
                  ) : (
                    <EmptyState
                      icon="business-outline"
                      title={language === "pt" ? "Sem obras" : "No projects"}
                    />
                  )}
                </Card>
              </View>
            ) : null}

            {scope === "company" && user.role === "company" ? (
              <Card>
                <EntityHeader
                  icon="briefcase-outline"
                  title={company?.name ?? (language === "pt" ? "Empresa" : "Company")}
                  subtitle={
                    language === "pt"
                      ? "Documentos institucionais e legais da empresa"
                      : "Institutional and legal company documents"
                  }
                  accent={accent}
                  stats={[
                    {
                      label: language === "pt" ? "Documentos" : "Documents",
                      value: companyDocuments.length,
                    },
                  ]}
                />
                <View style={styles.documentList}>
                  {companyDocuments.length ? (
                    companyDocuments.map((document) => (
                      <ArchiveRow
                        key={document.id}
                        icon="document-lock-outline"
                        title={document.title}
                        subtitle={`${categoryLabel(document.category, language)} · ${document.file_name}`}
                        status={document.status}
                        accent={accent}
                        language={language}
                        onPress={() => openDocument(document, company?.name ?? "Company")}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon="folder-open-outline"
                      title={language === "pt" ? "Arquivo vazio" : "Empty archive"}
                    />
                  )}
                </View>
              </Card>
            ) : null}
          </View>
        ) : null}

        {tab === "contracts" ? (
          <ArchiveSection title={t.contracts} empty={contracts.length === 0} language={language}>
            {contracts.map((contract) => {
              const worker = state.workers.find((item) => item.id === contract.worker_id);
              const companyItem = state.companies.find((item) => item.id === contract.company_id);
              const project = state.projects.find((item) => item.id === contract.project_id);
              return (
                <ArchiveRow
                  key={contract.id}
                  icon="newspaper-outline"
                  title={contract.title}
                  subtitle={`${worker?.name ?? "Worker"} · ${project?.name ?? companyItem?.name ?? "Company"}`}
                  status={contract.status}
                  accent={accent}
                  language={language}
                  onPress={() =>
                    setViewer({
                      id: contract.id,
                      title: contract.title,
                      subtitle: contract.file_name,
                      content: contract.demo_content,
                      icon: "newspaper-outline",
                      meta: [
                        project?.name ?? companyItem?.name ?? "Company",
                        `${contract.start_date} → ${contract.end_date}`,
                        contract.signed_worker && contract.signed_company
                          ? language === "pt"
                            ? "Assinado por ambas as partes"
                            : "Signed by both parties"
                          : language === "pt"
                            ? "Assinatura pendente"
                            : "Signature pending",
                      ],
                    })
                  }
                />
              );
            })}
          </ArchiveSection>
        ) : null}

        {tab === "certificates" ? (
          <ArchiveSection title={t.certificates} empty={certificates.length === 0} language={language}>
            {certificates.map((certificate) => (
              <ArchiveRow
                key={`${certificate.workerId}-${certificate.id}`}
                icon="ribbon-outline"
                title={certificate.name}
                subtitle={`${certificate.workerName} · ${certificate.issuer}`}
                status={certificate.status}
                accent={workspaceColors.yellow}
                language={language}
                onPress={() =>
                  setViewer({
                    id: certificate.id,
                    title: certificate.name,
                    subtitle: certificate.file_name,
                    content:
                      language === "pt"
                        ? `Certificado fictício emitido por ${certificate.issuer}, consultável para demonstrar a validação documental WORKLY.`
                        : `Fictitious certificate issued by ${certificate.issuer}, viewable to demonstrate WORKLY document validation.`,
                    icon: "ribbon-outline",
                    meta: [
                      certificate.workerName,
                      `${language === "pt" ? "Válido até" : "Valid until"} ${certificate.expires_at}`,
                    ],
                  })
                }
              />
            ))}
          </ArchiveSection>
        ) : null}

        {tab === "bestProjects" ? (
          <View style={styles.portfolioGrid}>
            {projects.length ? (
              projects.map((project) => (
                <Pressable
                  key={`${project.workerId}-${project.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${project.title}, ${project.workerName}`}
                  onPress={() =>
                    setViewer({
                      id: project.id,
                      title: project.title,
                      subtitle: `${project.location} · ${project.year}`,
                      content: project.summary,
                      icon: "trophy-outline",
                      meta: [project.workerName],
                    })
                  }
                  style={({ pressed }) => [styles.portfolioCard, pressed ? { opacity: 0.72 } : null]}
                >
                  <View style={[styles.portfolioIcon, { backgroundColor: `${accent}18` }]}>
                    <Ionicons name="construct-outline" size={25} color={accent} />
                  </View>
                  <Text style={styles.portfolioTitle}>{project.title}</Text>
                  <Text style={styles.rowSubtitle}>{project.workerName}</Text>
                  <Text style={styles.rowSubtitle}>
                    {project.location} · {project.year}
                  </Text>
                  <Text style={[styles.openText, { color: accent }]}>
                    {language === "pt" ? "Ver projeto" : "View project"} →
                  </Text>
                </Pressable>
              ))
            ) : (
              <Card style={{ width: "100%" }}>
                <EmptyState
                  icon="trophy-outline"
                  title={language === "pt" ? "Sem projetos em destaque" : "No featured projects"}
                />
              </Card>
            )}
          </View>
        ) : null}
      </ScrollView>

      <ModalPanel
        visible={Boolean(viewer)}
        onClose={() => setViewer(null)}
        title={viewer?.title ?? ""}
        subtitle={viewer?.subtitle}
        footer={<Button label={t.close} variant="secondary" onPress={() => setViewer(null)} />}
      >
        <View style={styles.viewer}>
          <View style={[styles.viewerIcon, { borderColor: `${accent}66` }]}>
            <Ionicons name={viewer?.icon ?? "document-outline"} size={38} color={accent} />
          </View>
          <Text style={styles.viewerTitle}>{viewer?.title}</Text>
          <Text style={sharedStyles.body}>{viewer?.content}</Text>
          <View style={styles.viewerMeta}>
            {viewer?.meta.map((item) => (
              <View key={item} style={styles.metaPill}>
                <Text style={styles.metaPillText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.demoNotice}>
            <Ionicons name="information-circle-outline" size={18} color={workspaceColors.yellow} />
            <Text style={styles.demoNoticeText}>
              {language === "pt"
                ? "Conteúdo fictício criado exclusivamente para a demonstração WORKLY. Sem validade legal."
                : "Fictitious content created exclusively for the WORKLY demo. No legal validity."}
            </Text>
          </View>
        </View>
      </ModalPanel>
    </View>
  );
}

function EntityHeader({
  icon,
  title,
  subtitle,
  accent,
  stats,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  accent: string;
  stats: { label: string; value: string | number }[];
}) {
  return (
    <View style={styles.entityHeader}>
      <View style={[styles.entityIcon, { borderColor: `${accent}55`, backgroundColor: `${accent}10` }]}>
        <Ionicons name={icon} size={25} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 180 }}>
        <Text style={styles.entityTitle}>{title}</Text>
        <Text style={styles.entitySubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.entityStats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.entityStat}>
            <Text style={styles.entityStatValue}>{stat.value}</Text>
            <Text style={styles.entityStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ArchiveSection({
  title,
  empty,
  language,
  children,
}: {
  title: string;
  empty: boolean;
  language: "pt" | "en";
  children: React.ReactNode;
}) {
  return (
    <Card>
      <SectionTitle
        title={title}
        subtitle={
          language === "pt" ? "Seleciona um item para consultar." : "Select an item to view it."
        }
      />
      <View style={{ gap: 9, marginTop: 15 }}>
        {empty ? (
          <EmptyState
            icon="folder-open-outline"
            title={language === "pt" ? "Arquivo vazio" : "Empty archive"}
          />
        ) : (
          children
        )}
      </View>
    </Card>
  );
}

function ArchiveRow({
  icon,
  title,
  subtitle,
  status,
  accent,
  language,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  status: string;
  accent: string;
  language: "pt" | "en";
  onPress: () => void;
}) {
  const isGood = status === "valid" || status === "active";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.archiveRow, pressed ? { opacity: 0.68 } : null]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${accent}16` }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 170 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: isGood ? `${workspaceColors.green}12` : `${workspaceColors.yellow}12`,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: isGood ? workspaceColors.green : workspaceColors.yellow },
          ]}
        >
          {status === "valid"
            ? language === "pt"
              ? "Válido"
              : "Valid"
            : status === "active"
              ? language === "pt"
                ? "Ativo"
                : "Active"
              : status === "expired"
                ? language === "pt"
                  ? "Expirado"
                  : "Expired"
                : language === "pt"
                  ? "Pendente"
                  : "Pending"}
        </Text>
      </View>
      <View style={styles.openAction}>
        <Text style={[styles.openText, { color: accent }]}>
          {language === "pt" ? "Consultar" : "Open"}
        </Text>
        <Ionicons name="open-outline" size={14} color={accent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: workspaceColors.background,
  },
  header: {
    padding: 24,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },
  headerCompact: {
    padding: 14,
    flexDirection: "column",
    alignItems: "stretch",
  },
  securityBadge: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: `${workspaceColors.green}44`,
    backgroundColor: `${workspaceColors.green}0C`,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  securityText: {
    color: workspaceColors.green,
    fontSize: 10,
    fontWeight: "700",
  },
  tabs: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    gap: 8,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },
  tab: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panel,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  tabText: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  tabCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  tabCountText: {
    color: workspaceColors.textSoft,
    fontSize: 9,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },
  contentCompact: {
    paddingHorizontal: 14,
    paddingBottom: 100,
  },
  scopeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  scopeCard: {
    minWidth: 220,
    flexGrow: 1,
    flexBasis: 250,
    minHeight: 84,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panel,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  scopeIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeTitle: {
    color: workspaceColors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  scopeSubtitle: {
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },
  scopeCount: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeCountText: {
    color: workspaceColors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  searchBox: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panel,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  searchInput: {
    flex: 1,
    color: workspaceColors.text,
    fontSize: 11,
    paddingVertical: 9,
    outlineStyle: "none",
  },
  archiveSplit: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  archiveSplitCompact: {
    flexDirection: "column",
  },
  folderPane: {
    flexBasis: 345,
    maxWidth: 380,
    minWidth: 300,
  },
  folderPaneCompact: {
    maxWidth: undefined,
    minWidth: undefined,
    flexBasis: "auto",
  },
  detailPane: {
    flex: 1,
    minWidth: 0,
  },
  folderList: {
    gap: 8,
    marginTop: 15,
  },
  folderRow: {
    minHeight: 64,
    padding: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    fontWeight: "800",
  },
  projectIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  folderTitle: {
    color: workspaceColors.text,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  folderSubtitle: {
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 14,
  },
  folderCounter: {
    minWidth: 26,
    height: 26,
    borderRadius: 8,
    paddingHorizontal: 5,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  folderCounterText: {
    color: workspaceColors.textSoft,
    fontSize: 9,
    fontWeight: "800",
  },
  entityHeader: {
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: workspaceColors.line,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  entityIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  entityTitle: {
    color: workspaceColors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  entitySubtitle: {
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  entityStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  entityStat: {
    minWidth: 72,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  entityStatValue: {
    color: workspaceColors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  entityStatLabel: {
    color: workspaceColors.muted,
    fontSize: 8,
    marginTop: 2,
  },
  documentList: {
    gap: 9,
  },
  archiveRow: {
    minHeight: 64,
    padding: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    color: workspaceColors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  statusBadge: {
    minHeight: 26,
    borderRadius: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
  },
  openAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openText: {
    fontSize: 10,
    fontWeight: "700",
  },
  linkedSection: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: workspaceColors.line,
    gap: 9,
  },
  linkedTitle: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    fontWeight: "800",
  },
  linkedEmpty: {
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 16,
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  portfolioCard: {
    flexGrow: 1,
    flexBasis: 270,
    maxWidth: 430,
    minWidth: 250,
    minHeight: 180,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panel,
    padding: 16,
    gap: 8,
  },
  portfolioIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  portfolioTitle: {
    color: workspaceColors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  viewer: {
    alignItems: "center",
    gap: 13,
    paddingVertical: 16,
  },
  viewerIcon: {
    width: 78,
    height: 78,
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerTitle: {
    color: workspaceColors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  viewerMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 7,
  },
  metaPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  metaPillText: {
    color: workspaceColors.textSoft,
    fontSize: 9,
    fontWeight: "600",
  },
  demoNotice: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: `${workspaceColors.yellow}44`,
    borderRadius: 12,
    padding: 11,
    backgroundColor: `${workspaceColors.yellow}0E`,
  },
  demoNoticeText: {
    flex: 1,
    color: workspaceColors.textSoft,
    fontSize: 10,
    lineHeight: 16,
  },
});