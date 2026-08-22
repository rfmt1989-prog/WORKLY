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
import { uiText } from "@/src/demo/fullUi";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { Team, TeamStatus, Worker } from "@/src/demo/types";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  ModalPanel,
  Score,
  SectionTitle,
  StatusPill,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type TeamForm = {
  name: string;
  specialty: string;
  description: string;
  status: TeamStatus;
  project_id: string | null;
};

const EMPTY_FORM: TeamForm = {
  name: "",
  specialty: "",
  description: "",
  status: "available",
  project_id: null,
};

export function TeamsView() {
  const { user } = useAuth();
  const {
    state,
    language,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    setTeamLeader,
  } = useWorklyData();
  const { width } = useWindowDimensions();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [modal, setModal] = useState<"detail" | "create" | "edit" | null>(null);
  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const t = copy[language];
  const accent = roleAccent("company");
  const compact = width < 720;
  const companyId = user?.company_id ?? user?.id;

  const teams = useMemo(
    () => state?.teams.filter((team) => team.company_id === companyId) ?? [],
    [companyId, state?.teams],
  );
  const projects = useMemo(
    () =>
      state?.projects.filter((project) => project.company_id === companyId) ?? [],
    [companyId, state?.projects],
  );
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  if (!state) return null;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSelectedTeamId(null);
    setModal("create");
  };

  const openDetail = (team: Team) => {
    setSelectedTeamId(team.id);
    setModal("detail");
  };

  const openEdit = () => {
    if (!selectedTeam) return;
    setForm({
      name: selectedTeam.name,
      specialty: selectedTeam.specialty,
      description: selectedTeam.description,
      status: selectedTeam.status,
      project_id: selectedTeam.project_id,
    });
    setModal("edit");
  };

  const save = async () => {
    if (!form.name.trim() || busy) return;
    setBusy(true);
    try {
      if (modal === "create") {
        const created = await createTeam({
          name: form.name.trim(),
          specialty: form.specialty.trim(),
          description: form.description.trim(),
          status: form.status,
          project_id: form.project_id,
          leader_id: null,
          member_ids: [],
        });
        setSelectedTeamId(created.id);
        setModal("detail");
      } else if (modal === "edit" && selectedTeam) {
        await updateTeam(selectedTeam.id, form);
        setModal("detail");
      }
    } catch {
      // WorklyDataContext already presents the request error to the user.
    } finally {
      setBusy(false);
    }
  };

  const removeSelectedTeam = async () => {
    if (!selectedTeam || busy) return;
    setBusy(true);
    try {
      await deleteTeam(selectedTeam.id);
      setConfirmDelete(false);
      setModal(null);
      setSelectedTeamId(null);
    } catch {
      // WorklyDataContext already presents the request error to the user.
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, compact ? styles.headerCompact : null]}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>{t.teams}</Text>
          <Text style={sharedStyles.subtitle}>
            {uiText(language, "Cria equipas, escolhe líderes e distribui trabalhadores.", "Create teams, choose leaders and allocate workers.")}
          </Text>
        </View>
        <Button
          testID="create-team"
          label={uiText(language, "Nova equipa", "New team")}
          icon="add"
          accent={accent}
          onPress={openCreate}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.grid,
          compact ? styles.gridCompact : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {teams.length ? (
          teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              workers={state.workers}
              projectName={
                state.projects.find((project) => project.id === team.project_id)
                  ?.name
              }
              language={language}
              onPress={() => openDetail(team)}
            />
          ))
        ) : (
          <Card style={{ width: "100%" }}>
            <EmptyState
              icon="people-outline"
              title={uiText(language, "Ainda não há equipas", "No teams yet")}
              description={
                uiText(language, "Cria a primeira equipa e adiciona trabalhadores.", "Create the first team and add workers.")
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
            ? uiText(language, "Criar equipa", "Create team")
            : uiText(language, "Editar equipa", "Edit team")
        }
        subtitle={
          uiText(language, "Configuração operacional da equipa", "Team operational settings")
        }
        footer={
          <>
            <Button label={t.cancel} variant="ghost" onPress={() => setModal(null)} />
            <Button
              testID="save-team"
              label={t.save}
              icon="checkmark"
              accent={accent}
              loading={busy}
              disabled={!form.name.trim()}
              onPress={save}
            />
          </>
        }
      >
        <TeamEditor
          form={form}
          setForm={setForm}
          projects={projects}
          language={language}
        />
      </ModalPanel>

      <ModalPanel
        visible={modal === "detail" && Boolean(selectedTeam)}
        onClose={() => setModal(null)}
        title={localizeDemoText(language, selectedTeam?.name)}
        subtitle={localizeDemoText(language, selectedTeam?.specialty)}
        wide
        footer={
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
        }
      >
        {selectedTeam ? (
          <TeamDetails
            team={selectedTeam}
            workers={state.workers}
            projects={projects}
            language={language}
            busy={busy}
            onAdd={async (workerId) => {
              setBusy(true);
              try {
                await addTeamMember(selectedTeam.id, workerId);
              } catch {
                // WorklyDataContext already presents the request error.
              } finally {
                setBusy(false);
              }
            }}
            onRemove={async (workerId) => {
              setBusy(true);
              try {
                await removeTeamMember(selectedTeam.id, workerId);
              } catch {
                // WorklyDataContext already presents the request error.
              } finally {
                setBusy(false);
              }
            }}
            onLeader={async (workerId) => {
              setBusy(true);
              try {
                await setTeamLeader(selectedTeam.id, workerId);
              } catch {
                // WorklyDataContext already presents the request error.
              } finally {
                setBusy(false);
              }
            }}
            onProject={async (projectId) => {
              setBusy(true);
              try {
                await updateTeam(selectedTeam.id, {
                  project_id: projectId,
                  status: projectId ? "assigned" : "available",
                });
              } catch {
                // WorklyDataContext already presents the request error.
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
        title={uiText(language, "Eliminar equipa?", "Delete team?")}
        subtitle={localizeDemoText(language, selectedTeam?.name)}
        footer={
          <>
            <Button
              label={t.cancel}
              variant="ghost"
              onPress={() => setConfirmDelete(false)}
            />
            <Button
              testID="confirm-delete-team"
              label={t.delete}
              variant="danger"
              loading={busy}
              onPress={removeSelectedTeam}
            />
          </>
        }
      >
        <Text style={sharedStyles.body}>
          {uiText(language, "A equipa será removida das obras atribuídas. Os perfis dos trabalhadores não serão eliminados.", "The team will be removed from assigned projects. Worker profiles will not be deleted.")}
        </Text>
      </ModalPanel>
    </View>
  );
}

function TeamCard({
  team,
  workers,
  projectName,
  language,
  onPress,
}: {
  team: Team;
  workers: Worker[];
  projectName?: string;
  language: import("@/src/demo/types").LanguageCode;
  onPress: () => void;
}) {
  const accent = roleAccent("company");
  const members = workers.filter((worker) => team.member_ids.includes(worker.id));
  const trust = members.length
    ? members.reduce((sum, worker) => sum + worker.trust_score, 0) / members.length
    : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={localizeDemoText(language, team.name)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.teamCard,
        pressed ? { opacity: 0.78, transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <View style={styles.teamCardHeader}>
        <View
          style={[
            styles.teamIcon,
            { backgroundColor: `${accent}18`, borderColor: `${accent}55` },
          ]}
        >
          <Ionicons name="people" size={23} color={accent} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.teamName}>{localizeDemoText(language, team.name)}</Text>
          <Text style={styles.teamMeta}>{localizeDemoText(language, team.specialty)}</Text>
        </View>
        <StatusPill
          status={team.status}
          label={
            team.status === "on_site"
              ? uiText(language, "Em obra", "On site")
              : team.status === "assigned"
                ? uiText(language, "Atribuída", "Assigned")
                : uiText(language, "Disponível", "Available")
          }
        />
      </View>
      <View style={styles.teamProject}>
        <Ionicons name="business-outline" size={15} color={workspaceColors.muted} />
        <Text style={styles.teamMeta} numberOfLines={1}>
          {projectName ??
            (uiText(language, "Sem obra atribuída", "No project assigned"))}
        </Text>
      </View>
      <View style={styles.teamFooter}>
        <View style={styles.avatarStack}>
          {members.slice(0, 4).map((worker, index) => (
            <View key={worker.id} style={{ marginLeft: index ? -8 : 0 }}>
              <Avatar name={worker.name} size={32} accent={accent} />
            </View>
          ))}
          {members.length > 4 ? (
            <View style={[styles.extraMembers, { marginLeft: -8 }]}>
              <Text style={styles.extraMembersText}>+{members.length - 4}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.teamCount}>
            {members.length} {uiText(language, "membros", "members")}
          </Text>
          <Text style={styles.teamTrust}>
            {uiText(language, "Confiança", "Trust")} {trust.toFixed(1)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function TeamEditor({
  form,
  setForm,
  projects,
  language,
}: {
  form: TeamForm;
  setForm: React.Dispatch<React.SetStateAction<TeamForm>>;
  projects: { id: string; name: string }[];
  language: import("@/src/demo/types").LanguageCode;
}) {
  const t = copy[language];
  const setValue = <K extends keyof TeamForm>(key: K, value: TeamForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  return (
    <View style={{ gap: 14 }}>
      <Field
        label={uiText(language, "Nome da equipa", "Team name")}
        value={localizeDemoText(language, form.name)}
        onChangeText={(value) => setValue("name", value)}
        placeholder={uiText(language, "Ex.: Equipa Estrutura Sul", "E.g. South Structure Team")}
      />
      <Field
        label={uiText(language, "Especialidade", "Specialty")}
        value={localizeDemoText(language, form.specialty)}
        onChangeText={(value) => setValue("specialty", value)}
      />
      <Field
        label={uiText(language, "Descrição", "Description")}
        value={localizeDemoText(language, form.description)}
        multiline
        onChangeText={(value) => setValue("description", value)}
      />
      <Text style={sharedStyles.label}>{t.status}</Text>
      <View style={styles.choiceWrap}>
        {(["available", "assigned", "on_site", "inactive"] as TeamStatus[]).map(
          (status) => (
            <Button
              key={status}
              compact
              label={
                status === "available"
                  ? t.available
                  : status === "assigned"
                    ? uiText(language, "Atribuída", "Assigned")
                    : status === "on_site"
                      ? t.onSite
                      : uiText(language, "Inativa", "Inactive")
              }
              variant={form.status === status ? "primary" : "secondary"}
              accent={roleAccent("company")}
              onPress={() => setValue("status", status)}
            />
          ),
        )}
      </View>
      <Text style={sharedStyles.label}>{t.projects}</Text>
      <View style={styles.choiceWrap}>
        <Button
          compact
          label={uiText(language, "Sem obra", "No project")}
          variant={form.project_id === null ? "primary" : "secondary"}
          accent={roleAccent("company")}
          onPress={() => setValue("project_id", null)}
        />
        {projects.map((project) => (
          <Button
            key={project.id}
            compact
            label={project.name}
            variant={form.project_id === project.id ? "primary" : "secondary"}
            accent={roleAccent("company")}
            onPress={() => setValue("project_id", project.id)}
          />
        ))}
      </View>
    </View>
  );
}

function TeamDetails({
  team,
  workers,
  projects,
  language,
  busy,
  onAdd,
  onRemove,
  onLeader,
  onProject,
}: {
  team: Team;
  workers: Worker[];
  projects: { id: string; name: string }[];
  language: import("@/src/demo/types").LanguageCode;
  busy: boolean;
  onAdd: (workerId: string) => void;
  onRemove: (workerId: string) => void;
  onLeader: (workerId: string) => void;
  onProject: (projectId: string | null) => void;
}) {
  const t = copy[language];
  const accent = roleAccent("company");
  const members = workers.filter((worker) => team.member_ids.includes(worker.id));
  const availableWorkers = workers.filter(
    (worker) => !team.member_ids.includes(worker.id),
  );
  const averageTrust = members.length
    ? members.reduce((sum, worker) => sum + worker.trust_score, 0) / members.length
    : 0;
  const averageProductivity = members.length
    ? members.reduce((sum, worker) => sum + worker.productivity_score, 0) /
      members.length
    : 0;
  return (
    <View style={{ gap: 18 }}>
      <View style={styles.teamSummary}>
        <View style={{ flex: 1, minWidth: 220, gap: 5 }}>
          <Text style={styles.detailTitle}>{localizeDemoText(language, team.name)}</Text>
          <Text style={sharedStyles.body}>{localizeDemoText(language, team.description)}</Text>
          <StatusPill
            status={team.status}
            label={
              team.status === "on_site"
                ? t.onSite
                : team.status === "assigned"
                  ? uiText(language, "Atribuída", "Assigned")
                  : t.available
            }
          />
        </View>
        <Score value={averageTrust} label={t.trust} accent={accent} compact />
        <Score
          value={averageProductivity}
          label={t.productivity}
          accent={workspaceColors.green}
          compact
        />
      </View>

      <Card>
        <SectionTitle
          title={uiText(language, "Obra atribuída", "Assigned project")}
          subtitle={
            projects.find((project) => project.id === team.project_id)?.name ??
            (uiText(language, "Sem obra atribuída", "No project assigned"))
          }
        />
        <View style={[styles.choiceWrap, { marginTop: 13 }]}>
          <Button
            compact
            label={uiText(language, "Sem obra", "No project")}
            variant={team.project_id === null ? "primary" : "secondary"}
            accent={accent}
            disabled={busy}
            onPress={() => onProject(null)}
          />
          {projects.map((project) => (
            <Button
              key={project.id}
              compact
              label={project.name}
              variant={team.project_id === project.id ? "primary" : "secondary"}
              accent={accent}
              disabled={busy}
              onPress={() => onProject(project.id)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle
          title={`${t.members} · ${members.length}`}
          subtitle={
            uiText(language, "Define o líder ou remove membros.", "Assign the leader or remove members.")
          }
        />
        <View style={{ gap: 9, marginTop: 14 }}>
          {members.length ? (
            members.map((worker) => (
              <View key={worker.id} style={styles.memberRow}>
                <Avatar
                  name={worker.name}
                  flag={worker.flag}
                  size={42}
                  accent={accent}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.memberName}>{worker.name}</Text>
                  <Text style={styles.teamMeta}>{localizeDemoText(language, worker.profession)}</Text>
                </View>
                {team.leader_id === worker.id ? (
                  <View style={styles.leaderBadge}>
                    <Ionicons
                      name="star"
                      size={12}
                      color={workspaceColors.yellow}
                    />
                    <Text style={styles.leaderText}>{t.leader}</Text>
                  </View>
                ) : (
                  <Button
                    compact
                    label={t.leader}
                    variant="ghost"
                    accent={accent}
                    disabled={busy}
                    onPress={() => onLeader(worker.id)}
                  />
                )}
                <Button
                  compact
                  label={t.remove}
                  variant="danger"
                  disabled={busy}
                  onPress={() => onRemove(worker.id)}
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="person-add-outline"
              title={
                uiText(language, "Equipa sem membros", "Team has no members")
              }
            />
          )}
        </View>
      </Card>

      <Card>
        <SectionTitle
          title={uiText(language, "Adicionar trabalhadores", "Add workers")}
          subtitle={
            uiText(language, "Perfis disponíveis na rede WORKLY.", "Profiles available in the WORKLY network.")
          }
        />
        <View style={[styles.availableGrid, { marginTop: 14 }]}>
          {availableWorkers.map((worker) => (
            <View key={worker.id} style={styles.availableWorker}>
              <Avatar
                name={worker.name}
                flag={worker.flag}
                size={38}
                accent={accent}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{worker.name}</Text>
                <Text style={styles.teamMeta} numberOfLines={1}>
                  {localizeDemoText(language, worker.profession)}
                </Text>
              </View>
              <Button
                compact
                label={t.add}
                icon="add"
                accent={accent}
                disabled={busy}
                onPress={() => onAdd(worker.id)}
              />
            </View>
          ))}
        </View>
      </Card>
    </View>
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
    alignItems: "stretch",
    flexDirection: "column",
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
  teamCard: {
    flexGrow: 1,
    flexBasis: 360,
    maxWidth: 570,
    minWidth: 290,
    backgroundColor: workspaceColors.panel,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  teamCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    color: workspaceColors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  teamMeta: {
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  teamProject: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 11,
    backgroundColor: workspaceColors.panelSoft,
    padding: 10,
  },
  teamFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  extraMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: workspaceColors.panel,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  extraMembersText: {
    color: workspaceColors.textSoft,
    fontSize: 9,
    fontWeight: "700",
  },
  teamCount: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    fontWeight: "600",
  },
  teamTrust: {
    color: workspaceColors.muted,
    fontSize: 9,
    marginTop: 2,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  teamSummary: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
  },
  detailTitle: {
    color: workspaceColors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
  },
  memberRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 13,
    backgroundColor: workspaceColors.panelSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  memberName: {
    color: workspaceColors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  leaderBadge: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: `${workspaceColors.yellow}55`,
    backgroundColor: `${workspaceColors.yellow}12`,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  leaderText: {
    color: workspaceColors.yellow,
    fontSize: 9,
    fontWeight: "700",
  },
  availableGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  availableWorker: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 250,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 12,
    padding: 9,
    backgroundColor: workspaceColors.panelSoft,
  },
});

