import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { openWorklyFile } from "@/src/api/documentFiles";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";
import { assessmentGateText, complianceTitle, professionTitle, professionalMetaText, professionalText, scopeText, specialtyCopy } from "@/src/demo/professionalI18n";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { Attendance, Certificate, Company, LanguageCode, Project } from "@/src/demo/types";
import { Avatar, Button, ModalPanel, workspaceColors } from "./primitives";
import { WorkerCareerAtlas } from "./WorkerCareerAtlas";
import { WorkerProfileBackdrop } from "./WorkerProfileBackdrop";
import { WorkerCertificateEditor, WorkerIdentityEditor } from "./WorkerProfileEditors";
import { JourneyStatus, JourneySymbol } from "./WorkerJourneyTree";
import { WorkerSpecialtyTree } from "./WorkerSpecialtyTree";
import { WorkerCompliancePanel } from "./WorkerCompliancePanel";
import { WorkerCompetencyTree } from "./WorkerCompetencyTree";
import { WorkerProofOfWork } from "./WorkerProofOfWork";
import { exportWorkerProfilePdf } from "./workerProfilePdf";
import { assessWorkerCompetence } from "./workerCompetencyEngine";
import { evidenceTypeDefinition } from "./competencyEvidenceModel";
import { buildComplianceTree, buildProfessionTrees, buildSpecialtyTree, buildWorkerCertificateNodes, type AchievementNode } from "./workerCertificateTree";
import { complianceCatalog, findProfessionDefinition, specialtyCatalog } from "./professionCatalog";

const accent = workspaceColors.blue;
const serif = Platform.OS === "android" ? "serif" : "Georgia";

export function WorkerProfileView({
  mode = "combined",
  onOpenJourney,
  onOpenAttendance,
}: {
  mode?: "combined" | "profile" | "journey";
  onOpenJourney?: () => void;
  onOpenAttendance?: () => void;
}) {
  const { user } = useAuth();
  const { state, language, error, notify } = useWorklyData();
  const { width } = useWindowDimensions();
  const compact = width < 960;
  const narrow = width < 600;
  const [selected, setSelected] = useState<AchievementNode | null>(null);
  const [editing, setEditing] = useState(false);
  const [rules, setRules] = useState(false);
  const [certificateTarget, setCertificateTarget] = useState<{ professionId: string; node?: AchievementNode } | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const worker = state?.workers.find(item => item.id === user?.id);
  const achievements = useMemo(() => worker ? buildWorkerCertificateNodes(worker) : [], [worker]);
  const trees = useMemo(() => worker ? buildProfessionTrees(worker, achievements) : [], [worker, achievements]);
  const competencyAssessment = useMemo(() => worker ? assessWorkerCompetence(worker, state?.projects || [], state?.attendance || []) : null, [worker, state?.projects, state?.attendance]);
  const specialtyTree = useMemo(() => worker ? buildSpecialtyTree(worker, competencyAssessment) : null, [worker, competencyAssessment]);
  const complianceTree = useMemo(() => worker ? buildComplianceTree(worker) : null, [worker]);
  const byId = useMemo(() => new Map([...achievements, ...trees.flatMap(tree => [tree.root, ...tree.nodes]), ...(specialtyTree?.nodes || []), ...(complianceTree?.nodes || [])].map(node => [node.id, node])), [achievements, trees, specialtyTree, complianceTree]);
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  if (!worker) return <View style={styles.loading}><ActivityIndicator color={accent} /><Text style={styles.muted}>{error || copy[language].loading}</Text></View>;
  const primaryTree = trees[0];
  const professionDefinition = findProfessionDefinition(worker.profession);
  const displayProfession =
    worker.profession && professionDefinition
      ? professionTitle(
          language,
          professionDefinition.id,
          professionDefinition.title,
          professionDefinition.titleEn,
        )
      : worker.profession || text("Profissão por definir", "Profession not set");
  const worklyId = worker.workly_id || formatWorklyId(worker.id);
  const eligibilityStatus =
    worker.work_eligibility_status ||
    (worker.id === "worker-1" ? "eligible" : "pending");
  const eligibilityLabel =
    eligibilityStatus === "eligible"
      ? text("Apto para trabalhar", "Eligible to work")
      : eligibilityStatus === "not_eligible"
        ? text("Não apto para trabalhar", "Not eligible to work")
        : text(
            "Aptidão a aguardar validação",
            "Eligibility pending verification",
          );

  const exportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportWorkerProfilePdf(worker, competencyAssessment, specialtyTree, complianceTree, state?.projects || [], state?.attendance || [], language);
      notify(
        text(
          Platform.OS === "web" ? "Abriu a exportação PDF do perfil." : "Perfil PDF preparado para partilhar.",
          Platform.OS === "web" ? "Profile PDF export opened." : "Profile PDF prepared for sharing.",
        ),
        "success",
      );
    } catch {
      notify(text("Não foi possível gerar o PDF.", "Could not generate the PDF."), "error");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <View style={styles.root} testID="worker-profile">
      <WorkerProfileBackdrop />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, compact && styles.contentCompact]}>
        <View style={[styles.layout, compact && styles.layoutCompact, mode === "journey" && styles.layoutJourney]}>
          {mode !== "journey" ? (
            <View
              style={[
                styles.identity,
                compact && styles.identityCompact,
                mode === "profile" && styles.identityProfile,
              ]}
              testID="worker-identification"
            >

              <View style={[styles.passportTop, compact && styles.passportTopCompact]}>
                <View style={styles.passportEmblem}><Text style={styles.passportEmblemText}>W</Text></View>
                <View style={styles.passportTopCopy}>
                  <Text style={styles.passportKicker}>{text("WORKLY · IDENTIDADE PROFISSIONAL", "WORKLY · PROFESSIONAL IDENTITY")}</Text>
                  <Text style={styles.passportSub}>{text("Passaporte de carreira", "Career passport")}</Text>
                </View>
                <Ionicons name="shield-outline" size={21} color="#DBAD8D" />
              </View>
              <View style={[styles.identityHero, narrow && styles.heroCompact]}>
                <View style={styles.photoFrame}>
                  <Avatar name={worker.name || "Worker"} source={worker.avatar} flag={worker.flag} size={narrow ? 86 : 114} accent="#C7785D" />
                </View>
                <View style={[styles.identityHeading, narrow && styles.headingCompact]}>
                  <Text style={styles.eyebrow}>{text("PERFIL ÚNICO", "ONE PROFESSIONAL PROFILE")}</Text>
                  <Text style={[styles.name, narrow && styles.nameCompact]}>{worker.name || text("Nome por definir", "Name not set")}</Text>
                  <View style={styles.professionLine}>
                    <Ionicons name="briefcase-outline" size={16} color="#BB624A" />
                    <Text style={styles.profession}>{displayProfession}</Text>
                  </View>
                  {worker.location ? <View style={styles.locationLine}><Ionicons name="location-outline" size={13} color="#8FA0A2" /><Text style={styles.locationText}>{worker.location}</Text></View> : null}
                </View>
              </View>

              <View style={styles.identityBadges}>
                <View style={styles.worklyBadge}>
                  <Ionicons name="finger-print-outline" size={15} color="#D57A60" />
                  <View style={styles.badgeCopy}>
                    <Text style={styles.badgeLabel}>{text("WORKLY ID", "WORKLY ID")}</Text>
                    <Text style={styles.badgeValue}>{worklyId}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.fitBadge,
                    eligibilityStatus === "eligible"
                      ? styles.fitBadgePositive
                      : eligibilityStatus === "not_eligible"
                        ? styles.fitBadgeNegative
                        : styles.fitBadgePending,
                  ]}
                >
                  <Ionicons
                    name={
                      eligibilityStatus === "eligible"
                        ? "shield-checkmark-outline"
                        : eligibilityStatus === "not_eligible"
                          ? "close-circle-outline"
                          : "time-outline"
                    }
                    size={15}
                    color={
                      eligibilityStatus === "eligible"
                        ? "#8FAE91"
                        : eligibilityStatus === "not_eligible"
                          ? "#FF8F8F"
                          : "#E7C76E"
                    }
                  />
                  <View style={styles.badgeCopy}>
                    <Text style={styles.badgeLabel}>
                      {text("Apto para trabalhar", "Fit to work")}
                    </Text>
                    <Text
                      style={[
                        styles.badgeValue,
                        eligibilityStatus === "eligible"
                          ? styles.fitTextPositive
                          : eligibilityStatus === "not_eligible"
                            ? styles.fitTextNegative
                            : styles.fitTextPending,
                      ]}
                    >
                      {eligibilityLabel}
                    </Text>
                  </View>
                </View>
              </View>


              {mode === "profile" && competencyAssessment ? (
                <View style={styles.snapshot} testID="worker-career-snapshot">
                  <View style={styles.snapshotMain}>
                    <Text style={styles.snapshotEyebrow}>{text("POSIÇÃO NA CARREIRA", "CAREER POSITION")}</Text>
                    <Text style={styles.snapshotLevel}>{competencyAssessment.levelLabel}</Text>
                    <Text style={styles.snapshotCaption}>{text("Nível profissional", "Professional level")}</Text>
                  </View>
                  <View style={styles.snapshotMetric}>
                    <Text style={styles.snapshotNumber}>{competencyAssessment.score}<Text style={styles.snapshotSuffix}>/100</Text></Text>
                    <Text style={styles.snapshotCaption}>WORKLY VALUE</Text>
                    <View style={styles.snapshotTrack}><View style={[styles.snapshotFill, { width: String(Math.max(0, Math.min(100, competencyAssessment.score))) + "%" }]} /></View>
                  </View>
                  <View style={styles.snapshotMetric}>
                    <Text style={styles.snapshotNumber}>{competencyAssessment.verifiedProjects}</Text>
                    <Text style={styles.snapshotCaption}>{text("Obras verificadas", "Verified projects")}</Text>
                  </View>
                </View>
              ) : null}
              {mode === "profile" && competencyAssessment?.nextLevelId ? (
                <Pressable accessibilityRole="button" onPress={onOpenJourney} style={({ pressed }) => [styles.nextChapter, pressed && styles.pressed]} testID="worker-next-career-level">
                  <View style={styles.nextChapterIcon}><Ionicons name="trending-up-outline" color="#AF543C" size={21}/></View>
                  <View style={styles.nextChapterCopy}>
                    <Text style={styles.nextChapterEyebrow}>{text("PRÓXIMO OBJETIVO", "NEXT MILESTONE")}</Text>
                    <Text style={styles.nextChapterTitle}>{text("Explorar o próximo nível da carreira", "Explore the next career level")}</Text>
                    <Text style={styles.nextChapterDetail}>{competencyAssessment.missingGates.length} {text("critérios ainda por cumprir", "requirements remaining")}</Text>
                  </View>
                  <Ionicons name="arrow-forward-outline" size={20} color="#AF543C" />
                </Pressable>
              ) : null}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerDiamond} />
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.identityFacts}>
                <View style={styles.identityFact}>
                  <Ionicons name="flag-outline" size={15} color="#B98972" />
                  <View style={styles.identityField}>
                    <Text style={styles.identityLabel}>
                      {text("Nacionalidade", "Nationality")}
                    </Text>
                    <Text style={styles.identityValue}>
                      {localizeDemoText(
                        language,
                        worker.nationality || worker.country || "—",
                      )}
                    </Text>
                  </View>
                </View>
                <View style={styles.identityFact}>
                  <Ionicons name="language-outline" size={15} color="#B98972" />
                  <View style={styles.identityField}>
                    <Text style={styles.identityLabel}>
                      {text("Idiomas", "Languages")}
                    </Text>
                    <Text style={styles.identityValue}>
                      {worker.languages
                        .map((item) => localizeDemoText(language, item))
                        .join(" · ") || "—"}
                    </Text>
                  </View>
                </View>
              </View>
              <Button
                label={text("Editar dados profissionais", "Professional data")}
                icon="create-outline"
                variant="secondary"
                onPress={() => setEditing(true)}
                style={styles.editButton}
                testID="edit-worker-profile"
              />
              {mode === "profile" ? (
                <View style={styles.profileActions}>
                  <Button
                    label={text("Abrir percurso", "Open journey")}
                    icon="git-branch-outline"
                    onPress={onOpenJourney || (() => {})}
                    style={styles.profileActionButton}
                  />
                  <Button
                    label={text("Check-in / Pontos", "Check-in")}
                    icon="location-outline"
                    variant="secondary"
                    onPress={onOpenAttendance || (() => {})}
                    style={styles.profileActionButton}
                  />
                  <Button
                    label={text("Passaporte PDF", "PDF professional passport")}
                    icon="document-text-outline"
                    variant="secondary"
                    loading={exportingPdf}
                    onPress={() => void exportPdf()}
                    style={styles.profileActionButton}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
          {mode !== "profile" ? <View style={styles.main}>
            <View style={[styles.mainHeader, narrow && styles.mainHeaderNarrow]}>
              <View style={styles.headingWrap}><Text style={styles.eyebrow}>{text("A tua evolução", "Your progression")}</Text><Text style={[styles.title, narrow && styles.titleCompact]}>{text("Percurso profissional", "Professional journey")}</Text></View>
            </View>
            {!primaryTree ? (
              <EmptyProfessionalProfile language={language} onStart={() => setEditing(true)} />
            ) : <View style={styles.journey}>
              {competencyAssessment ? (
                <WorkerCareerAtlas worker={worker} assessment={competencyAssessment} language={language} onNode={setSelected}
                  onAddEvidence={() => setCertificateTarget({ professionId: primaryTree?.id || "professional" })}
                  onRules={() => setRules(true)} />
              ) : null}
              <View style={styles.actionRow}>
                <Text style={styles.journeyHint}>
                  {text(
                    "Toca numa competência para ver provas e critérios de progressão.",
                    "Tap a competence to view evidence and progression criteria.",
                  )}
                </Text>
                <Button
                  label={text("Adicionar comprovativo", "Add evidence")}
                  icon="add-outline"
                  variant="secondary"
                  onPress={() =>
                    setCertificateTarget({
                      professionId: primaryTree?.id || "professional",
                    })
                  }
                  style={styles.addButton}
                  testID="add-worker-certificate"
                />
              </View>
              {competencyAssessment ? (
                <WorkerCompetencyTree
                  assessment={competencyAssessment}
                  language={language}
                  onNode={setSelected}
                />
              ) : null}
              {specialtyTree ? (
                <WorkerSpecialtyTree
                  tree={specialtyTree}
                  language={language}
                  onNode={setSelected}
                />
              ) : null}
              {complianceTree ? (
                <WorkerCompliancePanel
                  tree={complianceTree}
                  language={language}
                  onNode={setSelected}
                />
              ) : null}
            </View>}
          </View> : null}
        </View>
      </ScrollView>
      {rules && competencyAssessment ? <ModalPanel visible onClose={() => setRules(false)} title={text("Como é calculado o WORKLY VALUE", "How WORKLY VALUE is calculated")} subtitle={text("Quatro dimensões simples formam o valor 0–100. O nível profissional exige também critérios mínimos.", "Four simple dimensions create the 0–100 value. Professional level also requires minimum gates.")}>
        <View style={styles.ruleList}>
          {competencyAssessment.components.map(part => <View key={part.id} style={styles.ruleItem}><Text style={styles.ruleTitle}>{text(part.label, part.labelEn)}</Text><Text style={styles.ruleValue}>{part.points}/{part.maximum}</Text></View>)}
          {competencyAssessment.missingGates.length ? (
            <View style={styles.ruleItem}>
              <Text style={styles.ruleTitle}>{text("Para o próximo nível", "For the next level")}</Text>
              {competencyAssessment.missingGates.map((item, index) => (
                <Text key={item} style={styles.detailNote}>
                  · {assessmentGateText(language, item, competencyAssessment.missingGatesEn[index] || item)}
                </Text>
              ))}
            </View>
          ) : null}
          <Text style={styles.detailNote}>{text("Autorizações, cartões de segurança e conformidade são mostrados à parte. Podem ser obrigatórios para executar um trabalho, mas não aumentam automaticamente a senioridade técnica.", "Authorisations, safety cards and compliance are shown separately. They may be required to perform work, but do not automatically increase technical seniority.")}</Text>
        </View>
      </ModalPanel> : null}
      {selected ? (
        <CertificateDetails
          node={selected}
          byId={byId}
          language={language}
          workerId={worker.id}
          proofEvidence={
            competencyAssessment?.competencies.find(
              (item) => item.competency.id === selected.id,
            )?.evidence
          }
          projects={state?.projects || []}
          attendance={state?.attendance || []}
          companies={state?.companies || []}
          onClose={() => setSelected(null)}
          onAssociate={() => {
            setCertificateTarget({
              professionId: primaryTree?.id || "professional",
              node: selected,
            });
            setSelected(null);
          }}
        />
      ) : null}
      {editing ? <WorkerIdentityEditor worker={worker} onClose={() => setEditing(false)} /> : null}
      {certificateTarget ? <WorkerCertificateEditor worker={worker} {...certificateTarget} onClose={() => setCertificateTarget(null)} /> : null}
    </View>
  );
}

function EmptyProfessionalProfile({
  language,
  onStart,
}: {
  language: LanguageCode;
  onStart: () => void;
}) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const steps = [
    ["person-outline", text("Identificação", "Identity"), text("Completa os dados profissionais essenciais.", "Complete the essential professional details.")],
    ["briefcase-outline", text("Profissão principal", "Main profession"), text("Escolhe uma profissão. Esta será a tua única árvore principal.", "Choose one profession. This becomes your only main tree.")],
    ["briefcase-outline", text("Experiência WORKLY", "WORKLY experience"), text("Começa a contar nas Obras após o registo através de horas e atividade verificadas.", "Starts counting in Projects after registration through verified hours and activity.")],
    ["ribbon-outline", text("Evidências e especialidades", "Evidence & specialties"), text("Liga qualificações e provas às competências para desbloquear progressão.", "Link qualifications and evidence to competences to unlock progression.")],
  ] as const;
  return (
    <View style={styles.emptyProfile} testID="empty-worker-profile">
      <View style={styles.emptyCore}>
        <View style={styles.emptyCoreRing}>
          <Ionicons name="finger-print-outline" size={30} color="#D57A60" />
        </View>
        <Text style={styles.emptyEyebrow}>{text("NOVA IDENTIDADE PROFISSIONAL", "NEW PROFESSIONAL IDENTITY")}</Text>
        <Text style={styles.emptyTitle}>{text("Constrói o teu perfil Worker", "Build your Worker profile")}</Text>
        <Text style={styles.emptyDescription}>
          {text(
            "Começas com um perfil vazio. Escolhes uma profissão principal e a WORKLY gera o percurso correspondente sem misturar outras áreas.",
            "You start with an empty profile. Choose one main profession and WORKLY generates the matching journey without mixing other trades.",
          )}
        </Text>
      </View>
      <View style={styles.emptySteps}>
        {steps.map(([icon, title, description], index) => (
          <View key={title} style={styles.emptyStep}>
            <View style={styles.emptyStepIndex}><Text style={styles.emptyStepNumber}>{String(index + 1).padStart(2, "0")}</Text></View>
            <Ionicons name={icon} size={19} color="#75B8F3" />
            <View style={styles.emptyStepCopy}>
              <Text style={styles.emptyStepTitle}>{title}</Text>
              <Text style={styles.emptyStepDescription}>{description}</Text>
            </View>
          </View>
        ))}
      </View>
      <Button label={text("Criar perfil profissional", "Create professional profile")} icon="add-outline" onPress={onStart} style={styles.emptyStart} />
    </View>
  );
}

function IdentityRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: AchievementNode["icon"];
  label: string;
  value: string;
  tone?: "positive" | "negative" | "pending";
}) {
  const color =
    tone === "positive"
      ? "#8FAE91"
      : tone === "negative"
        ? "#FF8F8F"
        : tone === "pending"
          ? "#E7C76E"
          : "#B98972";
  return (
    <View style={styles.identityRow}>
      <Ionicons name={icon} size={16} color={color} />
      <View style={styles.identityField}>
        <Text style={styles.identityLabel}>{label}</Text>
        <Text style={[styles.identityValue, tone ? { color } : null]}>{value}</Text>
      </View>
    </View>
  );
}

function formatWorklyId(id: string) {
  if (id === "worker-1") return "WLY-W-000001";
  const compact = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `WLY-W-${compact.slice(-8).padStart(8, "0")}`;
}

function CertificateDetails({
  node,
  byId,
  language,
  workerId,
  proofEvidence,
  projects,
  attendance,
  companies,
  onClose,
  onAssociate,
}: {
  node: AchievementNode;
  byId: Map<string, AchievementNode>;
  language: LanguageCode;
  workerId: string;
  proofEvidence?: Certificate[];
  projects: Project[];
  attendance: Attendance[];
  companies: Company[];
  onClose: () => void;
  onAssociate: () => void;
}) {
  const { notify } = useWorklyData();
  const fileId = node.certificate?.file_id || node.evidence?.file_id;
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const specialtyDefinition = specialtyCatalog.find((item) => item.id === node.id);
  const complianceDefinition = complianceCatalog.find((item) => item.id === node.id);
  const displayTitle = specialtyDefinition
    ? specialtyCopy(
        language,
        node.id,
        specialtyDefinition.title,
        specialtyDefinition.titleEn,
      )
    : complianceDefinition
      ? complianceTitle(
          language,
          node.id,
          complianceDefinition.title,
          complianceDefinition.titleEn,
        )
      : localizeDemoText(language, node.title);
  const displaySubtitle = specialtyDefinition
    ? specialtyCopy(
        language,
        node.id,
        specialtyDefinition.description,
        specialtyDefinition.descriptionEn,
        true,
      )
    : complianceDefinition
      ? text(
          "Requisito de conformidade contextual",
          "Contextual compliance requirement",
        )
      : localizeDemoText(language, node.subtitle);
  const openFile = async () => {
    try {
      await openWorklyFile(fileId!);
    } catch {
      notify(
        text(
          "Não foi possível abrir o comprovativo.",
          "Could not open the evidence file.",
        ),
        "error",
      );
    }
  };
  const related = (node.dependsOn || [])
    .map((id) => byId.get(id)?.title)
    .filter(Boolean);
  return (
    <ModalPanel
      visible
      onClose={onClose}
      title={displayTitle}
      subtitle={displaySubtitle}
      footer={
        <>
          {fileId ? (
            <Button
              label={text("Abrir comprovativo", "Open evidence")}
              icon="open-outline"
              onPress={() => void openFile()}
            />
          ) : null}
          <Button
            label={text("Associar evidência", "Associate evidence")}
            icon="attach-outline"
            variant="secondary"
            onPress={onAssociate}
          />
        </>
      }
    >
      <View style={styles.detailContent}>
        <View style={styles.detailSymbol}>
          <JourneySymbol node={node} large />
          <JourneyStatus node={node} language={language} />
        </View>
        {proofEvidence !== undefined ? (
          <View style={styles.proofSection}>
            <View style={styles.proofHeading}>
              <View style={styles.proofHeadingIcon}>
                <Ionicons name="link-outline" size={14} color="#8FAE91" />
              </View>
              <View style={styles.proofHeadingCopy}>
                <Text style={styles.sectionLabel}>PROOF OF WORK</Text>
                <Text style={styles.detailNote}>
                  {text(
                    "Prova rastreável da competência em contexto real.",
                    "Traceable proof of the competence in real work.",
                  )}
                </Text>
              </View>
            </View>
            <WorkerProofOfWork
              workerId={workerId}
              evidence={proofEvidence}
              projects={projects}
              attendance={attendance}
              companies={companies}
              language={language}
            />
          </View>
        ) : null}
        <Text style={styles.sectionLabel}>{text("Âmbito", "Scope")}</Text>
        <Text style={styles.detailText}>
          {scopeText(language, localizeDemoText(language, node.scope))}
        </Text>
        {node.certificate ? (
          <View style={styles.detailsGrid}>
            <DetailRow
              label={text("Tipo de evidência", "Evidence type")}
              value={
                node.certificate.evidence_type
                  ? text(
                      evidenceTypeDefinition(node.certificate.evidence_type)?.label || node.certificate.evidence_type,
                      evidenceTypeDefinition(node.certificate.evidence_type)?.labelEn || node.certificate.evidence_type,
                    )
                  : text("Registo legado", "Legacy record")
              }
            />
            <DetailRow
              label={text("Entidade", "Issuer")}
              value={node.certificate.issuer || "—"}
            />
            <DetailRow
              label={text("Contexto", "Context")}
              value={node.certificate.context || "—"}
            />
            <DetailRow
              label={text("Horas", "Hours")}
              value={node.certificate.hours ? String(node.certificate.hours) : "—"}
            />
            <DetailRow
              label={text("Emissão", "Issued")}
              value={node.certificate.issued_at || "—"}
            />
            <DetailRow
              label={text("Validade", "Expiry")}
              value={node.certificate.expires_at || "—"}
            />
            <DetailRow
              label={text("Ficheiro", "File")}
              value={node.certificate.file_name || "—"}
            />
          </View>
        ) : null}
        {node.meta?.length ? (
          <View style={styles.criteriaBlock}>
            <Text style={styles.sectionLabel}>{text("Critérios de progressão", "Progression criteria")}</Text>
            {node.meta.map((item) => (
              <Text key={item} style={styles.detailText}>
                {professionalMetaText(
                  language,
                  localizeDemoText(language, item),
                )}
              </Text>
            ))}
          </View>
        ) : null}
        {node.verificationNote ? (
          <Text style={styles.detailNote}>
            {localizeDemoText(language, node.verificationNote)}
          </Text>
        ) : null}
        {related.length ? (
          <View style={styles.related}>
            <Text style={styles.sectionLabel}>
              {text("Percurso associado", "Related journey")}
            </Text>
            <Text style={styles.detailText}>{related.join(" · ")}</Text>
            <Text style={styles.detailNote}>
              {text(
                "A sequência visual organiza a formação e não substitui os requisitos da entidade emissora.",
                "The visual sequence organizes training and does not replace issuer requirements.",
              )}
            </Text>
          </View>
        ) : null}
      </View>
    </ModalPanel>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.identityLabel}>{label}</Text>
      <Text style={styles.identityValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: "#F5F3EE" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  content: { padding: 31, paddingBottom: 44 },
  contentCompact: { padding: 15, paddingBottom: 26 },
  layout: { width: "100%", maxWidth: 1400, alignSelf: "center", flexDirection: "row", alignItems: "flex-start", gap: 24 },
  layoutCompact: { flexDirection: "column", gap: 24 },
  layoutJourney: { maxWidth: 1180 },
  identityProfile: { width: "100%", maxWidth: 1040, alignSelf: "center" },
  profileOverview: { flex: 1, minWidth: 0, width: "100%", gap: 18 },
  profileActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  profileActionButton: { minWidth: 170, flexGrow: 1 },
  identity: { width: 316, flexShrink: 0, padding: 26, borderWidth: 1, borderColor: "#DDD6CC", backgroundColor: "#FFFEFC", borderRadius: 24, shadowColor: "#24353E", shadowOpacity: .08, shadowRadius: 24, shadowOffset: { width: 0, height: 11 } },
  identityCompact: { width: "100%", padding: 18, borderRadius: 18 },
  identityHero: { flexDirection: "row", alignItems: "center", gap: 23, paddingVertical: 24, flexWrap: "wrap" },
  heroCompact: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 20, flexWrap: "nowrap" },
  identityHeading: { flex: 1, minWidth: 150, alignItems: "flex-start", gap: 6 },
  professionLine: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 7, maxWidth: "100%" },
  headingCompact: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  eyebrow: { color: "#916E5E", fontSize: 10, lineHeight: 16, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "800" },
  name: { color: "#20323B", fontFamily: serif, fontSize: 32, lineHeight: 41, textAlign: "left", fontWeight: "700" },
  nameCompact: { fontSize: 22, lineHeight: 29, textAlign: "left" },
  profession: { color: "#445A63", fontSize: 14, lineHeight: 21, textAlign: "left", flexShrink: 1, fontWeight: "700" },
  professionCompact: { textAlign: "left" },
  identityBadges: { marginTop: 0, flexDirection: "row", flexWrap: "wrap", gap: 9 },
  worklyBadge: { flex: 1, minWidth: 188, minHeight: 65, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#E3D9CF", backgroundColor: "#F8F4ED", borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11 },
  fitBadge: { flex: 1, minWidth: 188, minHeight: 65, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11 },
  fitBadgePositive: { borderColor: "#B9DBCA", backgroundColor: "#EFF8F0" },
  fitBadgePending: { borderColor: "#E8D6AD", backgroundColor: "#FFF8E9" },
  fitBadgeNegative: { borderColor: "#E9C0B9", backgroundColor: "#FFF2F1" },
  badgeCopy: { flex: 1, minWidth: 0, gap: 2 },
  badgeLabel: { color: "#78858A", fontSize: 9, lineHeight: 13, letterSpacing: .7, textTransform: "uppercase", fontWeight: "800" },
  badgeValue: { color: "#263A43", fontSize: 12, lineHeight: 18, fontWeight: "800", flexShrink: 1 },
  fitTextPositive: { color: "#2B7750" },
  fitTextPending: { color: "#926F23" },
  fitTextNegative: { color: "#B74342" },
  divider: { marginVertical: 18, flexDirection: "row", gap: 8, alignItems: "center" },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E1DBD1" },
  dividerDiamond: { width: 5, height: 5, borderWidth: 1, borderColor: "#A15A48", transform: [{ rotate: "45deg" }] },
  identityFacts: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  identityFact: { flex: 1, minWidth: 175, flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: "#E7E0D8", backgroundColor: "#F9F7F2", borderRadius: 12, padding: 13 },
  identityRows: { gap: 18 },
  identityRowsCompact: { flexDirection: "row", flexWrap: "wrap", columnGap: 18, rowGap: 16 },
  identityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, flexShrink: 1, minWidth: 100 },
  identityField: { flex: 1, minWidth: 0, gap: 4 },
  identityLabel: { color: "#76858A", fontSize: 10, lineHeight: 15, minWidth: 60 },
  identityValue: { color: "#273C45", fontSize: 12, lineHeight: 19, flexShrink: 1, fontWeight: "700" },
  identityCode: { color: "#87776B", fontSize: 10, lineHeight: 17, textAlign: "center", marginTop: 12, letterSpacing: .5 },
  editButton: { marginTop: 18, borderRadius: 11, borderColor: "#DCCBBE", minHeight: 44 },
  aboutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, minHeight: 42, marginTop: 4 },
  aboutLabel: { color: "#9B897A", fontSize: 11 },
  main: { flex: 1, minWidth: 0, width: "100%", gap: 18 },
  mainHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 },
  mainHeaderNarrow: { flexWrap: "nowrap", gap: 10 },
  headingWrap: { flexGrow: 1, flexShrink: 1, gap: 4 },
  title: { color: "#22343D", fontFamily: serif, fontSize: 34, lineHeight: 44 },
  titleCompact: { fontSize: 27, lineHeight: 35 },
  scoreBadge: { alignItems: "flex-end", gap: 3, paddingVertical: 6, paddingLeft: 16, borderLeftWidth: 1, borderColor: "#5A4035" },
  scoreValue: { color: "#D57A60", fontSize: 30, lineHeight: 36, fontWeight: "600" },
  scoreMaximum: { color: "#8B7A6D", fontSize: 15 },
  scoreLabel: { color: "#8F7F73", fontSize: 10, lineHeight: 15 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 20, borderBottomWidth: 1, borderColor: "#3B3029" },
  tab: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, paddingHorizontal: 2, borderBottomWidth: 2, borderColor: "transparent" },
  tabActive: { borderColor: "#B84A3A" },
  tabText: { color: "#82756A", fontSize: 12 },
  tabTextActive: { color: "#EEE8DE" },
  journey: { gap: 15 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 },
  journeyHint: { color: "#627780", fontSize: 12, lineHeight: 19, flexShrink: 1 },
  addButton: { minHeight: 40, borderRadius: 6 },
  portfolio: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  portfolioItem: { width: "100%", flexGrow: 1, minWidth: 0, padding: 20, gap: 12, borderRadius: 3, borderWidth: 1, borderColor: "#2B4054", backgroundColor: "#0C1925DB" },
  projectHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  portfolioTitle: { flex: 1, minWidth: 0, color: "#E0E8F0", fontFamily: serif, fontSize: 22, lineHeight: 29 },
  projectYear: { color: "#91ADC6", fontSize: 13 },
  projectLocation: { color: "#8CA4BA", fontSize: 12, lineHeight: 19 },
  projectSummary: { color: "#B3C3D2", fontSize: 13, lineHeight: 22 },
  projectStatus: { flexDirection: "row", alignItems: "center", gap: 7, borderTopWidth: 1, borderColor: "#253E55", paddingTop: 12 },
  muted: { color: workspaceColors.muted, fontSize: 12, lineHeight: 19 },
  pressed: { opacity: .72 },
  ruleList: { gap: 16 },
  ruleItem: { padding: 16, gap: 8, borderWidth: 1, borderColor: "#2B4055", borderRadius: 8, backgroundColor: "#0B1928" },
  ruleTitle: { color: "#BFCEDF", fontSize: 13, lineHeight: 20 },
  ruleValue: { color: "#8FC0F6", fontSize: 24, fontWeight: "600" },
  detailContent: { gap: 18 },
  proofSection: { gap: 10, borderWidth: 1, borderColor: "#43342B", borderRadius: 5, backgroundColor: "#0C0B0A", padding: 12 },
  proofHeading: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  proofHeadingIcon: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, borderColor: "#285941", backgroundColor: "#11140F", alignItems: "center", justifyContent: "center" },
  proofHeadingCopy: { flex: 1, minWidth: 0, gap: 2 },
  detailSymbol: { alignItems: "center", gap: 8, paddingBottom: 12 },
  sectionLabel: { color: "#BDCADA", fontSize: 11, lineHeight: 17, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  detailText: { color: "#BCCCDC", fontSize: 13, lineHeight: 22 },
  detailNote: { color: "#8FA4B9", fontSize: 12, lineHeight: 20 },
  detailsGrid: { gap: 14, padding: 16, borderWidth: 1, borderColor: "#2A3F54", borderRadius: 7 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  criteriaBlock: { gap: 8, borderTopWidth: 1, borderColor: "#2A3F54", paddingTop: 16 },
  related: { gap: 10, borderTopWidth: 1, borderColor: "#2A3F54", paddingTop: 18 },
  education: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46, paddingVertical: 10, flexWrap: "wrap" },
  emptyProfile: { borderWidth: 1, borderColor: "#DDD6CC", borderRadius: 18, backgroundColor: "#FFFEFC", padding: 22, gap: 20 },
  emptyCore: { alignItems: "center", gap: 8, paddingVertical: 8 },
  emptyCoreRing: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: "#2F6388", backgroundColor: "#17100E", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyEyebrow: { color: "#7292AD", fontSize: 9, lineHeight: 14, fontWeight: "700", letterSpacing: 1.8 },
  emptyTitle: { color: "#20333B", fontSize: 24, lineHeight: 31, fontWeight: "700", textAlign: "center" },
  emptyDescription: { maxWidth: 620, color: "#637780", fontSize: 12, lineHeight: 20, textAlign: "center" },
  emptySteps: { gap: 4 },
  emptyStep: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "#132736", paddingVertical: 10 },
  emptyStepIndex: { width: 30 },
  emptyStepNumber: { color: "#456C8B", fontSize: 9, letterSpacing: 1.2, fontWeight: "700" },
  emptyStepCopy: { flex: 1, minWidth: 0, gap: 2 },
  emptyStepTitle: { color: "#263C45", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  emptyStepDescription: { color: "#82766B", fontSize: 10, lineHeight: 16 },
  passportTop: { marginHorizontal: -26, marginTop: -26, paddingHorizontal: 26, paddingVertical: 16, minHeight: 71, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#253741", borderTopLeftRadius: 23, borderTopRightRadius: 23 },
  passportTopCompact: { marginHorizontal: -18, marginTop: -18, borderTopLeftRadius: 17, borderTopRightRadius: 17, paddingHorizontal: 18 },
  passportEmblem: { width: 37, height: 37, borderWidth: 1, borderColor: "#96715C", backgroundColor: "#354B54", borderRadius: 11, alignItems: "center", justifyContent: "center" },
  passportEmblemText: { color: "#E4A88D", fontSize: 22, fontWeight: "900" },
  passportTopCopy: { flex: 1, minWidth: 0, gap: 2 },
  passportKicker: { color: "#E5C7B8", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  passportSub: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  photoFrame: { padding: 4, borderRadius: 65, borderWidth: 2, borderColor: "#E0D3C5", backgroundColor: "#F3EEE6" },
  locationLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { color: "#71838B", fontSize: 12 },
  snapshot: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 18 },
  snapshotMain: { flex: 1, minWidth: 120, backgroundColor: "#F0E3D8", padding: 15, borderRadius: 15, gap: 2 },
  snapshotMetric: { flex: 1, minWidth: 120, backgroundColor: "#F3F5F2", borderWidth: 1, borderColor: "#E7EAE4", padding: 15, borderRadius: 15, gap: 3 },
  snapshotEyebrow: { color: "#A2634C", letterSpacing: 1.1, fontSize: 9, fontWeight: "800" },
  snapshotLevel: { color: "#954632", fontSize: 30, fontWeight: "900", lineHeight: 37 },
  snapshotCaption: { color: "#667981", fontSize: 10, lineHeight: 15, fontWeight: "700" },
  snapshotNumber: { color: "#273B44", fontSize: 27, fontWeight: "800" },
  snapshotSuffix: { color: "#859295", fontSize: 12 },
  snapshotTrack: { height: 4, borderRadius: 4, backgroundColor: "#E0E6E4", marginTop: 6, overflow: "hidden" },
  snapshotFill: { height: "100%", backgroundColor: "#BE6A50" },
  nextChapter: { marginTop: 14, borderWidth: 1, borderColor: "#E5D3C5", backgroundColor: "#FCF5EE", borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  nextChapterIcon: { width: 38, height: 38, backgroundColor: "#F4E1D1", borderRadius: 11, alignItems: "center", justifyContent: "center" },
  nextChapterCopy: { flex: 1, gap: 2 },
  nextChapterEyebrow: { color: "#9C634C", fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  nextChapterTitle: { color: "#293C43", fontSize: 12, fontWeight: "800" },
  nextChapterDetail: { color: "#77868A", fontSize: 10 },
  emptyStart: { alignSelf: "center", minWidth: 220 },
});
