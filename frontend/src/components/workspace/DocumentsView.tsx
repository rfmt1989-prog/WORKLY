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

type ViewerItem = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  meta: string[];
};

export function DocumentsView() {
  const { user } = useAuth();
  const { state, language } = useWorklyData();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>("documents");
  const [viewer, setViewer] = useState<ViewerItem | null>(null);
  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const t = copy[language];
  const compact = width < 700;

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
  const relevantWorkers = state.workers.filter((worker) =>
    workerIds.has(worker.id),
  );
  const documents =
    user.role === "worker"
      ? relevantWorkers.flatMap((worker) =>
          worker.documents.map((document) => ({
            ...document,
            ownerName: worker.name,
          })),
        )
      : [
          ...state.companies
            .filter((company) => company.id === ownCompanyId)
            .flatMap((company) =>
              company.documents.map((document) => ({
                ...document,
                ownerName: company.name,
              })),
            ),
          ...relevantWorkers.flatMap((worker) =>
            worker.documents.map((document) => ({
              ...document,
              ownerName: worker.name,
            })),
          ),
        ];
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

  const tabs: { id: Tab; label: string; count: number; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
    { id: "documents", label: t.documents, count: documents.length, icon: "folder-open-outline" },
    { id: "contracts", label: t.contracts, count: contracts.length, icon: "document-text-outline" },
    { id: "certificates", label: t.certificates, count: certificates.length, icon: "ribbon-outline" },
    { id: "bestProjects", label: t.bestProjects, count: projects.length, icon: "trophy-outline" },
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.header, compact ? styles.headerCompact : null]}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>{t.documents}</Text>
          <Text style={sharedStyles.subtitle}>
            {language === "pt"
              ? "Arquivo consultável, organizado e sem botões vazios."
              : "A viewable, organised archive with no dead actions."}
          </Text>
        </View>
        <View style={styles.securityBadge}>
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color={workspaceColors.green}
          />
          <Text style={styles.securityText}>
            {language === "pt" ? "Dados demo protegidos" : "Protected demo data"}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={[
          styles.tabs,
          compact ? { paddingHorizontal: 14 } : null,
        ]}
      >
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
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
              <View style={[styles.tabCount, active ? { backgroundColor: `${accent}25` } : null]}>
                <Text style={styles.tabCountText}>{item.count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          compact ? styles.contentCompact : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "documents" ? (
          <ArchiveSection
            title={t.documents}
            empty={documents.length === 0}
            language={language}
          >
            {documents.map((document) => (
              <ArchiveRow
                key={document.id}
                icon="document-text-outline"
                title={document.title}
                subtitle={`${document.ownerName} · ${document.file_name}`}
                status={document.status}
                accent={accent}
                language={language}
                onPress={() =>
                  setViewer({
                    id: document.id,
                    title: document.title,
                    subtitle: document.file_name,
                    content: document.demo_content,
                    icon: "document-text-outline",
                    meta: [
                      document.ownerName,
                      `${language === "pt" ? "Atualizado" : "Updated"} ${document.updated_at.slice(0, 10)}`,
                    ],
                  })
                }
              />
            ))}
          </ArchiveSection>
        ) : null}

        {tab === "contracts" ? (
          <ArchiveSection
            title={t.contracts}
            empty={contracts.length === 0}
            language={language}
          >
            {contracts.map((contract) => {
              const worker = state.workers.find(
                (item) => item.id === contract.worker_id,
              );
              const company = state.companies.find(
                (item) => item.id === contract.company_id,
              );
              return (
                <ArchiveRow
                  key={contract.id}
                  icon="newspaper-outline"
                  title={contract.title}
                  subtitle={`${worker?.name ?? "Worker"} · ${company?.name ?? "Company"}`}
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
          <ArchiveSection
            title={t.certificates}
            empty={certificates.length === 0}
            language={language}
          >
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
                  style={({ pressed }) => [
                    styles.portfolioCard,
                    pressed ? { opacity: 0.72 } : null,
                  ]}
                >
                  <View
                    style={[
                      styles.portfolioIcon,
                      { backgroundColor: `${accent}18` },
                    ]}
                  >
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
                  title={
                    language === "pt"
                      ? "Sem projetos em destaque"
                      : "No featured projects"
                  }
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
        footer={
          <Button
            label={t.close}
            variant="secondary"
            onPress={() => setViewer(null)}
          />
        }
      >
        <View style={styles.viewer}>
          <View style={[styles.viewerIcon, { borderColor: `${accent}66` }]}>
            <Ionicons
              name={viewer?.icon ?? "document-outline"}
              size={38}
              color={accent}
            />
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
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={workspaceColors.yellow}
            />
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
          language === "pt"
            ? "Seleciona um item para consultar."
            : "Select an item to view it."
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.archiveRow,
        pressed ? { opacity: 0.68 } : null,
      ]}
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
            backgroundColor:
              status === "valid" || status === "active"
                ? `${workspaceColors.green}12`
                : `${workspaceColors.yellow}12`,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color:
                status === "valid" || status === "active"
                  ? workspaceColors.green
                  : workspaceColors.yellow,
            },
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
              : language === "pt"
                ? "Pendente"
                : "Pending"}
        </Text>
      </View>
      <Text style={[styles.openText, { color: accent }]}>
        {language === "pt" ? "Consultar" : "Open"}
      </Text>
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
  archiveRow: {
    minHeight: 60,
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
  openText: {
    fontSize: 10,
    fontWeight: "700",
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

