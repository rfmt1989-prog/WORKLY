import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type {
  LanguageCode,
  Project,
  ProjectSafetyItem,
  ProjectTask,
} from "@/src/demo/types";

import {
  Button,
  Card,
  Field,
  SectionTitle,
  workspaceColors,
} from "./primitives";

type Tab = "planning" | "safety" | "costs";

type Copy = {
  planning: string;
  safety: string;
  costs: string;
  tasks: string;
  addTask: string;
  taskTitle: string;
  phase: string;
  due: string;
  assignee: string;
  unassigned: string;
  todo: string;
  inProgress: string;
  done: string;
  blocked: string;
  noTasks: string;
  safetyRecords: string;
  addSafety: string;
  safetyTitle: string;
  briefing: string;
  inspection: string;
  incident: string;
  nearMiss: string;
  low: string;
  medium: string;
  high: string;
  open: string;
  resolved: string;
  noSafety: string;
  budget: string;
  committed: string;
  labour: string;
  materials: string;
  forecast: string;
  available: string;
  saveCosts: string;
  progress: string;
  overdue: string;
  manageHint: string;
};

const COPY: Record<LanguageCode, Copy> = {
  pt: { planning: "Planeamento", safety: "Safety", costs: "Custos", tasks: "Tarefas da obra", addTask: "Nova tarefa", taskTitle: "Tarefa", phase: "Fase", due: "Prazo", assignee: "Responsável", unassigned: "Sem responsável", todo: "Por iniciar", inProgress: "Em curso", done: "Concluída", blocked: "Bloqueada", noTasks: "Ainda não existem tarefas nesta obra.", safetyRecords: "Segurança em obra", addSafety: "Novo registo", safetyTitle: "Título do registo", briefing: "Toolbox / briefing", inspection: "Inspeção", incident: "Incidente", nearMiss: "Near miss", low: "Baixa", medium: "Média", high: "Alta", open: "Aberto", resolved: "Resolvido", noSafety: "Sem registos de segurança.", budget: "Orçamento", committed: "Comprometido", labour: "Mão de obra", materials: "Materiais", forecast: "Previsão total", available: "Disponível", saveCosts: "Guardar custos", progress: "Progresso", overdue: "Atrasada", manageHint: "Atualizações ficam sincronizadas com a Company e os trabalhadores atribuídos." },
  en: { planning: "Planning", safety: "Safety", costs: "Costs", tasks: "Project tasks", addTask: "New task", taskTitle: "Task", phase: "Phase", due: "Due date", assignee: "Owner", unassigned: "Unassigned", todo: "To do", inProgress: "In progress", done: "Done", blocked: "Blocked", noTasks: "No tasks have been created for this project yet.", safetyRecords: "Site safety", addSafety: "New record", safetyTitle: "Record title", briefing: "Toolbox / briefing", inspection: "Inspection", incident: "Incident", nearMiss: "Near miss", low: "Low", medium: "Medium", high: "High", open: "Open", resolved: "Resolved", noSafety: "No safety records.", budget: "Budget", committed: "Committed", labour: "Labour", materials: "Materials", forecast: "Total forecast", available: "Available", saveCosts: "Save costs", progress: "Progress", overdue: "Overdue", manageHint: "Updates stay synchronized with the Company and assigned workers." },
  fr: { planning: "Planification", safety: "Sécurité", costs: "Coûts", tasks: "Tâches du chantier", addTask: "Nouvelle tâche", taskTitle: "Tâche", phase: "Phase", due: "Échéance", assignee: "Responsable", unassigned: "Non attribué", todo: "À faire", inProgress: "En cours", done: "Terminée", blocked: "Bloquée", noTasks: "Aucune tâche créée pour ce chantier.", safetyRecords: "Sécurité chantier", addSafety: "Nouveau registre", safetyTitle: "Titre", briefing: "Toolbox / briefing", inspection: "Inspection", incident: "Incident", nearMiss: "Presqu'accident", low: "Faible", medium: "Moyenne", high: "Élevée", open: "Ouvert", resolved: "Résolu", noSafety: "Aucun registre de sécurité.", budget: "Budget", committed: "Engagé", labour: "Main-d'œuvre", materials: "Matériaux", forecast: "Prévision totale", available: "Disponible", saveCosts: "Enregistrer", progress: "Avancement", overdue: "En retard", manageHint: "Les mises à jour sont synchronisées avec l'entreprise et les travailleurs affectés." },
  es: { planning: "Planificación", safety: "Seguridad", costs: "Costes", tasks: "Tareas de obra", addTask: "Nueva tarea", taskTitle: "Tarea", phase: "Fase", due: "Fecha límite", assignee: "Responsable", unassigned: "Sin responsable", todo: "Pendiente", inProgress: "En curso", done: "Completada", blocked: "Bloqueada", noTasks: "Todavía no hay tareas en esta obra.", safetyRecords: "Seguridad en obra", addSafety: "Nuevo registro", safetyTitle: "Título", briefing: "Toolbox / briefing", inspection: "Inspección", incident: "Incidente", nearMiss: "Casi accidente", low: "Baja", medium: "Media", high: "Alta", open: "Abierto", resolved: "Resuelto", noSafety: "Sin registros de seguridad.", budget: "Presupuesto", committed: "Comprometido", labour: "Mano de obra", materials: "Materiales", forecast: "Previsión total", available: "Disponible", saveCosts: "Guardar costes", progress: "Progreso", overdue: "Atrasada", manageHint: "Las actualizaciones se sincronizan con la empresa y los trabajadores asignados." },
  ro: { planning: "Planificare", safety: "Siguranță", costs: "Costuri", tasks: "Sarcini șantier", addTask: "Sarcină nouă", taskTitle: "Sarcină", phase: "Fază", due: "Termen", assignee: "Responsabil", unassigned: "Nealocat", todo: "De făcut", inProgress: "În lucru", done: "Finalizată", blocked: "Blocată", noTasks: "Nu există încă sarcini pentru acest șantier.", safetyRecords: "Siguranță pe șantier", addSafety: "Înregistrare nouă", safetyTitle: "Titlu", briefing: "Toolbox / briefing", inspection: "Inspecție", incident: "Incident", nearMiss: "Aproape accident", low: "Scăzută", medium: "Medie", high: "Ridicată", open: "Deschis", resolved: "Rezolvat", noSafety: "Nu există înregistrări de siguranță.", budget: "Buget", committed: "Angajat", labour: "Forță de muncă", materials: "Materiale", forecast: "Previziune totală", available: "Disponibil", saveCosts: "Salvează costurile", progress: "Progres", overdue: "Întârziată", manageHint: "Actualizările sunt sincronizate cu firma și lucrătorii alocați." },
  de: { planning: "Planung", safety: "Sicherheit", costs: "Kosten", tasks: "Baustellenaufgaben", addTask: "Neue Aufgabe", taskTitle: "Aufgabe", phase: "Phase", due: "Fällig", assignee: "Verantwortlich", unassigned: "Nicht zugewiesen", todo: "Offen", inProgress: "In Arbeit", done: "Erledigt", blocked: "Blockiert", noTasks: "Für dieses Projekt gibt es noch keine Aufgaben.", safetyRecords: "Baustellensicherheit", addSafety: "Neuer Eintrag", safetyTitle: "Titel", briefing: "Toolbox / Briefing", inspection: "Inspektion", incident: "Vorfall", nearMiss: "Beinaheunfall", low: "Niedrig", medium: "Mittel", high: "Hoch", open: "Offen", resolved: "Erledigt", noSafety: "Keine Sicherheitseinträge.", budget: "Budget", committed: "Gebunden", labour: "Arbeitskosten", materials: "Materialien", forecast: "Gesamtprognose", available: "Verfügbar", saveCosts: "Kosten speichern", progress: "Fortschritt", overdue: "Überfällig", manageHint: "Aktualisierungen werden mit Unternehmen und zugewiesenen Mitarbeitern synchronisiert." },
  nl: { planning: "Planning", safety: "Veiligheid", costs: "Kosten", tasks: "Projecttaken", addTask: "Nieuwe taak", taskTitle: "Taak", phase: "Fase", due: "Deadline", assignee: "Verantwoordelijke", unassigned: "Niet toegewezen", todo: "Te doen", inProgress: "Bezig", done: "Voltooid", blocked: "Geblokkeerd", noTasks: "Er zijn nog geen taken voor dit project.", safetyRecords: "Veiligheid op locatie", addSafety: "Nieuwe registratie", safetyTitle: "Titel", briefing: "Toolbox / briefing", inspection: "Inspectie", incident: "Incident", nearMiss: "Bijna-ongeval", low: "Laag", medium: "Gemiddeld", high: "Hoog", open: "Open", resolved: "Opgelost", noSafety: "Geen veiligheidsregistraties.", budget: "Budget", committed: "Vastgelegd", labour: "Arbeid", materials: "Materialen", forecast: "Totale prognose", available: "Beschikbaar", saveCosts: "Kosten opslaan", progress: "Voortgang", overdue: "Te laat", manageHint: "Updates worden gesynchroniseerd met het bedrijf en toegewezen werknemers." },
};

function taskStatusLabel(status: ProjectTask["status"], text: Copy) {
  if (status === "in_progress") return text.inProgress;
  if (status === "done") return text.done;
  if (status === "blocked") return text.blocked;
  return text.todo;
}

function taskStatusColor(status: ProjectTask["status"]) {
  if (status === "done") return workspaceColors.green;
  if (status === "blocked") return workspaceColors.redSoft;
  if (status === "in_progress") return workspaceColors.blueSoft;
  return workspaceColors.muted;
}

export function ProjectOperationsPanel({ project }: { project: Project }) {
  const { user } = useAuth();
  const { state, language, updateProject } = useWorklyData();
  const text = COPY[language];
  const canManage =
    user?.role === "company" && Boolean(user.permissions?.includes("projects.manage"));
  const [tab, setTab] = useState<Tab>("planning");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPhase, setTaskPhase] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [safetyTitle, setSafetyTitle] = useState("");
  const [safetyKind, setSafetyKind] = useState<ProjectSafetyItem["kind"]>("briefing");
  const [safetySeverity, setSafetySeverity] = useState<ProjectSafetyItem["severity"]>("low");
  const [budget, setBudget] = useState(String(project.costs?.budget ?? 0));
  const [committed, setCommitted] = useState(String(project.costs?.committed ?? 0));
  const [labour, setLabour] = useState(String(project.costs?.labour ?? 0));
  const [materials, setMaterials] = useState(String(project.costs?.materials ?? 0));
  const [busy, setBusy] = useState(false);

  const tasks = project.tasks ?? [];
  const safety = project.safety_items ?? [];
  const assignedWorkers = useMemo(
    () =>
      (state?.workers ?? []).filter((worker) => project.worker_ids.includes(worker.id)),
    [project.worker_ids, state?.workers],
  );
  const completedTasks = tasks.filter((item) => item.status === "done").length;
  const taskProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const savePatch = async (patch: Partial<Project>) => {
    if (busy) return;
    setBusy(true);
    try {
      await updateProject(project.id, patch);
    } finally {
      setBusy(false);
    }
  };

  const addTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;
    const next: ProjectTask = {
      id: `task-${Date.now().toString(36)}`,
      title,
      phase: taskPhase.trim(),
      due_date: taskDue.trim(),
      assignee_id: taskAssignee || null,
      status: "todo",
      progress: 0,
    };
    await savePatch({ tasks: [...tasks, next] });
    setTaskTitle("");
    setTaskPhase("");
    setTaskDue("");
    setTaskAssignee("");
  };

  const setTaskStatus = async (taskId: string, status: ProjectTask["status"]) => {
    const next = tasks.map((task) =>
      task.id === taskId
        ? { ...task, status, progress: status === "done" ? 100 : status === "in_progress" ? Math.max(task.progress, 25) : task.progress }
        : task,
    );
    await savePatch({ tasks: next });
  };

  const addSafety = async () => {
    const title = safetyTitle.trim();
    if (!title) return;
    const next: ProjectSafetyItem = {
      id: `safety-${Date.now().toString(36)}`,
      kind: safetyKind,
      title,
      severity: safetySeverity,
      status: "open",
      created_at: new Date().toISOString(),
      owner_id: user?.id ?? null,
      note: "",
    };
    await savePatch({ safety_items: [next, ...safety] });
    setSafetyTitle("");
    setSafetyKind("briefing");
    setSafetySeverity("low");
  };

  const toggleSafety = async (itemId: string) => {
    const next = safety.map((item) =>
      item.id === itemId
        ? { ...item, status: item.status === "resolved" ? "open" as const : "resolved" as const }
        : item,
    );
    await savePatch({ safety_items: next });
  };

  const costs = project.costs ?? { budget: 0, committed: 0, labour: 0, materials: 0 };
  const forecast = Number(labour || 0) + Number(materials || 0) + Number(committed || 0);
  const available = Number(budget || 0) - forecast;

  return (
    <Card>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <SectionTitle
            title="WORKLY Project Control"
            subtitle={text.manageHint}
          />
        </View>
        <Text style={styles.progress}>{text.progress} {taskProgress}%</Text>
      </View>

      <View style={styles.tabs}>
        {(["planning", "safety", ...(user?.role === "company" ? ["costs"] : [])] as Tab[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tab, tab === item ? styles.tabActive : null]}
          >
            <Ionicons
              name={item === "planning" ? "list-outline" : item === "safety" ? "shield-checkmark-outline" : "cash-outline"}
              size={16}
              color={tab === item ? workspaceColors.blueSoft : workspaceColors.muted}
            />
            <Text style={[styles.tabText, tab === item ? styles.tabTextActive : null]}>
              {text[item]}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "planning" ? (
        <View style={styles.section}>
          {canManage ? (
            <View style={styles.formBox}>
              <Field label={text.taskTitle} value={taskTitle} onChangeText={setTaskTitle} />
              <View style={styles.formRow}>
                <Field style={styles.flexField} label={text.phase} value={taskPhase} onChangeText={setTaskPhase} />
                <Field style={styles.flexField} label={text.due} value={taskDue} onChangeText={setTaskDue} placeholder="2026-09-30" />
              </View>
              <Text style={styles.label}>{text.assignee}</Text>
              <View style={styles.choiceRow}>
                <Button compact label={text.unassigned} variant={!taskAssignee ? "primary" : "secondary"} onPress={() => setTaskAssignee("")} />
                {assignedWorkers.map((worker) => (
                  <Button key={worker.id} compact label={worker.name} variant={taskAssignee === worker.id ? "primary" : "secondary"} onPress={() => setTaskAssignee(worker.id)} />
                ))}
              </View>
              <Button label={text.addTask} icon="add-outline" disabled={!taskTitle.trim()} loading={busy} onPress={() => void addTask()} />
            </View>
          ) : null}

          {tasks.length ? tasks.map((task) => {
            const assignee = assignedWorkers.find((worker) => worker.id === task.assignee_id);
            const overdue = Boolean(task.due_date && task.status !== "done" && new Date(`${task.due_date}T23:59:59`).getTime() < Date.now());
            const color = taskStatusColor(task.status);
            return (
              <View key={task.id} style={styles.item}>
                <View style={[styles.iconBox, { borderColor: `${color}66` }]}>
                  <Ionicons name={task.status === "done" ? "checkmark-circle" : task.status === "blocked" ? "alert-circle" : "construct-outline"} size={18} color={color} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.itemTitle}>{task.title}</Text>
                  <Text style={styles.meta}>{[task.phase, assignee?.name, task.due_date].filter(Boolean).join(" · ") || "—"}</Text>
                  {overdue ? <Text style={styles.overdue}>{text.overdue}</Text> : null}
                </View>
                {canManage ? (
                  <View style={styles.statusChoices}>
                    {(["todo", "in_progress", "done", "blocked"] as ProjectTask["status"][]).map((status) => (
                      <Pressable key={status} disabled={busy} onPress={() => void setTaskStatus(task.id, status)} style={[styles.statusChip, task.status === status ? { borderColor: color, backgroundColor: `${color}16` } : null]}>
                        <Text style={[styles.statusText, task.status === status ? { color } : null]}>{taskStatusLabel(status, text)}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.statusReadOnly, { color }]}>{taskStatusLabel(task.status, text)}</Text>
                )}
              </View>
            );
          }) : <Text style={styles.empty}>{text.noTasks}</Text>}
        </View>
      ) : null}

      {tab === "safety" ? (
        <View style={styles.section}>
          {canManage ? (
            <View style={styles.formBox}>
              <Field label={text.safetyTitle} value={safetyTitle} onChangeText={setSafetyTitle} />
              <View style={styles.choiceRow}>
                {(["briefing", "inspection", "incident", "near_miss"] as ProjectSafetyItem["kind"][]).map((kind) => (
                  <Button key={kind} compact label={kind === "briefing" ? text.briefing : kind === "inspection" ? text.inspection : kind === "incident" ? text.incident : text.nearMiss} variant={safetyKind === kind ? "primary" : "secondary"} onPress={() => setSafetyKind(kind)} />
                ))}
              </View>
              <View style={styles.choiceRow}>
                {(["low", "medium", "high"] as ProjectSafetyItem["severity"][]).map((severity) => (
                  <Button key={severity} compact label={severity === "low" ? text.low : severity === "medium" ? text.medium : text.high} variant={safetySeverity === severity ? "primary" : "secondary"} onPress={() => setSafetySeverity(severity)} />
                ))}
              </View>
              <Button label={text.addSafety} icon="shield-outline" disabled={!safetyTitle.trim()} loading={busy} onPress={() => void addSafety()} />
            </View>
          ) : null}

          {safety.length ? safety.map((item) => {
            const color = item.severity === "high" ? workspaceColors.redSoft : item.severity === "medium" ? workspaceColors.yellow : workspaceColors.green;
            return (
              <Pressable key={item.id} disabled={!canManage || busy} onPress={() => void toggleSafety(item.id)} style={styles.item}>
                <View style={[styles.iconBox, { borderColor: `${color}66` }]}><Ionicons name={item.kind === "incident" ? "warning-outline" : item.kind === "inspection" ? "search-outline" : item.kind === "near_miss" ? "alert-outline" : "megaphone-outline"} size={18} color={color} /></View>
                <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.meta}>{item.kind.replace("_", " ")} · {item.severity} · {new Date(item.created_at).toLocaleDateString()}</Text></View>
                <Text style={[styles.statusReadOnly, { color: item.status === "resolved" ? workspaceColors.green : color }]}>{item.status === "resolved" ? text.resolved : text.open}</Text>
              </Pressable>
            );
          }) : <Text style={styles.empty}>{text.noSafety}</Text>}
        </View>
      ) : null}

      {tab === "costs" && user?.role === "company" ? (
        <View style={styles.section}>
          <View style={styles.costGrid}>
            <CostMetric label={text.budget} value={Number(budget || costs.budget)} />
            <CostMetric label={text.forecast} value={forecast} />
            <CostMetric label={text.available} value={available} negative={available < 0} />
          </View>
          {canManage ? (
            <View style={styles.formBox}>
              <View style={styles.formRow}>
                <Field style={styles.flexField} label={text.budget} value={budget} keyboardType="numeric" onChangeText={setBudget} />
                <Field style={styles.flexField} label={text.committed} value={committed} keyboardType="numeric" onChangeText={setCommitted} />
              </View>
              <View style={styles.formRow}>
                <Field style={styles.flexField} label={text.labour} value={labour} keyboardType="numeric" onChangeText={setLabour} />
                <Field style={styles.flexField} label={text.materials} value={materials} keyboardType="numeric" onChangeText={setMaterials} />
              </View>
              <Button label={text.saveCosts} icon="save-outline" loading={busy} onPress={() => void savePatch({ costs: { budget: Number(budget) || 0, committed: Number(committed) || 0, labour: Number(labour) || 0, materials: Number(materials) || 0 } })} />
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function CostMetric({ label, value, negative = false }: { label: string; value: number; negative?: boolean }) {
  return (
    <View style={styles.costMetric}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={[styles.costValue, negative ? { color: workspaceColors.redSoft } : null]}>{Number.isFinite(value) ? `${Math.round(value).toLocaleString()} €` : "0 €"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  progress: { color: workspaceColors.blueSoft, fontSize: 11, fontWeight: "800" },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14, marginBottom: 14 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  tabActive: { borderColor: `${workspaceColors.blueSoft}66`, backgroundColor: `${workspaceColors.blueSoft}12` },
  tabText: { color: workspaceColors.muted, fontSize: 10, fontWeight: "700" },
  tabTextActive: { color: workspaceColors.blueSoft },
  section: { gap: 9 },
  formBox: { gap: 10, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 12, backgroundColor: workspaceColors.panelSoft, padding: 12 },
  formRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  flexField: { flex: 1, minWidth: 150 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  label: { color: workspaceColors.textSoft, fontSize: 10, fontWeight: "700" },
  item: { flexDirection: "row", alignItems: "center", gap: 10, padding: 11, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 12, backgroundColor: workspaceColors.panelSoft },
  iconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  itemTitle: { color: workspaceColors.text, fontSize: 12, fontWeight: "800" },
  meta: { color: workspaceColors.muted, fontSize: 9, lineHeight: 14 },
  overdue: { color: workspaceColors.redSoft, fontSize: 9, fontWeight: "800", marginTop: 2 },
  statusChoices: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 5, maxWidth: 290 },
  statusChip: { borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5 },
  statusText: { color: workspaceColors.muted, fontSize: 8, fontWeight: "700" },
  statusReadOnly: { fontSize: 9, fontWeight: "800" },
  empty: { color: workspaceColors.muted, fontSize: 10, paddingVertical: 12 },
  costGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  costMetric: { flex: 1, minWidth: 130, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 12, padding: 12, backgroundColor: workspaceColors.panelSoft },
  costValue: { color: workspaceColors.text, fontSize: 18, fontWeight: "900", marginTop: 5 },
});
