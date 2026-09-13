import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { LanguageCode } from "@/src/demo/types";

import { Button, ModalPanel, roleAccent, workspaceColors } from "./primitives";

type ComplianceRow = {
  worker_id: string;
  worker_name: string;
  project_id: string;
  project_name: string;
  status: "fit" | "attention" | "blocked";
  issues: { label: string }[];
};

type CompliancePayload = { rows: ComplianceRow[] };

type AlertTone = "danger" | "warning" | "info";
type AlertItem = {
  id: string;
  title: string;
  message: string;
  tone: AlertTone;
  createdAt?: string;
  stored?: boolean;
  read?: boolean;
};

type Copy = {
  title: string;
  subtitle: string;
  clear: string;
  noAlerts: string;
  live: string;
  inbox: string;
  complianceBlocked: string;
  complianceAttention: string;
  overdueTask: string;
  blockedTask: string;
  safetyHigh: string;
  pendingHours: string;
  rejectedHours: string;
  actionRequired: string;
};

const COPY: Record<LanguageCode, Copy> = {
  pt: { title: "Alertas", subtitle: "Prioridades operacionais em tempo real", clear: "Marcar mensagens como lidas", noAlerts: "Sem alertas ativos.", live: "Operacional", inbox: "Mensagens", complianceBlocked: "Conformidade bloqueada", complianceAttention: "Conformidade em atenção", overdueTask: "Tarefa atrasada", blockedTask: "Tarefa bloqueada", safetyHigh: "Safety prioritário", pendingHours: "Horas por aprovar", rejectedHours: "Horas rejeitadas", actionRequired: "Requer ação" },
  en: { title: "Alerts", subtitle: "Real-time operational priorities", clear: "Mark messages as read", noAlerts: "No active alerts.", live: "Operational", inbox: "Messages", complianceBlocked: "Compliance blocked", complianceAttention: "Compliance attention", overdueTask: "Overdue task", blockedTask: "Blocked task", safetyHigh: "Priority safety", pendingHours: "Hours awaiting approval", rejectedHours: "Rejected hours", actionRequired: "Action required" },
  fr: { title: "Alertes", subtitle: "Priorités opérationnelles en temps réel", clear: "Marquer les messages comme lus", noAlerts: "Aucune alerte active.", live: "Opérationnel", inbox: "Messages", complianceBlocked: "Conformité bloquée", complianceAttention: "Conformité à surveiller", overdueTask: "Tâche en retard", blockedTask: "Tâche bloquée", safetyHigh: "Sécurité prioritaire", pendingHours: "Heures à approuver", rejectedHours: "Heures rejetées", actionRequired: "Action requise" },
  es: { title: "Alertas", subtitle: "Prioridades operativas en tiempo real", clear: "Marcar mensajes como leídos", noAlerts: "Sin alertas activas.", live: "Operativo", inbox: "Mensajes", complianceBlocked: "Cumplimiento bloqueado", complianceAttention: "Cumplimiento en atención", overdueTask: "Tarea atrasada", blockedTask: "Tarea bloqueada", safetyHigh: "Seguridad prioritaria", pendingHours: "Horas por aprobar", rejectedHours: "Horas rechazadas", actionRequired: "Requiere acción" },
  ro: { title: "Alerte", subtitle: "Priorități operaționale în timp real", clear: "Marchează mesajele ca citite", noAlerts: "Nu există alerte active.", live: "Operațional", inbox: "Mesaje", complianceBlocked: "Conformitate blocată", complianceAttention: "Conformitate de urmărit", overdueTask: "Sarcină întârziată", blockedTask: "Sarcină blocată", safetyHigh: "Siguranță prioritară", pendingHours: "Ore de aprobat", rejectedHours: "Ore respinse", actionRequired: "Necesită acțiune" },
  de: { title: "Warnungen", subtitle: "Operative Prioritäten in Echtzeit", clear: "Nachrichten als gelesen markieren", noAlerts: "Keine aktiven Warnungen.", live: "Operativ", inbox: "Nachrichten", complianceBlocked: "Compliance blockiert", complianceAttention: "Compliance beachten", overdueTask: "Überfällige Aufgabe", blockedTask: "Blockierte Aufgabe", safetyHigh: "Prioritäre Sicherheit", pendingHours: "Stunden zur Freigabe", rejectedHours: "Abgelehnte Stunden", actionRequired: "Aktion erforderlich" },
  nl: { title: "Meldingen", subtitle: "Operationele prioriteiten in realtime", clear: "Berichten als gelezen markeren", noAlerts: "Geen actieve meldingen.", live: "Operationeel", inbox: "Berichten", complianceBlocked: "Compliance geblokkeerd", complianceAttention: "Compliance aandacht", overdueTask: "Te late taak", blockedTask: "Geblokkeerde taak", safetyHigh: "Prioritaire veiligheid", pendingHours: "Uren ter goedkeuring", rejectedHours: "Afgekeurde uren", actionRequired: "Actie vereist" },
};

function toneColor(tone: AlertTone) {
  if (tone === "danger") return workspaceColors.redSoft;
  if (tone === "warning") return workspaceColors.yellow;
  return workspaceColors.blueSoft;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const { state, language, reload } = useWorklyData();
  const [visible, setVisible] = useState(false);
  const [compliance, setCompliance] = useState<CompliancePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const text = COPY[language];
  const accent = roleAccent(user?.role ?? "worker");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) return;
      try {
        const payload = await api.get<CompliancePayload>("/compliance");
        if (active) setCompliance(payload);
      } catch {
        // The rest of the alert center remains useful if compliance is unavailable.
      }
    };
    void load();
    const timer = globalThis.setInterval(() => void load(), 30_000);
    return () => {
      active = false;
      globalThis.clearInterval(timer);
    };
  }, [user?.id]);

  const targetId = user?.role === "company" ? user.company_id ?? user.id : user?.id;
  const storedAlerts = useMemo<AlertItem[]>(() => {
    if (!state || !targetId) return [];
    return state.notifications
      .filter((item) => item.target_id === targetId)
      .map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        tone: "info" as const,
        createdAt: item.created_at,
        stored: true,
        read: item.read,
      }));
  }, [state, targetId]);

  const liveAlerts = useMemo<AlertItem[]>(() => {
    if (!state || !user) return [];
    const result: AlertItem[] = [];
    const now = Date.now();
    const companyId = user.company_id ?? user.id;
    const projects = state.projects.filter((project) =>
      user.role === "company"
        ? project.company_id === companyId
        : project.worker_ids.includes(user.id),
    );

    for (const row of compliance?.rows ?? []) {
      if (row.status === "fit") continue;
      result.push({
        id: `compliance-${row.worker_id}-${row.project_id}`,
        title: row.status === "blocked" ? text.complianceBlocked : text.complianceAttention,
        message: `${row.worker_name} · ${row.project_name}${row.issues[0]?.label ? ` · ${row.issues[0].label}` : ""}`,
        tone: row.status === "blocked" ? "danger" : "warning",
      });
    }

    for (const project of projects) {
      for (const task of project.tasks ?? []) {
        const assignedToUser = user.role === "company" || !task.assignee_id || task.assignee_id === user.id;
        if (!assignedToUser || task.status === "done") continue;
        const overdue = Boolean(task.due_date && new Date(`${task.due_date}T23:59:59`).getTime() < now);
        if (task.status === "blocked" || overdue) {
          result.push({
            id: `task-${project.id}-${task.id}`,
            title: task.status === "blocked" ? text.blockedTask : text.overdueTask,
            message: `${project.name} · ${task.title}`,
            tone: task.status === "blocked" ? "danger" : "warning",
          });
        }
      }
      if (user.role === "company") {
        for (const item of project.safety_items ?? []) {
          if (item.status === "open" && item.severity === "high") {
            result.push({
              id: `safety-${project.id}-${item.id}`,
              title: text.safetyHigh,
              message: `${project.name} · ${item.title}`,
              tone: "danger",
            });
          }
        }
      }
    }

    if (user.role === "company") {
      const pending = state.attendance.filter(
        (item) => item.company_id === companyId && item.check_out && item.approval_status === "pending",
      ).length;
      if (pending) {
        result.push({
          id: "attendance-pending",
          title: text.pendingHours,
          message: `${pending} · ${text.actionRequired}`,
          tone: "warning",
        });
      }
    } else {
      const rejected = state.attendance.filter(
        (item) => item.worker_id === user.id && item.approval_status === "rejected",
      ).length;
      if (rejected) {
        result.push({
          id: "attendance-rejected",
          title: text.rejectedHours,
          message: `${rejected} · ${text.actionRequired}`,
          tone: "danger",
        });
      }
    }
    return result;
  }, [compliance?.rows, state, text, user]);

  const unreadStored = storedAlerts.filter((item) => !item.read).length;
  const unread = liveAlerts.length + unreadStored;

  const markAllRead = async () => {
    if (busy || !unreadStored) return;
    setBusy(true);
    try {
      await api.post("/notifications/read-all");
      await reload(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${text.title}: ${unread}`}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.trigger, pressed ? { opacity: 0.7 } : null]}
      >
        <Ionicons name={unread ? "notifications" : "notifications-outline"} size={19} color={unread ? accent : workspaceColors.textSoft} />
        {unread ? (
          <View style={[styles.badge, { backgroundColor: workspaceColors.redSoft }]}>
            <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
          </View>
        ) : null}
      </Pressable>

      <ModalPanel
        visible={visible}
        onClose={() => setVisible(false)}
        title={text.title}
        subtitle={text.subtitle}
        footer={
          <>
            {unreadStored ? <Button label={text.clear} variant="secondary" loading={busy} onPress={() => void markAllRead()} /> : null}
            <Button label="OK" accent={accent} onPress={() => setVisible(false)} />
          </>
        }
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {liveAlerts.length ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{text.live} · {liveAlerts.length}</Text>
              {liveAlerts.map((item) => <AlertRow key={item.id} item={item} />)}
            </View>
          ) : null}
          {storedAlerts.length ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{text.inbox} · {storedAlerts.length}</Text>
              {storedAlerts.map((item) => <AlertRow key={item.id} item={item} />)}
            </View>
          ) : null}
          {!liveAlerts.length && !storedAlerts.length ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={34} color={workspaceColors.green} />
              <Text style={styles.emptyText}>{text.noAlerts}</Text>
            </View>
          ) : null}
        </ScrollView>
      </ModalPanel>
    </>
  );
}

function AlertRow({ item }: { item: AlertItem }) {
  const color = toneColor(item.tone);
  return (
    <View style={[styles.row, item.read ? { opacity: 0.55 } : null]}>
      <View style={[styles.icon, { borderColor: `${color}55`, backgroundColor: `${color}10` }]}>
        <Ionicons name={item.tone === "danger" ? "alert-circle-outline" : item.tone === "warning" ? "warning-outline" : "information-circle-outline"} size={18} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowText}>{item.message}</Text>
        {item.createdAt ? <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text> : null}
      </View>
      {!item.read ? <View style={[styles.unreadDot, { backgroundColor: color }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: workspaceColors.line, backgroundColor: workspaceColors.panel, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900" },
  scroll: { maxHeight: 520 },
  content: { gap: 16, paddingBottom: 4 },
  group: { gap: 8 },
  groupTitle: { color: workspaceColors.textSoft, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 11, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 12, backgroundColor: workspaceColors.panelSoft },
  icon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: workspaceColors.text, fontSize: 11, fontWeight: "800" },
  rowText: { color: workspaceColors.textSoft, fontSize: 9, lineHeight: 14, marginTop: 2 },
  time: { color: workspaceColors.muted, fontSize: 8, marginTop: 3 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  empty: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { color: workspaceColors.textSoft, fontSize: 11, fontWeight: "700" },
});
