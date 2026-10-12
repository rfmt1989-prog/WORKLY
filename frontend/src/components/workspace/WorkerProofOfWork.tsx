import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { professionalText } from "@/src/demo/professionalI18n";
import type {
  Attendance,
  Certificate,
  Company,
  LanguageCode,
  Project,
} from "@/src/demo/types";
import { evidenceTypeDefinition } from "./competencyEvidenceModel";
import { verifiedAttendanceHours } from "./workerExperience";

export type ProofOfWorkEntry = {
  evidence: Certificate;
  project: Project | null;
  approvedProjectHours: number;
  validator: string;
  verified: boolean;
};

export function proofOfWorkEntries({
  workerId,
  evidence,
  projects,
  attendance,
  companies,
}: {
  workerId: string;
  evidence: Certificate[];
  projects: Project[];
  attendance: Attendance[];
  companies: Company[];
}): ProofOfWorkEntry[] {
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const companyMap = new Map(companies.map((company) => [company.id, company.name]));

  return evidence
    .filter((item) =>
      ["work_record", "employer_validation", "technical_assessment"].includes(
        item.evidence_type || "",
      ),
    )
    .map((item) => {
      const project = item.project_id ? projectMap.get(item.project_id) || null : null;
      const validator =
        (item.verified_by_company_id &&
          companyMap.get(item.verified_by_company_id)) ||
        item.issuer ||
        "";
      return {
        evidence: item,
        project,
        approvedProjectHours: project
          ? verifiedAttendanceHours(workerId, attendance, project.id)
          : 0,
        validator,
        verified: item.status === "verified",
      };
    })
    .sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return (b.evidence.verified_at || b.evidence.issued_at || "").localeCompare(
        a.evidence.verified_at || a.evidence.issued_at || "",
      );
    });
}

export function WorkerProofOfWork({
  workerId,
  evidence,
  projects,
  attendance,
  companies,
  language,
}: {
  workerId: string;
  evidence: Certificate[];
  projects: Project[];
  attendance: Attendance[];
  companies: Company[];
  language: LanguageCode;
}) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const entries = proofOfWorkEntries({
    workerId,
    evidence,
    projects,
    attendance,
    companies,
  });

  if (!entries.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="link-outline" size={17} color="#6F8AA0" />
        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>
            {text("Sem Proof of Work", "No Proof of Work")}
          </Text>
          <Text style={styles.emptyText}>
            {text(
              "Liga esta competência a uma Obra WORKLY para criar uma prova rastreável.",
              "Link this competence to a WORKLY project to create traceable proof.",
            )}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry) => {
        const definition = evidenceTypeDefinition(entry.evidence.evidence_type);
        const projectName =
          entry.project?.name ||
          entry.evidence.context ||
          text("Intervenção externa", "External intervention");
        const hasWorklyChain = Boolean(
          entry.project &&
            entry.approvedProjectHours > 0 &&
            entry.evidence.competency_id,
        );
        const verificationLabel = entry.verified
          ? text("VALIDADO", "VERIFIED")
          : entry.evidence.status === "pending"
            ? text("A VALIDAR", "PENDING")
            : text("REGISTADO", "RECORDED");

        return (
          <View key={entry.evidence.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.projectIcon}>
                <Ionicons
                  name={hasWorklyChain ? "shield-checkmark-outline" : "briefcase-outline"}
                  size={17}
                  color={hasWorklyChain ? "#95C7A9" : "#C96954"}
                />
              </View>
              <View style={styles.projectCopy}>
                <Text style={styles.projectName}>{projectName}</Text>
                <Text style={styles.evidenceType}>
                  {definition
                    ? text(definition.label, definition.labelEn)
                    : text("Evidência profissional", "Professional evidence")}
                </Text>
              </View>
              <View
                style={[
                  styles.status,
                  entry.verified
                    ? styles.statusVerified
                    : entry.evidence.status === "pending"
                      ? styles.statusPending
                      : styles.statusRecorded,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    entry.verified
                      ? styles.statusTextVerified
                      : entry.evidence.status === "pending"
                        ? styles.statusTextPending
                        : styles.statusTextRecorded,
                  ]}
                >
                  {verificationLabel}
                </Text>
              </View>
            </View>

            <View style={styles.chain}>
              <ChainStep
                icon="business-outline"
                label={text("Obra", "Project")}
                value={entry.project ? "WORKLY" : text("Externa", "External")}
                complete={Boolean(entry.project)}
              />
              <ChainConnector complete={Boolean(entry.project)} />
              <ChainStep
                icon="time-outline"
                label={text("Horas", "Hours")}
                value={
                  entry.project
                    ? String(entry.approvedProjectHours) + " h"
                    : entry.evidence.hours
                      ? String(entry.evidence.hours) + " h"
                      : "—"
                }
                complete={entry.approvedProjectHours > 0}
              />
              <ChainConnector complete={entry.approvedProjectHours > 0} />
              <ChainStep
                icon="construct-outline"
                label={text("Competência", "Competence")}
                value={entry.evidence.competency_id ? "✓" : "—"}
                complete={Boolean(entry.evidence.competency_id)}
              />
              <ChainConnector complete={entry.verified} />
              <ChainStep
                icon="shield-checkmark-outline"
                label={text("Empresa", "Employer")}
                value={entry.verified ? "✓" : "—"}
                complete={entry.verified}
              />
            </View>

            {entry.evidence.context ? (
              <Text style={styles.context}>{entry.evidence.context}</Text>
            ) : null}

            <View style={styles.audit}>
              <Text style={styles.auditLabel}>
                {entry.verified
                  ? text("Validação independente", "Independent validation")
                  : text("Estado da prova", "Proof status")}
              </Text>
              <Text style={styles.auditValue}>
                {entry.verified
                  ? [
                      entry.validator || text("Empresa WORKLY", "WORKLY employer"),
                      entry.evidence.verified_at || "",
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : text(
                      "Ainda não confirmada pela empresa.",
                      "Not yet confirmed by the employer.",
                    )}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ChainStep({
  icon,
  label,
  value,
  complete,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  complete: boolean;
}) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepDot, complete && styles.stepDotComplete]}>
        <Ionicons
          name={icon}
          size={12}
          color={complete ? "#95C7A9" : "#648096"}
        />
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
      <Text style={[styles.stepValue, complete && styles.stepValueComplete]}>
        {value}
      </Text>
    </View>
  );
}

function ChainConnector({ complete }: { complete: boolean }) {
  return <View style={[styles.connector, complete && styles.connectorComplete]} />;
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  empty: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor:"#40596A",
    borderRadius: 12,
    backgroundColor:"#172736",
    padding: 12,
  },
  emptyCopy: { flex: 1, minWidth: 0, gap: 2 },
  emptyTitle: { color:"#EDF5F7", fontSize: 11, fontWeight: "700" },
  emptyText: { color:"#AEC2CB", fontSize: 10, lineHeight: 16 },
  card: {
    borderWidth: 1,
    borderColor:"#40596A",
    borderRadius: 14,
    backgroundColor:"#172736",
    padding: 12,
    gap: 12,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  projectIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:"#40596A",
    backgroundColor:"#284354",
    alignItems: "center",
    justifyContent: "center",
  },
  projectCopy: { flex: 1, minWidth: 0, gap: 2 },
  projectName: { color:"#EDF5F7", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  evidenceType: { color:"#AEC2CB", fontSize: 9, lineHeight: 13 },
  status: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  statusVerified: { borderColor:"#40596A", backgroundColor:"#284354" },
  statusPending: { borderColor:"#40596A", backgroundColor:"#284354" },
  statusRecorded: { borderColor:"#40596A", backgroundColor:"#284354" },
  statusText: { fontSize: 7, lineHeight: 10, fontWeight: "800", letterSpacing: .7 },
  statusTextVerified: { color:"#91C9DD" },
  statusTextPending: { color:"#AEC2CB" },
  statusTextRecorded: { color:"#AEC2CB" },
  chain: { flexDirection: "row", alignItems: "flex-start" },
  step: { width: 54, alignItems: "center", gap: 3 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor:"#40596A",
    backgroundColor:"#284354",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotComplete: { borderColor:"#40596A", backgroundColor:"#284354" },
  stepLabel: { color:"#AEC2CB", fontSize: 7, lineHeight: 10, textAlign: "center" },
  stepValue: { color:"#EDF5F7", fontSize: 8, lineHeight: 11, fontWeight: "700", textAlign: "center" },
  stepValueComplete: { color:"#91C9DD" },
  connector: {
    flex: 1,
    minWidth: 8,
    height: 1,
    marginTop: 13,
    backgroundColor:"#223747",
  },
  connectorComplete: { backgroundColor:"#284354" },
  context: {
    color:"#AEC2CB",
    fontSize: 10,
    lineHeight: 16,
    borderTopWidth: 1,
    borderTopColor:"#40596A",
    paddingTop: 9,
  },
  audit: { gap: 2 },
  auditLabel: {
    color:"#AEC2CB",
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: .7,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  auditValue: { color:"#EDF5F7", fontSize: 9, lineHeight: 14 },
});
