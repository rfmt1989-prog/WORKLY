import React, { useState } from "react";
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
  Avatar,
  Button,
  Field,
  ModalPanel,
  workspaceColors,
} from "./primitives";
import { type AchievementNode } from "./workerCertificateTree";
import { findProfessionDefinition, professionCatalog } from "./professionCatalog";
import { evidenceTypes, type EvidenceType } from "./competencyEvidenceModel";

export function WorkerIdentityEditor({
  worker,
  onClose,
}: {
  worker: Worker;
  onClose: () => void;
}) {
  const { language, updateWorker, notify } = useWorklyData();
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const [form, setForm] = useState(() => ({
    name: worker.name,
    profession: findProfessionDefinition(worker.profession)?.title || worker.profession,
    country: worker.country,
    location: worker.location,
    phone: worker.phone,
    languages: worker.languages.join(", "),
    bio: worker.bio,
    avatar: worker.avatar,
  }));
  const [available, setAvailable] = useState(worker.availability);
  const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const choosePhoto = async () => {
    try {
      const file = await pickWorklyFile();
      if (!file) return;
      if (!file.contentType.startsWith("image/")) {
        notify(
          text(
            "Seleciona uma imagem para a foto de perfil.",
            "Choose an image for your profile photo.",
          ),
          "error",
        );
        return;
      }
      update("avatar", `data:${file.contentType};base64,${file.base64}`);
    } catch {
      notify(
        text("Usa uma imagem até 2 MB.", "Use an image up to 2 MB."),
        "error",
      );
    }
  };
  const save = async () => {
    if (busy || !form.name.trim() || !form.profession.trim()) return;
    setBusy(true);
    try {
      await updateWorker(worker.id, {
        ...form,
        name: form.name.trim(),
        profession: form.profession.trim(),
        title: form.profession.trim(),
        availability: available,
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
  const fields: [keyof typeof form, string, string][] = [
    ["name", "Nome", "Name"],
    ["country", "País", "Country"],
    ["location", "Localização", "Location"],
    ["phone", "Telefone", "Phone"],
    [
      "languages",
      "Idiomas (separados por vírgulas)",
      "Languages (comma separated)",
    ],
    ["bio", "Apresentação", "About"],
  ];
  return (
    <ModalPanel
      visible
      onClose={() => {
        if (!busy) onClose();
      }}
      title={text("Editar identificação", "Edit identity")}
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
            disabled={!form.name.trim() || !form.profession.trim()}
            onPress={() => void save()}
          />
        </>
      }
    >
      <View style={styles.form}>
        <Text style={styles.hint}>{text("A identificação e a profissão ficam aqui. A experiência WORKLY conta automaticamente nas Obras através de horas aprovadas.", "Identity and profession stay here. WORKLY experience is counted automatically in Projects through approved hours.")}</Text>
        <View style={styles.photoRow}>
          <Avatar name={form.name} source={form.avatar} size={72} />
          <Button
            label={text("Alterar foto", "Change photo")}
            variant="secondary"
            icon="camera-outline"
            disabled={busy}
            onPress={() => void choosePhoto()}
          />
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
        {fields.map(([key, pt, en]) => (
          <Field
            key={key}
            label={text(pt, en)}
            value={form[key]}
            multiline={key === "bio"}
            editable={!busy}
            onChangeText={(value) => update(key, value)}
          />
        ))}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: available, disabled: busy }} disabled={busy} onPress={() => setAvailable((value) => !value)} style={styles.option}>
          <Text style={styles.optionText}>{available ? "☑" : "☐"} {text("Disponível para novas obras", "Available for new projects")}</Text>
        </Pressable>
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
  const { language, updateWorker, notify } = useWorklyData();
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
  evidenceSection: { gap: 9 },
  evidenceGrid: { gap: 7 },
  evidenceOption: { padding: 11, borderWidth: 1, borderColor: "#243B4D", borderRadius: 12, backgroundColor: "#071019", gap: 3 },
  evidenceOptionSelected: { borderColor: "#3D80B5", backgroundColor: "#0A1C2A" },
  evidenceTitle: { color: "#AFC1D0", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  evidenceTitleSelected: { color: "#DDECFA" },
  evidenceDescription: { color: "#6D8599", fontSize: 9, lineHeight: 14 },
  competencyTarget: { color: "#83BDF0", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  professionSection: { gap: 9 },
  sectionLabel: { color: "#B8CAD9", fontSize: 11, lineHeight: 16, fontWeight: "700", letterSpacing: .8, textTransform: "uppercase" },
  professionGrid: { gap: 8 },
  professionOption: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1, borderColor: "#263A4B", borderRadius: 14, backgroundColor: "#09121A" },
  professionOptionSelected: { borderColor: "#3D80B5", backgroundColor: "#0A1C2A" },
  professionOptionPressed: { opacity: .78 },
  professionIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: "#31485B", alignItems: "center", justifyContent: "center", backgroundColor: "#071019" },
  professionIconSelected: { borderColor: "#579DDA", backgroundColor: "#0A2132" },
  professionGlyph: { color: "#86C6FF", fontSize: 17 },
  professionCopy: { flex: 1, minWidth: 0, gap: 3 },
  professionTitle: { color: "#BAC9D6", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  professionTitleSelected: { color: "#E4F1FC" },
  professionDescription: { color: "#70869A", fontSize: 10, lineHeight: 15 },
  form: { gap: 14 },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 16,
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
    backgroundColor: "#2388FF14",
    borderColor: workspaceColors.blue,
  },
  optionText: { color: workspaceColors.textSoft, fontSize: 12 },
  hint: { color: workspaceColors.muted, fontSize: 12, lineHeight: 19 },
  error: { color: workspaceColors.redSoft, fontSize: 13, lineHeight: 19 },
});
