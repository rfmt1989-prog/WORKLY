import React, { useState } from "react";
import Ionicons from "./WorklyIcon";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  pickWorklyFile,
  uploadWorklyFile,
  type PickedWorklyFile,
  type StoredDocumentResponse,
} from "@/src/api/documentFiles";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { professionDescription, professionTitle, professionalText } from "@/src/demo/professionalI18n";
import type { Certificate, Worker } from "@/src/demo/types";
import {
  Button,
  Field,
  ModalPanel,
  workspaceColors,
} from "./primitives";
import { type AchievementNode } from "./workerCertificateTree";
import { findProfessionDefinition, professionCatalog } from "./professionCatalog";
import { evidenceTypes, type EvidenceType } from "./competencyEvidenceModel";
import { verifiedAttendanceHours } from "./workerExperience";
import { electromechanicsProfilePreset, electromechanicsCertificates, addDeclaredProfileCertificates } from "./electromechanicsProfilePreset";

export function WorkerIdentityEditor({
  worker,
  onClose,
}: {
  worker: Worker;
  onClose: () => void;
}) {
  const { language, updateWorker } = useWorklyData();
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const [form, setForm] = useState(() => ({
    profession: findProfessionDefinition(worker.profession)?.title || worker.profession,
    title: worker.title || "",
    bio: worker.bio || "",
    specialties: (worker.specialties || []).join(", "),
    languages: worker.languages.join(", "),
  }));
  const [busy, setBusy] = useState(false);
  const [presetChosen, setPresetChosen] = useState(false);
  const [pendingCertificates, setPendingCertificates] = useState<string[]>([]);
  const applyPreset = () => {
    setForm(current => ({
      ...current,
      profession: electromechanicsProfilePreset.profession,
      title: electromechanicsProfilePreset.title,
      bio: electromechanicsProfilePreset.bio,
      specialties: Array.from(new Set([...(worker.specialties || []), ...electromechanicsProfilePreset.specialties])).join(", "),
    }));
    setPresetChosen(true);
    setPendingCertificates(electromechanicsCertificates.map(cert => cert.key));
  };
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    if (busy || !form.profession.trim()) return;
    setBusy(true);
    try {
      await updateWorker(worker.id, {
        profession: form.profession.trim(),
        title: form.title.trim() || form.profession.trim(),
        bio: form.bio.trim(),
        specialties: form.specialties.split(",").map(s => s.trim()).filter(Boolean),
        ...(presetChosen ? { certificates: addDeclaredProfileCertificates(worker, pendingCertificates) } : {}),
        languages: form.languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      onClose();
    } catch {
      /* The shared mutation handler displays the server error. */
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalPanel
      visible
      onClose={() => {
        if (!busy) onClose();
      }}
      title={text("Dados profissionais", "Professional data")}
      footer={
        <>
          <Button
            label={text("Cancelar", "Cancel")}
            variant="secondary"
            disabled={busy}
            onPress={onClose}
          />
          <Button
            label={text("Guardar alterações", "Save changes")}
            loading={busy}
            disabled={!form.profession.trim()}
            onPress={() => void save()}
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.lockedIdentity}>
          <Text style={styles.lockedIdentityTitle}>
            {text("Identidade criada por documento", "Document-backed identity")}
          </Text>
          <Text style={styles.lockedIdentityName}>{worker.name}</Text>
          <Text style={styles.hint}>
            {text(
              "Nome e nacionalidade vêm do Cartão de Cidadão/Passaporte e não são editados neste ecrã.",
              "Name and nationality come from the citizen card/passport and are not edited on this screen.",
            )}
          </Text>
        </View>
        <View style={styles.presetCard} testID="worker-electromechanics-profile-starter">
          <View style={styles.presetHeading}>
            <View style={styles.presetIcon}><Text style={styles.presetIconLetter}>W</Text></View>
            <View style={styles.presetCopy}>
              <Text style={styles.presetTitle}>{text("Perfil técnico", "Technical profile")}</Text>
              <Text style={styles.presetDescription}>{text("Eletromecânica · Refrigeração · Climatização", "Electromechanics · Refrigeration · HVAC")}</Text>
            </View>
          </View>
          <Button
            label={text("Preencher o meu perfil", "Pre-fill my profile")}
            icon="hardware-chip-outline"
            disabled={busy}
            variant="secondary"
            onPress={applyPreset}
            testID="apply-electromechanics-profile"
          />
          {presetChosen ? (
            <View style={styles.presetEvidence}>
              <Text style={styles.presetDisclosure}>{text("Seleciona os registos que declaras possuir. Nenhum será considerado verificado sem comprovativo.", "Select the records you declare you hold. None will be verified without evidence.")}</Text>
              {electromechanicsCertificates.map(item => {
                const checked = pendingCertificates.includes(item.key);
                return (
                  <Pressable key={item.key} accessibilityRole="checkbox" accessibilityState={{ checked }}
                    onPress={() => setPendingCertificates(prev => checked ? prev.filter(key => key !== item.key) : [...prev, item.key])}
                    style={styles.presetEvidenceRow}>
                    <Ionicons name={checked ? "checkbox-outline" : "square-outline"} size={21} color="#4B7E91" />
                    <Text style={styles.presetEvidenceText}>{item.name}</Text>
                  </Pressable>
                );
              })}
              <Text style={styles.presetDisclosure}>{text("Podes alterar os campos antes de guardar. Os documentos e os dados de validação serão adicionados separadamente.", "You can edit the fields before saving. Documents and verification details are added separately.")}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.professionSection}>
          <Text style={styles.sectionLabel}>{text("Profissão principal", "Main profession")}</Text>
          <Text style={styles.hint}>
            {text(
              "Escolhe uma só profissão principal. A árvore profissional é criada a partir desta escolha.",
              "Choose one main profession. The professional tree is created from this choice.",
            )}
          </Text>
          <View style={styles.professionGrid}>
            {professionCatalog.map((profession) => {
              const selected = form.profession === profession.title;
              return (
                <Pressable
                  key={profession.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  disabled={busy}
                  onPress={() => update("profession", profession.title)}
                  style={({ pressed }) => [
                    styles.professionOption,
                    selected && styles.professionOptionSelected,
                    pressed && styles.professionOptionPressed,
                  ]}
                >
                  <View style={[styles.professionIcon, selected && styles.professionIconSelected]}>
                    <Text style={styles.professionGlyph}>{selected ? "◆" : "◇"}</Text>
                  </View>
                  <View style={styles.professionCopy}>
                    <Text style={[styles.professionTitle, selected && styles.professionTitleSelected]}>
                      {professionTitle(language, profession.id, profession.title, profession.titleEn)}
                    </Text>
                    <Text style={styles.professionDescription} numberOfLines={2}>
                      {professionDescription(language, profession.id, profession.description, profession.descriptionEn)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Field label={text("Título profissional", "Professional title")} value={form.title} editable={!busy} onChangeText={value => update("title", value)} />
        <Field label={text("Especializações (separadas por vírgulas)", "Specialties (comma separated)")} value={form.specialties} editable={!busy} onChangeText={value => update("specialties", value)} />
        <Field label={text("Resumo profissional", "Professional summary")} multiline value={form.bio} editable={!busy} onChangeText={value => update("bio", value)} />
        <Field
          label={text(
            "Idiomas (separados por vírgulas)",
            "Languages (comma separated)",
          )}
          value={form.languages}
          editable={!busy}
          onChangeText={(value) => update("languages", value)}
        />
      </View>
    </ModalPanel>
  );
}

export function WorkerCertificateEditor({
  worker,
  professionId,
  node,
  onClose,
}: {
  worker: Worker;
  professionId: string;
  node?: AchievementNode;
  onClose: () => void;
}) {
  const { language, updateWorker, notify, state } = useWorklyData();
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const certificate = node?.certificate;
  const profession = professionId;
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(certificate?.evidence_type || (node?.family === "compliance" ? "authorisation" : node?.kind === "skill" ? "work_record" : "qualification"));
  const kind: "certification" | "skill" = evidenceType === "qualification" || evidenceType === "authorisation" ? "certification" : "skill";
  const [name, setName] = useState(certificate?.name || node?.title || "");
  const [issuer, setIssuer] = useState(certificate?.issuer || "");
  const [issuedAt, setIssuedAt] = useState(certificate?.issued_at || "");
  const [expiresAt, setExpiresAt] = useState(certificate?.expires_at || "");
  const [context, setContext] = useState(certificate?.context || "");
  const [hours, setHours] = useState(certificate?.hours ? String(certificate.hours) : "");
  const [projectId, setProjectId] = useState(certificate?.project_id || "");
  const projectEvidence = ["work_record", "employer_validation", "technical_assessment"].includes(evidenceType);
  const workerProjects = (state?.projects || [])
    .filter((project) => project.worker_ids.includes(worker.id))
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
  const selectedProject = workerProjects.find((project) => project.id === projectId);
  const approvedProjectHours = selectedProject
    ? verifiedAttendanceHours(worker.id, state?.attendance || [], selectedProject.id)
    : 0;
  const [file, setFile] = useState<PickedWorklyFile | null>(null);
  const [uploaded, setUploaded] = useState<
    StoredDocumentResponse["document"] | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const chooseFile = async () => {
    try {
      const picked = await pickWorklyFile();
      if (picked) {
        setFile(picked);
        setUploaded(null);
        setError("");
      }
    } catch {
      setError(
        text(
          "Usa um PDF ou imagem até 2 MB.",
          "Use a PDF or image up to 2 MB.",
        ),
      );
    }
  };
  const save = async () => {
    if (busy || !name.trim()) return;
    for (const value of [issuedAt, expiresAt]) {
      if (
        value &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(Date.parse(value)) ||
          new Date(value).toISOString().slice(0, 10) !== value)
      ) {
        setError(
          text(
            "Indica as datas no formato AAAA-MM-DD.",
            "Enter dates in YYYY-MM-DD format.",
          ),
        );
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      let document = uploaded;
      if (file && !document) {
        const result = await uploadWorklyFile({
          owner_type: "worker",
          owner_id: worker.id,
          title: name.trim(),
          category: "technical",
          expires_at: expiresAt || undefined,
          file,
        });
        document = result.document;
        setUploaded(document);
      }
      const existing =
        certificate ||
        worker.certificates.find((item) => node && item.node_id === node.id);
      const parsedHours = hours.trim() ? Number(hours.replace(",", ".")) : undefined;
      if (parsedHours !== undefined && (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 100000)) {
        setError(text("Confirma o número de horas.", "Check the number of hours."));
        return;
      }
      const next: Certificate = {
        id: existing?.id || `evidence-${worker.id}-${Date.now().toString(36)}`,
        name: name.trim(),
        issuer: issuer.trim(),
        issued_at: issuedAt,
        expires_at: expiresAt,
        status: document ? "pending" : existing?.status || "recorded",
        file_name: document?.file_name || existing?.file_name || "",
        file_id: document?.file_id || existing?.file_id,
        profession_id: profession,
        kind,
        evidence_type: evidenceType,
        competency_id: node?.id,
        project_id: projectEvidence && projectId ? projectId : undefined,
        context: context.trim() || undefined,
        hours: parsedHours,
        node_id: profession === professionId ? node?.id : undefined,
      };
      await updateWorker(worker.id, {
        certificates: [
          ...worker.certificates.filter((item) => item.id !== next.id),
          next,
        ],
      });
      notify(
        text(
          "Evidência guardada na identidade profissional.",
          "Evidence saved to the professional identity.",
        ),
        "success",
      );
      onClose();
    } catch {
      setError(
        text(
          "Não foi possível guardar a evidência. Tenta novamente.",
          "Could not save the evidence. Try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalPanel
      visible
      onClose={() => {
        if (!busy) onClose();
      }}
      title={text("Adicionar evidência", "Add evidence")}
      subtitle={text(
        "Escolhe o tipo de prova. Autorizações e cartões de segurança não aumentam automaticamente a proficiência.",
        "Choose the evidence type. Authorisations and safety cards do not automatically increase proficiency.",
      )}
      footer={
        <>
          <Button
            label={text("Cancelar", "Cancel")}
            variant="secondary"
            disabled={busy}
            onPress={onClose}
          />
          <Button
            label={text("Guardar evidência", "Save evidence")}
            loading={busy}
            disabled={!name.trim()}
            onPress={() => void save()}
          />
        </>
      }
    >
      <View style={styles.form}>
        <Text style={styles.label}>
          {text("Profissão principal", "Main profession")}: {(() => {
            const definition = findProfessionDefinition(worker.profession);
            return definition
              ? professionTitle(language, definition.id, definition.title, definition.titleEn)
              : worker.profession;
          })()}
        </Text>
        {node ? <Text style={styles.competencyTarget}>{text("Competência", "Competence")}: {node.title}</Text> : null}
        <View style={styles.evidenceSection}>
          <Text style={styles.sectionLabel}>{text("Tipo de evidência", "Evidence type")}</Text>
          <View style={styles.evidenceGrid} accessibilityRole="radiogroup">
            {evidenceTypes.map((item) => {
              const selected = evidenceType === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  disabled={busy}
                  onPress={() => setEvidenceType(item.id)}
                  style={({ pressed }) => [
                    styles.evidenceOption,
                    selected && styles.evidenceOptionSelected,
                    pressed && styles.professionOptionPressed,
                  ]}
                >
                  <Text style={[styles.evidenceTitle, selected && styles.evidenceTitleSelected]}>
                    {text(item.label, item.labelEn)}
                  </Text>
                  <Text style={styles.evidenceDescription}>
                    {text(item.description, item.descriptionEn)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {projectEvidence && workerProjects.length ? (
          <View style={styles.projectSection}>
            <Text style={styles.sectionLabel}>
              {text("Ligar a uma Obra WORKLY", "Link to a WORKLY project")}
            </Text>
            <Text style={styles.hint}>
              {text(
                "A Obra cria a cadeia Proof of Work: presença aprovada → competência → validação da empresa.",
                "The project creates the Proof of Work chain: approved attendance → competence → employer validation.",
              )}
            </Text>
            <View style={styles.projectGrid}>
              {workerProjects.map((project) => {
                const selected = projectId === project.id;
                const projectHours = verifiedAttendanceHours(
                  worker.id,
                  state?.attendance || [],
                  project.id,
                );
                return (
                  <Pressable
                    key={project.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    disabled={busy}
                    onPress={() => setProjectId(selected ? "" : project.id)}
                    style={({ pressed }) => [
                      styles.projectOption,
                      selected && styles.projectOptionSelected,
                      pressed && styles.professionOptionPressed,
                    ]}
                  >
                    <View style={styles.projectOptionCopy}>
                      <Text
                        style={[
                          styles.projectOptionTitle,
                          selected && styles.projectOptionTitleSelected,
                        ]}
                      >
                        {project.name}
                      </Text>
                      <Text style={styles.projectOptionMeta}>
                        {project.status === "completed"
                          ? text("Concluída", "Completed")
                          : text("Em curso", "In progress")}
                        {" · "}
                        {projectHours} h {text("aprovadas", "approved")}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={selected ? "#78D8A7" : "#55758E"}
                    />
                  </Pressable>
                );
              })}
            </View>
            {selectedProject ? (
              <View style={styles.proofHint}>
                <Ionicons name="link-outline" size={14} color="#78D8A7" />
                <Text style={styles.proofHintText}>
                  {text("Proof of Work ligado", "Proof of Work linked")}
                  {" · "}
                  {approvedProjectHours} h {text("confirmadas por presença", "confirmed by attendance")}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Field
          label={text("Título da evidência", "Evidence title")}
          value={name}
          editable={!busy}
          onChangeText={setName}
        />
        <Field
          label={text("Entidade / empresa / avaliador", "Issuer / company / assessor")}
          value={issuer}
          editable={!busy}
          onChangeText={setIssuer}
        />
        <Field
          label={text("Data de emissão (opcional)", "Issue date (optional)")}
          placeholder="AAAA-MM-DD"
          value={issuedAt}
          editable={!busy}
          onChangeText={setIssuedAt}
        />
        <Field
          label={text("Validade (opcional)", "Expiry (optional)")}
          placeholder="AAAA-MM-DD"
          value={expiresAt}
          editable={!busy}
          onChangeText={setExpiresAt}
        />
        <Field
          label={text("Contexto / obra / equipamento (opcional)", "Context / project / equipment (optional)")}
          value={context}
          editable={!busy}
          onChangeText={setContext}
        />
        <Field
          label={text("Horas associadas (opcional)", "Associated hours (optional)")}
          value={hours}
          editable={!busy}
          onChangeText={setHours}
        />
        <Button
          label={file?.name || text("Associar comprovativo", "Attach evidence")}
          icon="attach-outline"
          variant="secondary"
          disabled={busy}
          onPress={() => void chooseFile()}
        />
        <Text style={styles.hint}>
          {text(
            "PDF ou imagem · até 2 MB. Registos enviados pelo Worker ficam registados ou a validar até confirmação independente.",
            "PDF or image · up to 2 MB. Worker-submitted records remain recorded or pending until independently confirmed.",
          )}
        </Text>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>
    </ModalPanel>
  );
}
const styles = StyleSheet.create({
  presetCard: { gap: 13, borderWidth: 1, borderColor: "#DCE6EB", borderRadius: 15, backgroundColor: "#F7FAFB", padding: 14 },
  presetHeading: { flexDirection: "row", gap: 11, alignItems: "center" },
  presetIcon: { width: 41, height: 41, borderRadius: 11, backgroundColor: "#E4EEF2", borderWidth: 1, borderColor: "#BFD1D9", alignItems: "center", justifyContent: "center" },
  presetIconLetter: { fontSize: 22, fontWeight: "900", color: "#4B7E91" },
  presetCopy: { flex: 1, gap: 4 },
  presetTitle: { fontSize: 15, fontWeight: "800", color: "#263B45" },
  presetDescription: { fontSize: 11, color: "#647984" },
  presetEvidence: { gap: 8 },
  presetDisclosure: { color: "#607781", fontSize: 11, lineHeight: 17 },
  presetEvidenceRow: { flexDirection: "row", alignItems: "center", gap: 9, padding: 10, borderWidth: 1, borderColor: "#DCE6EB", borderRadius: 10, backgroundColor: "#FFFFFF" },
  presetEvidenceText: { flex: 1, color: "#263B45", fontSize: 11, fontWeight: "600" },

  evidenceSection: { gap: 9 },
  projectSection: { gap: 9 },
  projectGrid: { gap: 7 },
  projectOption: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderWidth: 1, borderColor: "#40596A", borderRadius: 12, backgroundColor: "#172736" },
  projectOptionSelected: { borderColor: "#7394A7", backgroundColor: "#284354" },
  projectOptionCopy: { flex: 1, minWidth: 0, gap: 2 },
  projectOptionTitle: { color: "#EDF5F7", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  projectOptionTitleSelected: { color: "#91C9DD" },
  projectOptionMeta: { color: "#AEC2CB", fontSize: 9, lineHeight: 14 },
  proofHint: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "#40596A", backgroundColor: "#284354", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  proofHintText: { flex: 1, color: "#AEC2CB", fontSize: 9, lineHeight: 14 },
  evidenceGrid: { gap: 7 },
  evidenceOption: { padding: 11, borderWidth: 1, borderColor: "#40596A", borderRadius: 12, backgroundColor: "#172736", gap: 3 },
  evidenceOptionSelected: { borderColor: "#7394A7", backgroundColor: "#284354" },
  evidenceTitle: { color: "#EDF5F7", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  evidenceTitleSelected: { color: "#91C9DD" },
  evidenceDescription: { color: "#AEC2CB", fontSize: 9, lineHeight: 14 },
  competencyTarget: { color: "#91C9DD", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  professionSection: { gap: 9 },
  sectionLabel: { color: "#AEC2CB", fontSize: 11, lineHeight: 16, fontWeight: "700", letterSpacing: .8, textTransform: "uppercase" },
  professionGrid: { gap: 8 },
  professionOption: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1, borderColor: "#40596A", borderRadius: 14, backgroundColor: "#172736" },
  professionOptionSelected: { borderColor: "#7394A7", backgroundColor: "#284354" },
  professionOptionPressed: { opacity: .78 },
  professionIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: "#40596A", alignItems: "center", justifyContent: "center", backgroundColor: "#284354" },
  professionIconSelected: { borderColor: "#7394A7", backgroundColor: "#284354" },
  professionGlyph: { color: "#EDF5F7", fontSize: 17 },
  professionCopy: { flex: 1, minWidth: 0, gap: 3 },
  professionTitle: { color: "#EDF5F7", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  professionTitleSelected: { color: "#91C9DD" },
  professionDescription: { color: "#AEC2CB", fontSize: 10, lineHeight: 15 },
  form: { gap: 14 },
  lockedIdentity: {
    gap: 4,
    borderWidth: 1,
    borderColor: "#40596A",
    backgroundColor: "#172736",
    borderRadius: 13,
    padding: 12,
  },
  lockedIdentityTitle: {
    color: "#EDF5F7",
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  lockedIdentityName: {
    color: "#EDF5F7",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  label: { color: workspaceColors.textSoft, fontSize: 12, fontWeight: "600" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    borderRadius: 6,
    justifyContent: "center",
  },
  optionSelected: {
    backgroundColor: "#284354",
    borderColor: workspaceColors.blue,
  },
  optionText: { color: workspaceColors.textSoft, fontSize: 12 },
  hint: { color: workspaceColors.muted, fontSize: 12, lineHeight: 19 },
  error: { color: workspaceColors.redSoft, fontSize: 13, lineHeight: 19 },
});
