import React, { useDeferredValue, useMemo, useState } from "react";
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
import { localizeDemoText } from "@/src/demo/localizedData";
import { uiFormat, uiText } from "@/src/demo/localizedUi";
import type { DemoDocument, Worker, WorkerStatus } from "@/src/demo/types";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  ModalPanel,
  ProgressBar,
  Score,
  SectionTitle,
  StatusPill,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type WorkerForm = {
  profession: string;
  location: string;
  phone: string;
  bio: string;
  status: WorkerStatus;
  trust_score: string;
  productivity_score: string;
};

const STATUS_FILTERS = ["all", "available", "contracted", "on_site"] as const;

export function WorkersView() {
  const { user } = useAuth();
  const {
    state,
    language,
    updateWorker,
    addTeamMember,
    assignToProject,
  } = useWorklyData();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("all");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<WorkerForm | null>(null);
  const [document, setDocument] = useState<DemoDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const t = copy[language];
  const accent = roleAccent("company");
  const compact = width < 720;

  const workers = useMemo(() => {
    if (!state) return [];
    const normalized = deferredQuery.trim().toLowerCase();
    return state.workers.filter((worker) => {
      const matchesStatus =
        statusFilter === "all" || worker.status === statusFilter;
      if (!matchesStatus) return false;
      if (!normalized) return true;
      return [
        worker.name,
        worker.profession,
        worker.location,
        worker.country,
        ...worker.skills.map((skill) => skill.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [deferredQuery, state, statusFilter]);

  const selectedWorker = state?.workers.find(
    (worker) => worker.id === selectedWorkerId,
  );
  const ownTeams =
    state?.teams.filter(
      (team) => team.company_id === (user?.company_id ?? user?.id),
    ) ?? [];
  const ownProjects =
    state?.projects.filter(
      (project) => project.company_id === (user?.company_id ?? user?.id),
    ) ?? [];

  const openWorker = (worker: Worker) => {
    setSelectedWorkerId(worker.id);
    setEditing(false);
    setForm({
      profession: worker.profession,
      location: worker.location,
      phone: worker.phone,
      bio: worker.bio,
      status: worker.status,
      trust_score: String(worker.trust_score),
      productivity_score: String(worker.productivity_score),
    });
  };

  const saveWorker = async () => {
    if (!selectedWorker || !form || busy) return;
    setBusy(true);
    try {
      await updateWorker(selectedWorker.id, {
        profession: form.profession.trim(),
        title: form.profession.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        status: form.status,
        availability: form.status === "available",
        trust_score: Math.max(0, Math.min(10, Number(form.trust_score) || 0)),
        productivity_score: Math.max(
          0,
          Math.min(10, Number(form.productivity_score) || 0),
        ),
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;

  return (
    <View style={styles.root}>
      <View style={[styles.toolbar, compact ? styles.toolbarCompact : null]}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={sharedStyles.title}>{t.workers}</Text>
          <Text style={sharedStyles.subtitle}>
            {uiText(language, "Pesquisa, perfis, certificados e atribuições.", "Search, profiles, certificates and assignments.")}
          </Text>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={workspaceColors.muted} />
          <TextInput
            testID="workers-search"
            value={query}
            onChangeText={setQuery}
            placeholder={
              uiText(language, "Nome, profissão, competência…", "Name, trade, skill…")
            }
            placeholderTextColor={workspaceColors.muted}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={uiText(language, "Limpar pesquisa", "Clear search")}
              onPress={() => setQuery("")}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={workspaceColors.muted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.filters}>
        {STATUS_FILTERS.map((status) => {
          const active = statusFilter === status;
          const label =
            status === "all"
              ? uiText(language, "Todos", "All")
              : status === "available"
                ? t.available
                : status === "contracted"
                  ? t.contracted
                  : t.onSite;
          return (
            <Pressable
              key={status}
              accessibilityRole="button"
              onPress={() => setStatusFilter(status)}
              style={[
                styles.filter,
                active
                  ? { backgroundColor: `${accent}20`, borderColor: `${accent}88` }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  active ? { color: workspaceColors.redSoft } : null,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
        <Text style={styles.resultCount}>
          {workers.length} {uiText(language, "resultados", "results")}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.grid,
          compact ? styles.gridCompact : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {workers.length ? (
          workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              language={language}
              onPress={() => openWorker(worker)}
            />
          ))
        ) : (
          <Card style={{ width: "100%" }}>
            <EmptyState
              icon="search-outline"
              title={t.noResults}
              description={
                uiText(language, "Altera os filtros ou procura outra competência.", "Change filters or search for another skill.")
              }
            />
          </Card>
        )}
      </ScrollView>

      <ModalPanel
        visible={Boolean(selectedWorker)}
        onClose={() => {
          setSelectedWorkerId(null);
          setEditing(false);
        }}
        title={selectedWorker?.name ?? ""}
        subtitle={selectedWorker?.profession}
        wide
        footer={
          editing ? (
            <>
              <Button
                label={t.cancel}
                variant="ghost"
                onPress={() => setEditing(false)}
              />
              <Button
                testID="save-worker-profile"
                label={t.save}
                icon="checkmark"
                accent={accent}
                loading={busy}
                onPress={saveWorker}
              />
            </>
          ) : (
            <Button
              label={t.edit}
              icon="create-outline"
              accent={accent}
              onPress={() => setEditing(true)}
            />
          )
        }
      >
        {selectedWorker ? (
          editing && form ? (
            <WorkerEditor form={form} setForm={setForm} language={language} />
          ) : (
            <WorkerDetails
              worker={selectedWorker}
              language={language}
              teams={ownTeams}
              projects={ownProjects}
              onDocument={setDocument}
              onAddTeam={async (teamId) => {
                setBusy(true);
                try {
                  await addTeamMember(teamId, selectedWorker.id);
                } finally {
                  setBusy(false);
                }
              }}
              onAssignProject={async (projectId) => {
                setBusy(true);
                try {
                  await assignToProject(projectId, {
                    worker_id: selectedWorker.id,
                  });
                } finally {
                  setBusy(false);
                }
              }}
            />
          )
        ) : null}
      </ModalPanel>

      <ModalPanel
        visible={Boolean(document)}
        onClose={() => setDocument(null)}
        title={localizeDemoText(language, document?.title) || t.demoDocument}
        subtitle={document?.file_name}
        footer={
          <Button
            label={t.close}
            variant="secondary"
            onPress={() => setDocument(null)}
          />
        }
      >
        <View style={styles.documentPreview}>
          <Ionicons
            name="document-text-outline"
            size={42}
            color={workspaceColors.redSoft}
          />
          <Text style={styles.documentTitle}>{localizeDemoText(language, document?.title)}</Text>
          <Text style={sharedStyles.body}>{localizeDemoText(language, document?.demo_content)}</Text>
          <View style={styles.demoNotice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={workspaceColors.yellow}
            />
            <Text style={styles.demoNoticeText}>
              {uiText(language, "Ficheiro fictício e consultável apenas para demonstrar o fluxo.", "Fictitious file available only to demonstrate the workflow.")}
            </Text>
          </View>
        </View>
      </ModalPanel>
    </View>
  );
}

function WorkerCard({
  worker,
  language,
  onPress,
}: {
  worker: Worker;
  language: import("@/src/demo/types").LanguageCode;
  onPress: () => void;
}) {
  const accent = roleAccent("company");
  const t = copy[language];
  const statusLabel =
    worker.status === "on_site"
      ? t.onSite
      : worker.status === "contracted"
        ? t.contracted
        : t.available;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${worker.name}, ${localizeDemoText(language, worker.profession)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.workerCard,
        pressed ? { opacity: 0.78, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <View style={styles.workerCardTop}>
        <Avatar
          name={worker.name}
          flag={worker.flag}
          size={54}
          accent={accent}
        />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerTrade} numberOfLines={1}>
            {localizeDemoText(language, worker.profession)}
          </Text>
          <Text style={styles.workerLocation}>
            {worker.age} · {worker.location}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={workspaceColors.muted} />
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.workerStatusRow}>
        <StatusPill status={worker.status} label={statusLabel} />
        <View style={styles.inlineScores}>
          <Text style={styles.miniScore}>
            {t.trust} <Text style={{ color: workspaceColors.text }}>{worker.trust_score}</Text>
          </Text>
          <Text style={styles.miniScore}>
            {t.productivity}{" "}
            <Text style={{ color: workspaceColors.text }}>
              {worker.productivity_score}
            </Text>
          </Text>
        </View>
      </View>
      <View style={styles.skillChips}>
        {worker.skills.slice(0, 3).map((skill) => (
          <View key={skill.name} style={styles.skillChip}>
            <Text style={styles.skillChipText}>{localizeDemoText(language, skill.name)}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function WorkerDetails({
  worker,
  language,
  teams,
  projects,
  onDocument,
  onAddTeam,
  onAssignProject,
}: {
  worker: Worker;
  language: import("@/src/demo/types").LanguageCode;
  teams: { id: string; name: string; member_ids: string[] }[];
  projects: { id: string; name: string; worker_ids: string[] }[];
  onDocument: (document: DemoDocument) => void;
  onAddTeam: (teamId: string) => void;
  onAssignProject: (projectId: string) => void;
}) {
  const t = copy[language];
  const accent = roleAccent("company");
  return (
    <View style={{ gap: 18 }}>
      <View style={styles.profileHero}>
        <Avatar name={worker.name} flag={worker.flag} size={72} accent={accent} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={styles.profileName}>{worker.name}</Text>
          <Text style={styles.profileTrade}>{localizeDemoText(language, worker.profession)}</Text>
          <Text style={sharedStyles.subtitle}>
            {worker.experience_years} {t.years} · {worker.country}
          </Text>
          <StatusPill
            status={worker.status}
            label={
              worker.status === "on_site"
                ? t.onSite
                : worker.status === "contracted"
                  ? t.contracted
                  : t.available
            }
          />
        </View>
        <Score
          value={worker.trust_score}
          label={t.trust}
          accent={accent}
          compact
        />
        <Score
          value={worker.productivity_score}
          label={t.productivity}
          accent={workspaceColors.green}
          compact
        />
      </View>

      <Text style={sharedStyles.body}>{localizeDemoText(language, worker.bio)}</Text>

      <View style={styles.detailColumns}>
        <Card style={{ flex: 1, minWidth: 250 }}>
          <SectionTitle title={uiText(language, "Competências", "Skills")} />
          <View style={{ gap: 11, marginTop: 14 }}>
            {worker.skills.map((skill) => (
              <View key={skill.name} style={{ gap: 6 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.detailLabel}>{localizeDemoText(language, skill.name)}</Text>
                  <Text style={[styles.detailValue, { color: accent }]}>
                    {skill.level}%
                  </Text>
                </View>
                <ProgressBar value={skill.level} accent={accent} />
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ flex: 1, minWidth: 250 }}>
          <SectionTitle title={t.certificates} />
          <View style={{ gap: 9, marginTop: 14 }}>
            {worker.certificates.map((certificate) => (
              <View key={certificate.id} style={styles.listRow}>
                <View style={styles.listIcon}>
                  <Ionicons
                    name="ribbon-outline"
                    size={18}
                    color={workspaceColors.yellow}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>{localizeDemoText(language, certificate.name)}</Text>
                  <Text style={styles.workerLocation}>
                    {certificate.issuer} · {certificate.expires_at}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <Card>
        <SectionTitle title={t.bestProjects} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 14 }}
        >
          {worker.best_projects.map((project) => (
            <View key={project.id} style={styles.portfolioCard}>
              <Ionicons name="construct-outline" size={22} color={accent} />
              <Text style={styles.detailLabel}>{project.title}</Text>
              <Text style={styles.workerLocation}>
                {project.location} · {project.year}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Card>

      <Card>
        <SectionTitle title={t.documents} />
        <View style={{ gap: 8, marginTop: 14 }}>
          {worker.documents.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={localizeDemoText(language, item.title)}
              onPress={() => onDocument(item)}
              style={({ pressed }) => [
                styles.documentRow,
                pressed ? { opacity: 0.65 } : null,
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={workspaceColors.textSoft}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{localizeDemoText(language, item.title)}</Text>
                <Text style={styles.workerLocation}>{item.file_name}</Text>
              </View>
              <Text style={[styles.openText, { color: accent }]}>
                {uiText(language, "Consultar", "Open")}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle
          title={uiText(language, "Atribuições", "Assignments")}
          subtitle={
            uiText(language, "Adicionar a uma equipa ou obra.", "Add to a team or project.")
          }
        />
        <Text style={sharedStyles.label}>{t.teams}</Text>
        <View style={styles.assignmentChips}>
          {teams.map((team) => {
            const included = team.member_ids.includes(worker.id);
            return (
              <Button
                key={team.id}
                compact
                label={included ? `✓ ${team.name}` : team.name}
                variant={included ? "secondary" : "ghost"}
                accent={accent}
                disabled={included}
                onPress={() => onAddTeam(team.id)}
              />
            );
          })}
        </View>
        <Text style={sharedStyles.label}>{t.projects}</Text>
        <View style={styles.assignmentChips}>
          {projects.map((project) => {
            const included = project.worker_ids.includes(worker.id);
            return (
              <Button
                key={project.id}
                compact
                label={included ? `✓ ${project.name}` : project.name}
                variant={included ? "secondary" : "ghost"}
                accent={accent}
                disabled={included}
                onPress={() => onAssignProject(project.id)}
              />
            );
          })}
        </View>
      </Card>
    </View>
  );
}

function WorkerEditor({
  form,
  setForm,
  language,
}: {
  form: WorkerForm;
  setForm: React.Dispatch<React.SetStateAction<WorkerForm | null>>;
  language: import("@/src/demo/types").LanguageCode;
}) {
  const t = copy[language];
  const setValue = <K extends keyof WorkerForm>(key: K, value: WorkerForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };
  return (
    <View style={{ gap: 14 }}>
      <Field
        label={uiText(language, "Profissão", "Trade")}
        value={localizeDemoText(language, form.profession)}
        onChangeText={(value) => setValue("profession", value)}
      />
      <View style={styles.detailColumns}>
        <Field
          style={{ flex: 1, minWidth: 220 }}
          label={uiText(language, "Localização", "Location")}
          value={form.location}
          onChangeText={(value) => setValue("location", value)}
        />
        <Field
          style={{ flex: 1, minWidth: 220 }}
          label={uiText(language, "Telefone", "Phone")}
          value={form.phone}
          onChangeText={(value) => setValue("phone", value)}
        />
      </View>
      <Field
        label={uiText(language, "Biografia", "Bio")}
        value={localizeDemoText(language, form.bio)}
        multiline
        onChangeText={(value) => setValue("bio", value)}
      />
      <View style={styles.detailColumns}>
        <Field
          style={{ flex: 1 }}
          label={`${t.trust} (0–10)`}
          value={form.trust_score}
          keyboardType="decimal-pad"
          onChangeText={(value) => setValue("trust_score", value)}
        />
        <Field
          style={{ flex: 1 }}
          label={`${t.productivity} (0–10)`}
          value={form.productivity_score}
          keyboardType="decimal-pad"
          onChangeText={(value) => setValue("productivity_score", value)}
        />
      </View>
      <Text style={sharedStyles.label}>{t.status}</Text>
      <View style={styles.assignmentChips}>
        {(["available", "contracted", "on_site"] as WorkerStatus[]).map(
          (status) => {
            const label =
              status === "available"
                ? t.available
                : status === "contracted"
                  ? t.contracted
                  : t.onSite;
            return (
              <Button
                key={status}
                compact
                label={label}
                variant={form.status === status ? "primary" : "secondary"}
                accent={roleAccent("company")}
                onPress={() => setValue("status", status)}
              />
            );
          },
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: workspaceColors.background,
  },
  toolbar: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },
  toolbarCompact: {
    paddingHorizontal: 14,
    flexDirection: "column",
    alignItems: "stretch",
  },
  searchBox: {
    width: 370,
    maxWidth: "100%",
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    borderRadius: 13,
    backgroundColor: workspaceColors.panelSoft,
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    color: workspaceColors.text,
    fontSize: 13,
    height: "100%",
    outlineStyle: "none",
  } as never,
  filters: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },
  filter: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    color: workspaceColors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  resultCount: {
    color: workspaceColors.muted,
    fontSize: 11,
    marginLeft: "auto",
  },
  grid: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCompact: {
    paddingHorizontal: 14,
    paddingBottom: 100,
  },
  workerCard: {
    flexGrow: 1,
    flexBasis: 320,
    maxWidth: 470,
    minWidth: 280,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 17,
    backgroundColor: workspaceColors.panel,
    padding: 15,
    gap: 11,
  },
  workerCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  workerName: {
    color: workspaceColors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  workerTrade: {
    color: workspaceColors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  workerLocation: {
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  cardDivider: {
    height: 1,
    backgroundColor: workspaceColors.line,
  },
  workerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  inlineScores: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  miniScore: {
    color: workspaceColors.muted,
    fontSize: 9,
    fontWeight: "600",
  },
  skillChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: workspaceColors.panelStrong,
  },
  skillChipText: {
    color: workspaceColors.textSoft,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
  },
  profileHero: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
  },
  profileName: {
    color: workspaceColors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
  },
  profileTrade: {
    color: workspaceColors.textSoft,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  detailColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  detailLabel: {
    color: workspaceColors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 11,
    fontWeight: "800",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${workspaceColors.yellow}16`,
  },
  portfolioCard: {
    width: 210,
    minHeight: 116,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
    gap: 8,
  },
  documentRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: workspaceColors.panelSoft,
  },
  openText: {
    fontSize: 10,
    fontWeight: "700",
  },
  assignmentChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  documentPreview: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
  },
  documentTitle: {
    color: workspaceColors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  demoNotice: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderWidth: 1,
    borderColor: `${workspaceColors.yellow}55`,
    borderRadius: 12,
    padding: 12,
    backgroundColor: `${workspaceColors.yellow}0E`,
  },
  demoNoticeText: {
    flex: 1,
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 17,
  },
});
