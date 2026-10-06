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
  professionDefinitions,
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
  }));
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
    ["profession", "Profissão", "Profession"],
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
            multiline={key === "bio"}
            editable={!busy}
            onChangeText={(value) => update(key, value)}
          />
        ))}
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
  const [profession, setProfession] = useState(professionId);
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
        "Associa cada certificado à profissão correspondente.",
        "Associate each certificate with its profession.",
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
        <Text style={styles.label}>{text("Profissão", "Profession")}</Text>
        <View style={styles.options}>
          {[
            ...professionDefinitions,
            {
              id: "professional",
              title: worker.profession,
              titleEn: worker.profession,
            },
          ].map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: profession === item.id }}
              disabled={busy}
              onPress={() => setProfession(item.id)}
              style={[
                styles.option,
                profession === item.id ? styles.optionSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  profession === item.id
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
