import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  pickWorklyFile,
  uploadWorklyFile,
  type PickedWorklyFile,
  type StoredDocumentResponse,
} from "@/src/api/documentFiles";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { uiText } from "@/src/demo/fullUi";
import type { Certificate, Worker } from "@/src/demo/types";
import {
  Avatar,
  Button,
  Field,
  ModalPanel,
  workspaceColors,
} from "./primitives";
import {
  type AchievementNode,
} from "./workerCertificateTree";

export function WorkerIdentityEditor({
  worker,
  onClose,
}: {
  worker: Worker;
  onClose: () => void;
}) {
  const { language, updateWorker, notify } = useWorklyData();
  const text = (pt: string, en: string) => uiText(language, pt, en);
  const [form, setForm] = useState(() => ({
    name: worker.name,
    profession: worker.profession,
    country: worker.country,
    location: worker.location,
    phone: worker.phone,
    languages: worker.languages.join(", "),
    bio: worker.bio,
    avatar: worker.avatar,
    experience_years: String(worker.experience_years),
    skills: worker.skills.map((skill) => skill.name).join("\n"),
    portfolio: worker.best_projects.map((project) => `${project.title} | ${project.location} | ${project.year} | ${project.summary}`).join("\n"),
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
    const experience = Number(form.experience_years.replace(",", "."));
    const portfolioRows = form.portfolio.split("\n").map((row) => row.trim()).filter(Boolean);
    if (!Number.isFinite(experience) || experience < 0 || experience > 80 || portfolioRows.some((row) => {
      const [title, , year] = row.split("|").map((item) => item.trim());
      return !title || !/^\d{4}$/.test(year || "") || Number(year) > new Date().getFullYear();
    })) {
      notify(text("Confirma os anos de experiência e o formato das obras.", "Check your years of experience and the project format."), "error");
      return;
    }
    setBusy(true);
    try {
      const { skills: _skills, portfolio: _portfolio, experience_years: _experience, ...identity } = form;
      await updateWorker(worker.id, {
        ...identity,
        name: form.name.trim(),
        profession: form.profession.trim(),
        title: form.profession.trim(),
        experience_years: experience,
        availability: available,
        skills: Array.from(new Set(form.skills.split("\n").map((item) => item.trim()).filter(Boolean))).map((name) => worker.skills.find((item) => item.name === name) || { name, level: 0 }),
        best_projects: portfolioRows.map((row, index) => {
          const [title, location, year, ...summary] = row.split("|").map((item) => item.trim());
          const existing = worker.best_projects.find((item) => item.title === title && item.location === location && item.year === Number(year));
          return { ...existing, id: existing?.id || `portfolio-${worker.id}-${Date.now().toString(36)}-${index}`, title, location, year: Number(year), summary: summary.join(" | ") };
        }),
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
    ["profession", "Profissão principal", "Main profession"],
    ["experience_years", "Anos de experiência", "Years of experience"],
    ["country", "País", "Country"],
    ["location", "Localização", "Location"],
    ["phone", "Telefone", "Phone"],
    [
      "languages",
      "Idiomas (separados por vírgulas)",
      "Languages (comma separated)",
    ],
    ["bio", "Apresentação", "About"],
    ["skills", "Competências adicionais (uma por linha)", "Additional skills (one per line)"],
    ["portfolio", "Obras (uma por linha: Título | Local | Ano | Resumo)", "Projects (one per line: Title | Location | Year | Summary)"],
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
        <Text style={styles.hint}>{text("Alteras a mesma identidade profissional. O nível é calculado pela Workly com base nos registos confirmados.", "You are editing the same professional identity. Workly calculates your level from confirmed records.")}</Text>
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
        {fields.map(([key, pt, en]) => (
          <Field
            key={key}
            label={text(pt, en)}
            value={form[key]}
            multiline={key === "bio" || key === "skills" || key === "portfolio"}
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
  const text = (pt: string, en: string) => uiText(language, pt, en);
  const certificate = node?.certificate;
  const profession = professionId;
  const [kind, setKind] = useState<"certification" | "skill">(certificate?.kind || (node?.kind === "skill" ? "skill" : "certification"));
  const [name, setName] = useState(certificate?.name || node?.title || "");
  const [issuer, setIssuer] = useState(certificate?.issuer || "");
  const [issuedAt, setIssuedAt] = useState(certificate?.issued_at || "");
  const [expiresAt, setExpiresAt] = useState(certificate?.expires_at || "");
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
      const next: Certificate = {
        id: existing?.id || `cert-${worker.id}-${Date.now().toString(36)}`,
        name: name.trim(),
        issuer: issuer.trim(),
        issued_at: issuedAt,
        expires_at: expiresAt,
        status: document ? "pending" : existing?.status || "recorded",
        file_name: document?.file_name || existing?.file_name || "",
        file_id: document?.file_id || existing?.file_id,
        profession_id: profession,
        kind,
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
          "Certificado guardado na profissão.",
          "Certificate saved to the profession.",
        ),
        "success",
      );
      onClose();
    } catch {
      setError(
        text(
          "Não foi possível guardar o certificado. Tenta novamente.",
          "Could not save the certificate. Try again.",
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
      title={text("Adicionar certificado", "Add certificate")}
      subtitle={text(
        "O comprovativo pertence à tua identidade e à profissão principal.",
        "Evidence belongs to your identity and primary profession.",
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
            label={text("Guardar certificado", "Save certificate")}
            loading={busy}
            disabled={!name.trim()}
            onPress={() => void save()}
          />
        </>
      }
    >
      <View style={styles.form}>
        <Text style={styles.label}>{text("Profissão principal", "Main profession")}: {worker.profession}</Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          {([
            { id: "certification", title: "Certificação da profissão", titleEn: "Trade certification" },
            { id: "skill", title: "Competência adicional", titleEn: "Additional skill" },
          ] as const).map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: kind === item.id }}
              disabled={busy}
              onPress={() => setKind(item.id)}
              style={[
                styles.option,
                kind === item.id ? styles.optionSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  kind === item.id
                    ? { color: workspaceColors.blueSoft }
                    : null,
                ]}
              >
                {text(item.title, item.titleEn)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field
          label={text("Nome do certificado", "Certificate name")}
          value={name}
          editable={!busy}
          onChangeText={setName}
        />
        <Field
          label={text("Entidade emissora", "Issuer")}
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
        <Button
          label={file?.name || text("Associar comprovativo", "Attach evidence")}
          icon="attach-outline"
          variant="secondary"
          disabled={busy}
          onPress={() => void chooseFile()}
        />
        <Text style={styles.hint}>
          {text(
            "PDF ou imagem · até 2 MB. Um comprovativo fica a validar até ser confirmado.",
            "PDF or image · up to 2 MB. Evidence remains pending until confirmed.",
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
