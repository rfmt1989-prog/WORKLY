import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { pickWorklyFile, uploadWorklyFile } from "@/src/api/documentFiles";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { Worker } from "@/src/demo/types";
import { professionalText } from "@/src/demo/professionalI18n";
import { professionCatalog } from "./professionCatalog";
import { Avatar, Button } from "./primitives";
import { WorkerCertificateEditor } from "./WorkerProfileEditors";

type Step = 0 | 1 | 2 | 3;
type Icon = React.ComponentProps<typeof Ionicons>["name"];
const BLUE = "#4B7E91", INK = "#243A45", MUTED = "#647C87", BORDER = "#D8E4E8", PALE = "#EAF2F4";

function StepSymbol({ icon, complete }: { icon: Icon; complete: boolean }) {
  return <View style={[styles.stepSymbol, complete && styles.stepSymbolComplete]}><Ionicons name={complete ? "checkmark" : icon} size={20} color={BLUE} /></View>;
}
function StatusRow({ icon, title, description, checked }: { icon: Icon; title: string; description: string; checked: boolean }) {
  return <View style={styles.statusRow}><StepSymbol icon={icon} complete={checked} /><View style={styles.statusText}><Text style={styles.statusTitle}>{title}</Text><Text style={styles.statusDescription}>{description}</Text></View><Ionicons name={checked ? "checkmark-circle" : "ellipse-outline"} size={19} color={checked ? BLUE : "#9EADB3"} /></View>;
}

/** Starts only for unconfigured accounts; documents never imply independent verification. */
export function WorkerOnboarding({ worker, onFinish }: { worker: Worker; onFinish: () => void }) {
  const { state, language, reload, updateWorker } = useWorklyData();
  const tr = (pt: string, en: string) => professionalText(language, pt, en);
  const { width } = useWindowDimensions();
  const narrow = width < 640;
  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [addingCertificate, setAddingCertificate] = useState(false);
  const [profession, setProfession] = useState(worker.profession || "");
  const [title, setTitle] = useState(worker.title || "");
  const [location, setLocation] = useState(worker.location || "");
  const [specialties, setSpecialties] = useState((worker.specialties || []).join(", "));
  const [summary, setSummary] = useState(worker.bio || "");
  const [avatar, setAvatar] = useState(worker.avatar || "");
  const identityFiles = worker.documents.filter(d => d.category === "identity" && Boolean(d.file_id));
  const hasIdentityFile = identityFiles.length > 0;
  const hasProfessional = Boolean(worker.profession.trim());
  const verified = worker.identity_verification_status === "verified";
  const [photoSelected, setPhotoSelected] = useState(false);
  useEffect(() => {
    if (!busy) {
      setProfession(current => current || worker.profession);
    }
  }, [worker.profession, busy]);

  const uploadIdentity = async () => {
    if (busy) return;
    setError("");
    try {
      const file = await pickWorklyFile();
      if (!file) return;
      setBusy(true);
      await uploadWorklyFile({
        owner_type: "worker", owner_id: worker.id,
        category: "identity",
        title: worker.identity_document_type === "passport" ? "Passaporte — identificação" : "Cartão de Cidadão — identificação",
        file,
      });
      await reload(true);
    } catch (e) {
      setError(e instanceof Error && e.message === "WORKLY_FILE_TOO_LARGE"
        ? tr("O ficheiro não pode ultrapassar 2 MB.", "The file cannot exceed 2 MB.")
        : tr("Não foi possível guardar o documento. Confirma a ligação e tenta novamente.", "Could not save the document. Check the connection and try again."));
    } finally { setBusy(false); }
  };

  const choosePhoto = async () => {
    if (busy) return;
    setError("");
    try {
      const file = await pickWorklyFile();
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.contentType) || file.size > 180 * 1024) {
        setError(tr("Escolhe uma fotografia JPG, PNG ou WEBP com menos de 180 KB.", "Choose a JPG, PNG or WEBP photo below 180 KB."));
        return;
      }
      setAvatar(`data:${file.contentType};base64,${file.base64}`);
      setPhotoSelected(true);
    } catch {
      setError(tr("Não foi possível abrir a fotografia.", "Could not open the photo."));
    }
  };

  const saveProfessional = async () => {
    if (busy) return;
    setError("");
    if (!profession.trim()) {
      setError(tr("Seleciona a profissão principal para continuar.", "Choose the primary trade before continuing."));
      return;
    }
    setBusy(true);
    try {
      await updateWorker(worker.id, {
        profession: profession.trim(),
        title: title.trim() || profession.trim(),
        location: location.trim(),
        bio: summary.trim(),
        specialties: specialties.split(",").map(item => item.trim()).filter(Boolean),
        ...(photoSelected ? { avatar } : {}),
      });
      setStep(2);
    } catch {
      setError(tr("Não foi possível guardar o perfil. Tenta novamente.", "Could not save the profile. Please try again."));
    } finally { setBusy(false); }
  };
  const advance = (target: Step) => { setError(""); setStep(target); };
  const stages = [
    { title: tr("Identidade", "Identity"), icon: "id-card-outline" as Icon },
    { title: tr("Profissão", "Trade"), icon: "construct-outline" as Icon },
    { title: tr("Certificados", "Certificates"), icon: "ribbon-outline" as Icon },
    { title: tr("Concluir", "Finish"), icon: "checkmark-done-outline" as Icon },
  ];
  return (
    <View style={styles.root} testID="worker-onboarding">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.brandRow}><View style={styles.mark}><Text style={styles.markText}>W</Text></View><Text style={styles.brand}>WORKLY</Text><Text style={styles.welcomeTag}>{tr("Novo perfil", "New profile")}</Text></View>
        <View style={styles.headingRow}>
          <View style={styles.headingText}><Text style={styles.kicker}>{tr("IDENTIDADE PROFISSIONAL", "PROFESSIONAL IDENTITY")}</Text><Text style={styles.heading}>{tr("Começar", "Get started")}</Text><Text style={styles.subheading}>{tr("Regista os teus dados e comprovativos. Só os documentos avaliados passam a verificados.", "Add your professional details and evidence. Only reviewed documents become verified.")}</Text></View>
          <Pressable accessibilityRole="button" onPress={onFinish} style={styles.later}><Text style={styles.laterText}>{tr("Mais tarde", "Later")}</Text><Ionicons name="close-outline" size={17} color={MUTED} /></Pressable>
        </View>
        <View style={styles.stepper}>
          {stages.map((stage, index) => <Pressable key={stage.title} accessibilityRole="button" accessibilityState={{ selected: step === index }} onPress={() => advance(index as Step)} style={[styles.step, step === index && styles.stepActive]}>
            <Ionicons name={stage.icon} size={19} color={step === index ? BLUE : MUTED} />
            {!narrow || step === index ? <Text style={[styles.stepText, step === index && styles.stepTextActive]}>{stage.title}</Text> : null}
          </Pressable>)}
        </View>
        <View style={styles.panel}>
          {step === 0 ? <>
            <View style={styles.panelTitleRow}><Ionicons name="finger-print-outline" size={24} color={BLUE} /><View style={styles.panelCopy}><Text style={styles.panelTitle}>{tr("Identidade", "Identity")}</Text><Text style={styles.panelCaption}>{tr("Os dados oficiais são privados e nunca aparecem no perfil público.", "Official identity details remain private and are not shown publicly.")}</Text></View></View>
            <View style={styles.identitySummary}><Avatar name={worker.name || "Worker"} source={worker.avatar} accent={BLUE} size={56} /><View style={styles.identityCopy}><Text style={styles.identityName}>{worker.name}</Text><Text style={styles.identityMeta}>{worker.nationality || worker.country || "—"}</Text><Text style={styles.identityId}>{worker.workly_id || "WORKLY ID"}</Text></View></View>
            <StatusRow icon="shield-outline" title={tr("Conta criada", "Account created")} description={tr("Identificação declarada no registo", "Identity declared during sign-up")} checked />
            <StatusRow icon="document-text-outline" title={tr("Documento de identificação", "Identity document")} description={hasIdentityFile ? tr("Documento entregue para análise", "Document submitted for review") : tr("Envia uma cópia em PDF ou imagem (máximo 2 MB)", "Upload a PDF or image (max 2 MB)")} checked={hasIdentityFile} />
            <StatusRow icon="shield-checkmark-outline" title={tr("Verificação de identidade", "Identity verification")} description={verified ? tr("Validada", "Verified") : tr("Pendente de revisão", "Awaiting review")} checked={verified} />
            <View style={styles.privacy}><Ionicons name="lock-closed-outline" size={17} color={BLUE} /><Text style={styles.privacyText}>{tr("O documento é armazenado em área autenticada. O envio não confirma identidade nem aptidão para trabalhar.", "The document is stored behind authenticated access. Uploading does not verify your identity or work eligibility.")}</Text></View>
            <Button label={busy ? tr("A guardar...", "Saving...") : hasIdentityFile ? tr("Substituir ou enviar outro", "Upload another copy") : tr("Enviar identificação", "Upload ID document")} icon="cloud-upload-outline" onPress={() => void uploadIdentity()} disabled={busy} />
            <Button label={tr("Seguinte", "Next")} icon="arrow-forward-outline" variant="secondary" onPress={() => advance(1)} />
          </> : null}
          {step === 1 ? <>
            <View style={styles.panelTitleRow}><Ionicons name="construct-outline" size={24} color={BLUE} /><View style={styles.panelCopy}><Text style={styles.panelTitle}>{tr("Profissão", "Trade")}</Text><Text style={styles.panelCaption}>{tr("Uma profissão principal. Especializações e certificados ficam separados.", "One primary trade. Specialisms and certificates stay separate.")}</Text></View></View>
            <Pressable accessibilityRole="button" onPress={() => void choosePhoto()} style={styles.photoPicker}><Avatar name={worker.name || "Worker"} source={avatar} size={64} accent={BLUE} /><View style={styles.photoCopy}><Text style={styles.photoTitle}>{tr("Fotografia profissional", "Profile photograph")}</Text><Text style={styles.photoHint}>{tr("Adicionar JPG, PNG ou WEBP até 180 KB", "Add JPG, PNG or WEBP up to 180 KB")}</Text></View><Ionicons name="camera-outline" size={21} color={BLUE}/></Pressable>
            <Text style={styles.formLabel}>{tr("Profissão principal", "Primary trade")}</Text>
            <View style={styles.professions}>{professionCatalog.map(item => {const selected = profession === item.title; return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setProfession(item.title)} style={[styles.professionOption, selected && styles.professionSelected]}><Ionicons name={item.icon} size={21} color={BLUE} /><Text style={[styles.professionText, selected && styles.professionTextSelected]}>{language === "en" ? item.titleEn : item.title}</Text><Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={19} color={selected ? BLUE : "#A8B5BB"} /></Pressable>;})}</View>
            <Text style={styles.formLabel}>{tr("Título profissional", "Professional title")}</Text><TextInput accessibilityLabel={tr("Título profissional", "Professional title")} style={styles.input} value={title} placeholder={tr("Ex.: Técnico eletromecânico", "e.g. Electromechanical technician")} placeholderTextColor="#8C9DA5" onChangeText={setTitle} />
            <Text style={styles.formLabel}>{tr("Localização", "Location")}</Text><TextInput accessibilityLabel={tr("Localização", "Location")} style={styles.input} value={location} placeholder={tr("Cidade, país", "City, country")} placeholderTextColor="#8C9DA5" onChangeText={setLocation} />
            <Text style={styles.formLabel}>{tr("Especializações", "Specialties")}</Text><TextInput accessibilityLabel={tr("Especializações", "Specialties")} style={styles.input} value={specialties} placeholder={tr("Ex.: Refrigeração, Climatização", "e.g. Refrigeration, HVAC")} placeholderTextColor="#8C9DA5" onChangeText={setSpecialties} />
            <Text style={styles.formLabel}>{tr("Apresentação profissional", "Professional summary")}</Text><TextInput accessibilityLabel={tr("Apresentação profissional", "Professional summary")} style={[styles.input, styles.multiline]} multiline value={summary} placeholder={tr("O teu percurso, competências e tipo de trabalhos", "Your experience, skills and work")} placeholderTextColor="#8C9DA5" onChangeText={setSummary} />
            <Button label={busy ? tr("A guardar...", "Saving...") : tr("Guardar perfil", "Save profile")} disabled={busy} icon="checkmark-outline" onPress={() => void saveProfessional()} />
          </> : null}
          {step === 2 ? <>
            <View style={styles.panelTitleRow}><Ionicons name="ribbon-outline" size={24} color={BLUE} /><View style={styles.panelCopy}><Text style={styles.panelTitle}>{tr("Certificados", "Certificates")}</Text><Text style={styles.panelCaption}>{tr("Cursos, IPAF, ATEX, segurança e habilitações. Cada prova começa pendente de validação.", "Training, IPAF, ATEX, safety and authorisations. Each record awaits verification.")}</Text></View></View>
            {worker.certificates.length ? worker.certificates.map(cert => <StatusRow key={cert.id} icon="ribbon-outline" title={cert.name} description={cert.status === "verified" ? tr("Verificado", "Verified") : cert.status === "pending" ? tr("Em análise", "Under review") : tr("Declarado", "Declared")} checked={cert.status === "verified"}/>) : <Text style={styles.placeholder}>{tr("Ainda não existem certificados associados.", "No certificates added yet.")}</Text>}
            <Button label={tr("Adicionar certificado ou comprovativo", "Add certificate or evidence")} icon="add-circle-outline" onPress={() => setAddingCertificate(true)} />
            <Button label={tr("Continuar", "Continue")} icon="arrow-forward-outline" variant="secondary" onPress={() => advance(3)} />
          </> : null}
          {step === 3 ? <>
            <View style={styles.panelTitleRow}><Ionicons name="checkmark-done-outline" size={24} color={BLUE} /><View style={styles.panelCopy}><Text style={styles.panelTitle}>{tr("Pronto", "Ready")}</Text><Text style={styles.panelCaption}>{tr("A tua identidade profissional pode crescer com cada obra e comprovativo.", "Your professional identity grows with each verified project and record.")}</Text></View></View>
            <StatusRow icon="person-outline" title={tr("Conta pessoal", "Personal account")} description={worker.workly_id || "WORKLY"} checked />
            <StatusRow icon="id-card-outline" title={tr("Documento de identificação", "Identity document")} description={hasIdentityFile ? tr("Recebido; em análise", "Received; under review") : tr("Por enviar", "Not uploaded")} checked={hasIdentityFile} />
            <StatusRow icon="construct-outline" title={tr("Profissão", "Trade")} description={worker.profession || tr("Ainda por definir", "Not set")} checked={hasProfessional} />
            <StatusRow icon="ribbon-outline" title={tr("Certificações", "Certificates")} description={worker.certificates.length + " " + tr("registadas", "recorded")} checked={worker.certificates.length > 0} />
            <View style={styles.privacy}><Ionicons name="information-circle-outline" color={BLUE} size={17}/><Text style={styles.privacyText}>{tr("O WORKLY ID está criado. Os níveis são calculados exclusivamente com prova suficiente. O documento enviado não é uma verificação automática.", "Your WORKLY ID has been created. Levels require sufficient evidence. Uploading an ID does not automatically verify it.")}</Text></View>
            <Button label={tr("Entrar na WORKLY", "Enter WORKLY")} icon="arrow-forward-outline" onPress={onFinish} />
          </> : null}
          {error ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={18} color="#AE6262"/><Text style={styles.errorText}>{error}</Text></View> : null}
          {busy ? <ActivityIndicator color={BLUE}/> : null}
        </View>
        <Text style={styles.footer}>{tr("WORKLY · Identidade profissional única", "WORKLY · One professional identity")}</Text>
      </ScrollView>
      {addingCertificate ? <WorkerCertificateEditor worker={worker} professionId={professionCatalog.find(item => item.title === worker.profession)?.id || "professional"} onClose={() => { setAddingCertificate(false); void reload(true); }} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F7F8" },
  content: { width: "100%", maxWidth: 840, alignSelf: "center", padding: 18, paddingBottom: 46, gap: 19 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 39, height: 39, borderRadius: 11, backgroundColor: PALE, borderWidth: 1, borderColor: "#C0D6DF", alignItems: "center", justifyContent: "center" },
  markText: { color: BLUE, fontSize: 22, fontWeight: "900" },
  brand: { color: INK, fontSize: 20, fontWeight: "900", letterSpacing: 2 },
  welcomeTag: { marginLeft: "auto", color: BLUE, fontSize: 11, fontWeight: "700" },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headingText: { flex: 1, gap: 5 },
  kicker: { color: BLUE, fontWeight: "800", fontSize: 10, letterSpacing: 1.1 },
  heading: { color: INK, fontSize: 29, fontWeight: "800" },
  subheading: { color: MUTED, fontSize: 12, lineHeight: 19 },
  later: { flexDirection: "row", alignItems: "center", gap: 4, padding: 7, borderWidth: 1, borderColor: BORDER, borderRadius: 10, backgroundColor: "#FFFFFF" },
  laterText: { fontSize: 11, color: MUTED },
  stepper: { flexDirection: "row", gap: 4 },
  step: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", minWidth: 0, gap: 6, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: BORDER },
  stepActive: { borderBottomColor: BLUE, backgroundColor: PALE, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  stepText: { color: MUTED, fontSize: 10, fontWeight: "700" },
  stepTextActive: { color: INK, fontWeight: "800" },
  panel: { padding: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 20, gap: 14 },
  panelTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  panelCopy: { flex: 1, gap: 4 },
  panelTitle: { color: INK, fontWeight: "800", fontSize: 20 },
  panelCaption: { color: MUTED, fontSize: 11, lineHeight: 17 },
  identitySummary: { flexDirection: "row", alignItems: "center", gap: 11, padding: 11, borderRadius: 13, backgroundColor: "#F5F8F9" },
  identityCopy: { flex: 1, gap: 4 },
  identityName: { color: INK, fontWeight: "800", fontSize: 14 },
  identityMeta: { color: MUTED, fontSize: 11 },
  identityId: { color: BLUE, fontWeight: "800", fontSize: 11 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 11, backgroundColor: "#FBFCFC" },
  stepSymbol: { width: 36, height: 36, backgroundColor: "#EDF3F5", borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepSymbolComplete: { backgroundColor: "#DDEBF0" },
  statusText: { flex: 1, gap: 4 },
  statusTitle: { color: INK, fontSize: 12, fontWeight: "800" },
  statusDescription: { color: MUTED, fontSize: 10, lineHeight: 15 },
  privacy: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, borderRadius: 12, backgroundColor: PALE },
  privacyText: { flex: 1, color: "#496D7D", fontSize: 11, lineHeight: 17 },
  photoPicker: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: BORDER, borderRadius: 13, padding: 10 },
  photoCopy: { flex: 1, gap: 4 },
  photoTitle: { color: INK, fontSize: 13, fontWeight: "800" },
  photoHint: { color: MUTED, fontSize: 10 },
  formLabel: { color: INK, fontWeight: "700", fontSize: 12, marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#C9D9DE", borderRadius: 11, minHeight: 46, backgroundColor: "#FFFFFF", color: INK, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  professions: { gap: 5 },
  professionOption: { flexDirection: "row", gap: 12, alignItems: "center", borderWidth: 1, borderColor: BORDER, borderRadius: 12, backgroundColor: "#FFFFFF", padding: 12 },
  professionSelected: { borderColor: BLUE, backgroundColor: PALE },
  professionText: { flex: 1, fontSize: 12, color: MUTED, fontWeight: "700" },
  professionTextSelected: { color: INK },
  placeholder: { color: MUTED, fontSize: 12, textAlign: "center", paddingVertical: 16 },
  footer: { textAlign: "center", fontSize: 10, color: MUTED },
  error: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#FCF5F5", padding: 10, borderRadius: 11 },
  errorText: { flex: 1, color: "#9C5353", fontSize: 11 },
});
