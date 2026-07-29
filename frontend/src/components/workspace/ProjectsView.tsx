import React, { useMemo, useState } from "react";
import {
  Pressable,
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
import type { Project, ProjectStatus } from "@/src/demo/types";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  ModalPanel,
  ProgressBar,
  SectionTitle,
  StatusPill,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type ProjectForm = {
  name: string;
  client: string;
  description: string;
  location: string;
  status: ProjectStatus;
  progress: string;
  start_date: string;
  end_date: string;
  schedule: string;
};

const EMPTY_FORM: ProjectForm = {
  name: "",
  client: "",
  description: "",
  location: "",
  status: "planned",
  progress: "0",
  start_date: "2026-08-01",
  end_date: "2026-12-20",
  schedule: "08:00–17:00",
};

export function ProjectsView() {
  const { user } = useAuth();
  const {
    state,
    language,
    createProject,
    updateProject,
    deleteProject,
    assignToProject,
  } = useWorklyData();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<"detail" | "create" | "edit" | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const compact = width < 720;
  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const t = copy[language];

  const projects = useMemo(() => {
    if (!state || !user) return [];
    if (user.role === "company") {
      const companyId = user.company_id ?? user.id;
      return state.projects.filter((project) => project.company_id === companyId);
    }
    return state.projects.filter((project) => project.worker_ids.includes(user.id));
  }, [state, user]);
  const selectedProject = projects.find((project) => project.id === selectedId);

  if (!state || !user) return null;

  const openDetail = (project: Project) => {
    setSelectedId(project.id);
    setModal("detail");
  };

  const openEdit = () => {
    if (!selectedProject) return;
    setForm({
      name: selectedProject.name,
      client: selectedProject.client,
      description: selectedProject.description,
      location: selectedProject.location,
      status: selectedProject.status,
      progress: String(selectedProject.progress),
      start_date: selectedProject.start_date,
      end_date: selectedProject.end_date,
      schedule: selectedProject.schedule,
    });
    setModal("edit");
  };

  const save = async () => {
    if (!form.name.trim() || !form.location.trim() || busy) return;
    const input = {
      name: form.name.trim(),
      client: form.client.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      status: form.status,
      progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
      start_date: form.start_date,
      end_date: form.end_date,
      schedule: form.schedule,
    };
    setBusy(true);
    try {
      if (modal === "create") {
        const created = await createProject({
          ...input,
          team_ids: [],
          worker_ids: [],
        });
        setSelectedId(created.id);
        setModal("detail");
      } else if (modal === "edit" && selectedProject) {
        await updateProject(selectedProject.id, input);
        setModal("detail");
      }
    } finally {
      setBusy(false);
    }
  };

  const removeSelected = async () => {
    if (!selectedProject || busy) return;
    setBusy(true);
    try {
      await deleteProject(selectedProject.id);
      setConfirmDelete(false);
      setSelectedId(null);
      setModal(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, compact ? styles.headerCompact : null]}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>{t.projects}</Text>
          <Text style={sharedStyles.subtitle}>
            {role === "company"
              ? language === "pt"
                ? "Planeamento, progresso e recursos por obra."
                : "Planning, progress and resources by project."
              : language === "pt"
                ? "Obras atribuídas, local e horário."
                : "Assigned projects, locations and schedules."}
          </Text>
        </View>
        {role === "company" ? (
          <Button
            testID="create-project"
            label={language === "pt" ? "Nova obra" : "New project"}
            icon="add"
            accent={accent}
            onPress={() => {
              setForm(EMPTY_FORM);
              setSelectedId(null);
              setModal("create");
            }}
          />
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.grid,
          compact ? styles.gridCompact : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {projects.length ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              teamsCount={project.team_ids.length}
              workersCount={project.worker_ids.length}
              language={language}
              accent={accent}
              onPress={() => openDetail(project)}
            />
          ))
        ) : (
          <Card style={{ width: "100%" }}>
            <EmptyState
              icon="business-outline"
              title={
                language === "pt" ? "Ainda não existem obras" : "No projects yet"
              }
              description={
                role === "company"
                  ? language === "pt"
                    ? "Cria a primeira obra e atribui uma equipa."
                    : "Create the first project and assign a team."
                  : language === "pt"
                    ? "A empresa ainda não atribuiu uma obra ao teu perfil."
                    : "The company has not assigned a project to your profile yet."
              }
            />
          </Card>
        )}
      </ScrollView>

      <ModalPanel
        visible={modal === "create" || modal === "edit"}
        onClose={() => setModal(null)}
        title={
          modal === "create"
            ? language === "pt"
              ? "Criar obra"
              : "Create project"
            : language === "pt"
              ? "Editar obra"
              : "Edit project"
        }
        subtitle={
          language === "pt"
            ? "Informação operacional e calendário"
            : "Operational details and schedule"
        }
        footer={
          <>
            <Button label={t.cancel} variant="ghost" onPress={() => setModal(null)} />
            <Button
              testID="save-project"
              label={t.save}
              icon="checkmark"
              accent={accent}
              loading={busy}
              disabled={!form.name.trim() || !form.location.trim()}
              onPress={save}
            />
          </>
        }
      >
        <ProjectEditor
          form={form}
          setForm={setForm}
          language={language}
          accent={accent}
        />
      </ModalPanel>

      <ModalPanel
        visible={modal === "detail" && Boolean(selectedProject)}
        onClose={() => setModal(null)}
        title={selectedProject?.name ?? ""}
        subtitle={selectedProject?.location}
        wide
        footer={
          role === "company" ? (
            <>
              <Button
                label={t.delete}
                icon="trash-outline"
                variant="danger"
                onPress={() => setConfirmDelete(true)}
              />
              <Button
                label={t.edit}
                icon="create-outline"
                accent={accent}
                onPress={openEdit}
              />
            </>
          ) : (
            <Button label={t.close} variant="secondary" onPress={() => setModal(null)} />
          )
        }
      >
        {selectedProject ? (
          <ProjectDetails
            project={selectedProject}
            state={state}
            language={language}
            role={role}
            accent={accent}
            busy={busy}
            onWorker={async (workerId, assigned) => {
              setBusy(true);
              try {
                if (assigned) {
                  await updateProject(selectedProject.id, {
                    worker_ids: selectedProject.worker_ids.filter(
                      (id) => id !== workerId,
                    ),
                  });
                } else {
                  await assignToProject(selectedProject.id, {
                    worker_id: workerId,
                  });
                }
              } finally {
                setBusy(false);
              }
            }}
            onTeam={async (teamId, assigned) => {
              setBusy(true);
              try {
                if (assigned) {
                  await updateProject(selectedProject.id, {
                    team_ids: selectedProject.team_ids.filter(
                      (id) => id !== teamId,
                    ),
                  });
                } else {
                  await assignToProject(selectedProject.id, { team_id: teamId });
                }
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
      </ModalPanel>

      <ModalPanel
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={language === "pt" ? "Eliminar obra?" : "Delete project?"}
        subtitle={selectedProject?.name}
        footer={
          <>
            <Button
              label={t.cancel}
              variant="ghost"
              onPress={() => setConfirmDelete(false)}
            />
            <Button
              testID="confirm-delete-project"
              label={t.delete}
              variant="danger"
              loading={busy}
              onPress={removeSelected}
            />
          </>
        }
      >
        <Text style={sharedStyles.body}>
          {language === "pt"
            ? "A obra será removida e as equipas associadas ficarão disponíveis. Os registos históricos de presença permanecem na demonstração."
            : "The project will be removed and assigned teams will become available. Historical attendance remains in the demo."}
        </Text>
      </ModalPanel>
    </View>
  );
}

function ProjectCard({
  project,
  teamsCount,
  workersCount,
  language,
  accent,
  onPress,
}: {
  project: Project;
  teamsCount: number;
  workersCount: number;
  language: "pt" | "en";
  accent: string;
  onPress: () => void;
}) {
  const t = copy[language];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={project.name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.projectCard,
        pressed ? { opacity: 0.78, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.projectIcon,
            { backgroundColor: `${accent}18`, borderColor: `${accent}55` },
          ]}
        >
          <Ionicons name="business" size={22} color={accent} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.meta}>{project.client}</Text>
        </View>
        <StatusPill
          status={project.status}
          label={
            project.status === "active"
              ? t.active
              : project.status === "planned"
                ? t.planned
                : project.status === "completed"
                  ? t.completed
                  : t.paused
          }
        />
      </View>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={15} color={workspaceColors.muted} />
        <Text style={styles.meta}>{project.location}</Text>
      </View>
      <View style={{ gap: 7 }}>
        <View style={styles.progressHeader}>
          <Text style={styles.meta}>
            {language === "pt" ? "Progresso" : "Progress"}
          </Text>
          <Text style={[styles.progressValue, { color: accent }]}>
            {project.progress}%
          </Text>
        </View>
        <ProgressBar value={project.progress} accent={accent} />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerStat}>
          <Ionicons name="people-outline" size={15} color={workspaceColors.textSoft} />
          <Text style={styles.footerText}>
            {teamsCount} {language === "pt" ? "equipas" : "teams"}
          </Text>
        </View>
        <View style={styles.footerStat}>
          <Ionicons name="person-outline" size={15} color={workspaceColors.textSoft} />
          <Text style={styles.footerText}>
            {workersCount} {language === "pt" ? "pessoas" : "people"}
          </Text>
        </View>
        <Text style={styles.dateText}>{project.end_date}</Text>
      </View>
    </Pressable>
  );
}

function ProjectEditor({
  form,
  setForm,
  language,
  accent,
}: {
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  language: "pt" | "en";
  accent: string;
}) {
  const t = copy[language];
  const setValue = <K extends keyof ProjectForm>(
    key: K,
    value: ProjectForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <View style={{ gap: 14 }}>
      <Field
        label={language === "pt" ? "Nome da obra" : "Project name"}
        value={form.name}
        onChangeText={(value) => setValue("name", value)}
      />
      <View style={styles.formColumns}>
        <Field
          style={{ flex: 1, minWidth: 210 }}
          label={language === "pt" ? "Cliente" : "Client"}
          value={form.client}
          onChangeText={(value) => setValue("client", value)}
        />
        <Field
          style={{ flex: 1, minWidth: 210 }}
          label={language === "pt" ? "Localização" : "Location"}
          value={form.location}
          onChangeText={(value) => setValue("location", value)}
        />
      </View>
      <Field
        label={language === "pt" ? "Descrição" : "Description"}
        value={form.description}
        multiline
        onChangeText={(value) => setValue("description", value)}
      />
      <View style={styles.formColumns}>
        <Field
          style={{ flex: 1 }}
          label={language === "pt" ? "Data de início" : "Start date"}
          value={form.start_date}
          onChangeText={(value) => setValue("start_date", value)}
        />
        <Field
          style={{ flex: 1 }}
          label={language === "pt" ? "Data de fim" : "End date"}
          value={form.end_date}
          onChangeText={(value) => setValue("end_date", value)}
        />
      </View>
      <View style={styles.formColumns}>
        <Field
          style={{ flex: 1 }}
          label={language === "pt" ? "Horário" : "Schedule"}
          value={form.schedule}
          onChangeText={(value) => setValue("schedule", value)}
        />
        <Field
          style={{ flex: 1 }}
          label={`${language === "pt" ? "Progresso" : "Progress"} (0–100)`}
          value={form.progress}
          keyboardType="number-pad"
          onChangeText={(value) => setValue("progress", value)}
        />
      </View>
      <Text style={sharedStyles.label}>{t.status}</Text>
      <View style={styles.choiceWrap}>
        {(["planned", "active", "paused", "completed"] as ProjectStatus[]).map(
          (status) => (
            <Button
              key={status}
              compact
              label={
                status === "planned"
                  ? t.planned
                  : status === "active"
                    ? t.active
                    : status === "completed"
                      ? t.completed
                      : t.paused
              }
              variant={form.status === status ? "primary" : "secondary"}
              accent={accent}
              onPress={() => setValue("status", status)}
            />
          ),
        )}
      </View>
    </View>
  );
}

function ProjectDetails({
  project,
  state,
  language,
  role,
  accent,
  busy,
  onWorker,
  onTeam,
}: {
  project: Project;
  state: NonNullable<ReturnType<typeof useWorklyData>["state"]>;
  language: "pt" | "en";
  role: "worker" | "company";
  accent: string;
  busy: boolean;
  onWorker: (workerId: string, assigned: boolean) => void;
  onTeam: (teamId: string, assigned: boolean) => void;
}) {
  const t = copy[language];
  const assignedWorkers = state.workers.filter((worker) =>
    project.worker_ids.includes(worker.id),
  );
  const assignedTeams = state.teams.filter((team) =>
    project.team_ids.includes(team.id),
  );
  const company = state.companies.find(
    (candidate) => candidate.id === project.company_id,
  );
  return (
    <View style={{ gap: 18 }}>
      <View style={styles.detailHero}>
        <View style={{ flex: 1, minWidth: 240, gap: 6 }}>
          <Text style={styles.detailTitle}>{project.name}</Text>
          <Text style={sharedStyles.body}>{project.description}</Text>
          <StatusPill
            status={project.status}
            label={
              project.status === "active"
                ? t.active
                : project.status === "planned"
                  ? t.planned
                  : project.status === "completed"
                    ? t.completed
                    : t.paused
            }
          />
        </View>
        <View style={styles.progressRing}>
          <Text style={[styles.progressRingValue, { color: accent }]}>
            {project.progress}%
          </Text>
          <Text style={styles.meta}>{language === "pt" ? "concluído" : "complete"}</Text>
        </View>
      </View>

      <View style={styles.facts}>
        <Fact icon="business-outline" label={language === "pt" ? "Empresa" : "Company"} value={company?.name ?? "—"} />
        <Fact icon="location-outline" label={language === "pt" ? "Local" : "Location"} value={project.location} />
        <Fact icon="time-outline" label={language === "pt" ? "Horário" : "Schedule"} value={project.schedule} />
        <Fact icon="calendar-outline" label={language === "pt" ? "Período" : "Period"} value={`${project.start_date} → ${project.end_date}`} />
      </View>

      <Card>
        <SectionTitle title={`${t.teams} · ${assignedTeams.length}`} />
        <View style={[styles.choiceWrap, { marginTop: 13 }]}>
          {(role === "company"
            ? state.teams.filter((team) => team.company_id === project.company_id)
            : assignedTeams
          ).map((team) => {
            const assigned = project.team_ids.includes(team.id);
            return (
              <Button
                key={team.id}
                compact
                label={assigned ? `✓ ${team.name}` : team.name}
                variant={assigned ? "primary" : "secondary"}
                accent={accent}
                disabled={busy || role !== "company"}
                onPress={() => onTeam(team.id, assigned)}
              />
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionTitle
          title={`${t.workers} · ${assignedWorkers.length}`}
          subtitle={
            role === "company"
              ? language === "pt"
                ? "Seleciona para atribuir ou remover."
                : "Select to assign or remove."
              : undefined
          }
        />
        <View style={styles.workerGrid}>
          {(role === "company" ? state.workers : assignedWorkers).map((worker) => {
            const assigned = project.worker_ids.includes(worker.id);
            return (
              <Pressable
                key={worker.id}
                disabled={busy || role !== "company"}
                onPress={() => onWorker(worker.id, assigned)}
                style={[
                  styles.workerChoice,
                  assigned
                    ? { borderColor: `${accent}88`, backgroundColor: `${accent}12` }
                    : null,
                ]}
              >
                <Avatar
                  name={worker.name}
                  flag={worker.flag}
                  size={38}
                  accent={accent}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {worker.profession}
                  </Text>
                </View>
                <Ionicons
                  name={assigned ? "checkmark-circle" : "add-circle-outline"}
                  size={20}
                  color={assigned ? accent : workspaceColors.muted}
                />
              </Pressable>
            );
          })}
        </View>
      </Card>
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
    <Card style={styles.fact}>
      <Ionicons name={icon} size={19} color={workspaceColors.muted} />
      <Text style={sharedStyles.label}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: workspaceColors.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },
  headerCompact: {
    padding: 14,
    flexDirection: "column",
    alignItems: "stretch",
  },
  grid: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },
  gridCompact: {
    paddingHorizontal: 14,
    paddingBottom: 100,
  },
  projectCard: {
    flexGrow: 1,
    flexBasis: 370,
    maxWidth: 590,
    minWidth: 290,
    backgroundColor: workspaceColors.panel,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  projectIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  projectName: {
    color: workspaceColors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  meta: {
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  cardFooter: {
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: workspaceColors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  footerStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    color: workspaceColors.textSoft,
    fontSize: 10,
    fontWeight: "600",
  },
  dateText: {
    color: workspaceColors.muted,
    fontSize: 9,
    marginLeft: "auto",
  },
  formColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailHero: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  detailTitle: {
    color: workspaceColors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "800",
  },
  progressRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: workspaceColors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: workspaceColors.panelSoft,
  },
  progressRingValue: {
    fontSize: 21,
    fontWeight: "900",
  },
  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fact: {
    flex: 1,
    minWidth: 155,
    gap: 7,
  },
  factValue: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  workerGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  workerChoice: {
    flexGrow: 1,
    flexBasis: 270,
    minWidth: 245,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 12,
    backgroundColor: workspaceColors.panelSoft,
    padding: 9,
  },
  workerName: {
    color: workspaceColors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
});

