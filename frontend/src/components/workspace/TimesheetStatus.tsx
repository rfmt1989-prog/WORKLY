import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/src/api/client";
import type { Attendance, LanguageCode, TimesheetApprovalStatus } from "@/src/demo/types";

import { Button, Field, ModalPanel, workspaceColors } from "./primitives";

type Copy = {
  pending: string;
  approved: string;
  rejected: string;
  approve: string;
  reject: string;
  rejectionTitle: string;
  rejectionSubtitle: string;
  reason: string;
  reasonPlaceholder: string;
  close: string;
  confirmReject: string;
};

const copy: Record<LanguageCode, Copy> = {
  pt: { pending: "Por aprovar", approved: "Aprovado", rejected: "Rejeitado", approve: "Aprovar", reject: "Rejeitar", rejectionTitle: "Rejeitar horas", rejectionSubtitle: "Indica o motivo para o trabalhador saber o que deve ser corrigido.", reason: "Motivo", reasonPlaceholder: "Ex.: hora de saída incorreta", close: "Cancelar", confirmReject: "Rejeitar horas" },
  en: { pending: "Pending", approved: "Approved", rejected: "Rejected", approve: "Approve", reject: "Reject", rejectionTitle: "Reject hours", rejectionSubtitle: "Add a reason so the worker knows what needs to be corrected.", reason: "Reason", reasonPlaceholder: "E.g. incorrect check-out time", close: "Cancel", confirmReject: "Reject hours" },
  fr: { pending: "À approuver", approved: "Approuvé", rejected: "Rejeté", approve: "Approuver", reject: "Rejeter", rejectionTitle: "Rejeter les heures", rejectionSubtitle: "Indiquez le motif afin que le travailleur sache ce qui doit être corrigé.", reason: "Motif", reasonPlaceholder: "Ex. : heure de sortie incorrecte", close: "Annuler", confirmReject: "Rejeter les heures" },
  es: { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado", approve: "Aprobar", reject: "Rechazar", rejectionTitle: "Rechazar horas", rejectionSubtitle: "Indica el motivo para que el trabajador sepa qué debe corregir.", reason: "Motivo", reasonPlaceholder: "Ej.: hora de salida incorrecta", close: "Cancelar", confirmReject: "Rechazar horas" },
  ro: { pending: "În așteptare", approved: "Aprobat", rejected: "Respins", approve: "Aprobă", reject: "Respinge", rejectionTitle: "Respinge orele", rejectionSubtitle: "Adaugă motivul pentru ca lucrătorul să știe ce trebuie corectat.", reason: "Motiv", reasonPlaceholder: "Ex.: ora de ieșire este incorectă", close: "Anulează", confirmReject: "Respinge orele" },
  de: { pending: "Ausstehend", approved: "Genehmigt", rejected: "Abgelehnt", approve: "Genehmigen", reject: "Ablehnen", rejectionTitle: "Stunden ablehnen", rejectionSubtitle: "Geben Sie einen Grund an, damit der Mitarbeiter weiß, was korrigiert werden muss.", reason: "Grund", reasonPlaceholder: "Z. B. falsche Check-out-Zeit", close: "Abbrechen", confirmReject: "Stunden ablehnen" },
  nl: { pending: "Te beoordelen", approved: "Goedgekeurd", rejected: "Afgekeurd", approve: "Goedkeuren", reject: "Afkeuren", rejectionTitle: "Uren afkeuren", rejectionSubtitle: "Geef een reden zodat de werknemer weet wat moet worden gecorrigeerd.", reason: "Reden", reasonPlaceholder: "Bijv. onjuiste uitchecktijd", close: "Annuleren", confirmReject: "Uren afkeuren" },
};

function resolvedStatus(record: Attendance): TimesheetApprovalStatus {
  return record.approval_status ?? "pending";
}

function statusColor(status: TimesheetApprovalStatus) {
  if (status === "approved") return workspaceColors.green;
  if (status === "rejected") return workspaceColors.redSoft;
  return workspaceColors.yellow;
}

export function TimesheetStatus({
  record,
  language,
  canManage = false,
  onChanged,
}: {
  record: Attendance;
  language: LanguageCode;
  canManage?: boolean;
  onChanged?: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const t = copy[language];
  const status = resolvedStatus(record);
  const color = statusColor(status);

  if (!record.check_out) return null;

  const update = async (nextStatus: "approved" | "rejected", note = "") => {
    if (busy) return;
    setBusy(true);
    try {
      await api.patch<Attendance>(`/attendance/${record.id}/approval`, {
        status: nextStatus,
        note,
      });
      await onChanged?.();
      setRejectOpen(false);
      setReason("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View style={styles.wrap}>
        <View style={[styles.badge, { borderColor: `${color}66`, backgroundColor: `${color}12` }]}>
          <Ionicons
            name={status === "approved" ? "checkmark-circle-outline" : status === "rejected" ? "close-circle-outline" : "hourglass-outline"}
            size={13}
            color={color}
          />
          <Text style={[styles.badgeText, { color }]}>{t[status]}</Text>
        </View>
        {canManage ? (
          <View style={styles.actions}>
            {status !== "approved" ? (
              <Button compact label={t.approve} icon="checkmark" accent={workspaceColors.green} loading={busy} onPress={() => void update("approved")} />
            ) : null}
            {status !== "rejected" ? (
              <Button compact label={t.reject} icon="close" variant="danger" disabled={busy} onPress={() => setRejectOpen(true)} />
            ) : null}
          </View>
        ) : null}
        {status === "rejected" && record.approval_note ? (
          <Text style={styles.note} numberOfLines={2}>{record.approval_note}</Text>
        ) : null}
      </View>

      <ModalPanel
        visible={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={t.rejectionTitle}
        subtitle={t.rejectionSubtitle}
        footer={
          <>
            <Button label={t.close} variant="ghost" onPress={() => setRejectOpen(false)} />
            <Button
              label={t.confirmReject}
              icon="close-circle-outline"
              variant="danger"
              loading={busy}
              disabled={!reason.trim()}
              onPress={() => void update("rejected", reason.trim())}
            />
          </>
        }
      >
        <Field
          label={t.reason}
          placeholder={t.reasonPlaceholder}
          multiline
          value={reason}
          onChangeText={setReason}
        />
      </ModalPanel>
    </>
  );
}

export function timesheetStatus(record: Attendance): TimesheetApprovalStatus {
  return resolvedStatus(record);
}

const styles = StyleSheet.create({
  wrap: { gap: 6, alignItems: "flex-start" },
  badge: { minHeight: 28, borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  badgeText: { fontSize: 9, lineHeight: 13, fontWeight: "900" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  note: { maxWidth: 190, color: workspaceColors.redSoft, fontSize: 9, lineHeight: 13 },
});
