import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  MAX_WORKLY_FILE_BYTES,
  pickWorklyFile,
  type PickedWorklyFile,
  uploadWorklyFile,
} from "@/src/api/documentFiles";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { LanguageCode } from "@/src/demo/types";

import { Button, Field, ModalPanel, workspaceColors } from "./primitives";

const CATEGORIES = [
  "identity",
  "insurance",
  "medical",
  "safety",
  "technical",
  "planning",
  "legal",
  "license",
  "other",
] as const;

const LABELS: Record<LanguageCode, Record<string, string>> = {
  pt: { add: "Adicionar documento", title: "Título", category: "Categoria", expiry: "Validade (opcional)", upload: "Guardar documento", cancel: "Cancelar", identity: "Identificação", insurance: "Seguro", medical: "Aptidão médica", safety: "Segurança", technical: "Técnico", planning: "Planeamento", legal: "Legal", license: "Licença", other: "Outro", tooLarge: "O ficheiro ultrapassa o limite de 2 MB.", failed: "Não foi possível guardar o documento.", real: "PDF ou imagem · máximo 2 MB" },
  en: { add: "Add document", title: "Title", category: "Category", expiry: "Expiry (optional)", upload: "Save document", cancel: "Cancel", identity: "Identity", insurance: "Insurance", medical: "Medical fitness", safety: "Safety", technical: "Technical", planning: "Planning", legal: "Legal", license: "License", other: "Other", tooLarge: "The file exceeds the 2 MB limit.", failed: "Could not save the document.", real: "PDF or image · maximum 2 MB" },
  fr: { add: "Ajouter un document", title: "Titre", category: "Catégorie", expiry: "Validité (facultatif)", upload: "Enregistrer", cancel: "Annuler", identity: "Identité", insurance: "Assurance", medical: "Aptitude médicale", safety: "Sécurité", technical: "Technique", planning: "Planification", legal: "Juridique", license: "Licence", other: "Autre", tooLarge: "Le fichier dépasse la limite de 2 Mo.", failed: "Impossible d’enregistrer le document.", real: "PDF ou image · maximum 2 Mo" },
  es: { add: "Añadir documento", title: "Título", category: "Categoría", expiry: "Validez (opcional)", upload: "Guardar documento", cancel: "Cancelar", identity: "Identificación", insurance: "Seguro", medical: "Aptitud médica", safety: "Seguridad", technical: "Técnico", planning: "Planificación", legal: "Legal", license: "Licencia", other: "Otro", tooLarge: "El archivo supera el límite de 2 MB.", failed: "No se pudo guardar el documento.", real: "PDF o imagen · máximo 2 MB" },
  ro: { add: "Adaugă document", title: "Titlu", category: "Categorie", expiry: "Valabilitate (opțional)", upload: "Salvează documentul", cancel: "Anulează", identity: "Identitate", insurance: "Asigurare", medical: "Aptitudine medicală", safety: "Siguranță", technical: "Tehnic", planning: "Planificare", legal: "Legal", license: "Licență", other: "Altul", tooLarge: "Fișierul depășește limita de 2 MB.", failed: "Documentul nu a putut fi salvat.", real: "PDF sau imagine · maximum 2 MB" },
  de: { add: "Dokument hinzufügen", title: "Titel", category: "Kategorie", expiry: "Gültigkeit (optional)", upload: "Dokument speichern", cancel: "Abbrechen", identity: "Identität", insurance: "Versicherung", medical: "Medizinische Eignung", safety: "Sicherheit", technical: "Technisch", planning: "Planung", legal: "Rechtlich", license: "Lizenz", other: "Sonstiges", tooLarge: "Die Datei überschreitet das 2-MB-Limit.", failed: "Dokument konnte nicht gespeichert werden.", real: "PDF oder Bild · maximal 2 MB" },
  nl: { add: "Document toevoegen", title: "Titel", category: "Categorie", expiry: "Geldigheid (optioneel)", upload: "Document opslaan", cancel: "Annuleren", identity: "Identiteit", insurance: "Verzekering", medical: "Medische geschiktheid", safety: "Veiligheid", technical: "Technisch", planning: "Planning", legal: "Juridisch", license: "Licentie", other: "Overig", tooLarge: "Het bestand is groter dan 2 MB.", failed: "Document kon niet worden opgeslagen.", real: "PDF of afbeelding · maximaal 2 MB" },
};

export function DocumentUploadButton({
  ownerType,
  ownerId,
  language,
  accent,
  disabled = false,
}: {
  ownerType: "worker" | "company" | "project";
  ownerId: string;
  language: LanguageCode;
  accent: string;
  disabled?: boolean;
}) {
  const { reload, notify } = useWorklyData();
  const text = LABELS[language];
  const [file, setFile] = useState<PickedWorklyFile | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(ownerType === "project" ? "technical" : "other");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const choose = async () => {
    if (disabled || busy) return;
    setError("");
    try {
      const picked = await pickWorklyFile();
      if (!picked) return;
      setFile(picked);
      setTitle(picked.name.replace(/\.[^.]+$/, ""));
    } catch (caught) {
      const message = caught instanceof Error && caught.message === "WORKLY_FILE_TOO_LARGE" ? text.tooLarge : text.failed;
      setError(message);
      notify(message, "error");
    }
  };

  const close = () => {
    if (busy) return;
    setFile(null);
    setTitle("");
    setExpiresAt("");
    setError("");
  };

  const save = async () => {
    if (!file || !title.trim() || busy) return;
    if (file.size > MAX_WORKLY_FILE_BYTES) {
      setError(text.tooLarge);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await uploadWorklyFile({
        owner_type: ownerType,
        owner_id: ownerId,
        title: title.trim(),
        category,
        expires_at: expiresAt.trim() || undefined,
        file,
      });
      await reload(true);
      notify(text.upload, "success");
      close();
    } catch {
      setError(text.failed);
      notify(text.failed, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button compact label={text.add} icon="cloud-upload-outline" accent={accent} disabled={disabled} onPress={() => void choose()} />
      <ModalPanel
        visible={Boolean(file)}
        onClose={close}
        title={text.add}
        subtitle={file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : text.real}
        footer={
          <>
            <Button label={text.cancel} variant="ghost" onPress={close} disabled={busy} />
            <Button label={text.upload} icon="cloud-upload-outline" accent={accent} loading={busy} disabled={!title.trim()} onPress={() => void save()} />
          </>
        }
      >
        <View style={{ gap: 14 }}>
          <Field label={text.title} value={title} onChangeText={setTitle} />
          <Text style={styles.label}>{text.category}</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.category,
                  category === item ? { borderColor: accent, backgroundColor: `${accent}15` } : null,
                ]}
              >
                <Ionicons name={item === "safety" ? "shield-checkmark-outline" : item === "medical" ? "medkit-outline" : "document-outline"} size={14} color={category === item ? accent : workspaceColors.muted} />
                <Text style={[styles.categoryText, category === item ? { color: accent } : null]}>{text[item]}</Text>
              </Pressable>
            ))}
          </View>
          <Field label={text.expiry} value={expiresAt} placeholder="2027-12-31" onChangeText={setExpiresAt} />
          <Text style={styles.hint}>{text.real}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ModalPanel>
    </>
  );
}

const styles = StyleSheet.create({
  label: { color: workspaceColors.textSoft, fontSize: 10, fontWeight: "700" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  category: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: workspaceColors.line, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  categoryText: { color: workspaceColors.muted, fontSize: 9, fontWeight: "700" },
  hint: { color: workspaceColors.muted, fontSize: 9, lineHeight: 14 },
  error: { color: workspaceColors.redSoft, fontSize: 10, fontWeight: "700" },
});
