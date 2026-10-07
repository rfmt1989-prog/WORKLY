import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { openWorklyFile } from "@/src/api/documentFiles";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";
import { uiText } from "@/src/demo/fullUi";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { LanguageCode, ProfessionalIdentity } from "@/src/demo/types";
import {
  Avatar,
  Button,
  ModalPanel,
  ProgressBar,
  StatusPill,
  workspaceColors,
} from "./primitives";
import { WorkerProfileBackdrop } from "./WorkerProfileBackdrop";
import {
  WorkerCertificateEditor,
  WorkerIdentityEditor,
} from "./WorkerProfileEditors";
import {
  buildProfessionTrees,
  buildWorkerCertificateNodes,
  isCompleted,
  statusIcon,
  statusLabel,
  statusTone,
  type AchievementNode,
  type ProfessionTree,
} from "./workerCertificateTree";

const accent = workspaceColors.blue;
const serif = Platform.OS === "android" ? "serif" : "Georgia";

export function WorkerProfileView() {
  const { user } = useAuth();
  const { state, language, error } = useWorklyData();
  const { width } = useWindowDimensions();
  const compact = width < 1000;
  const oneColumn = width < 740;
  const [selected, setSelected] = useState<AchievementNode | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [certificateTarget, setCertificateTarget] = useState<{
    professionId: string;
    node?: AchievementNode;
  } | null>(null);
  const worker = state?.workers.find((item) => item.id === user?.id);
  const achievements = useMemo(
    () => (worker ? buildWorkerCertificateNodes(worker) : []),
    [worker],
  );
  const trees = useMemo(
    () => (worker ? buildProfessionTrees(worker, achievements) : []),
    [worker, achievements],
  );
  const byId = useMemo(
    () =>
      new Map(
        [
          ...achievements,
          ...trees.flatMap((tree) => [tree.root, ...tree.nodes]),
        ].map((node) => [node.id, node]),
      ),
    [achievements, trees],
  );
  const text = (pt: string, en: string) => uiText(language, pt, en);
  if (!worker)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={accent} />
        <Text style={styles.muted}>{error || copy[language].loading}</Text>
      </View>
    );
  const visible = trees;
  const primaryTree = trees[0];
  const expandedTree =
    primaryTree?.id === expanded ? primaryTree : undefined;
  const count = new Set(
    achievements.flatMap((node) =>
      node.certificate ? [node.certificate.id] : [],
    ),
  ).size;
  const displayProfession = worker.profession;

  return (
    <View style={styles.root} testID="worker-profile">
      <WorkerProfileBackdrop />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          compact ? styles.contentCompact : null,
        ]}
      >
        <View style={[styles.layout, compact ? styles.layoutCompact : null]}>
          <View
            style={[styles.identity, compact ? styles.identityCompact : null]}
            testID="worker-identification"
          >
            <View
              style={[styles.identityHero, compact ? styles.heroCompact : null]}
            >
              <Avatar
                name={worker.name}
                source={worker.avatar}
                size={compact ? 86 : 118}
              />
              <View
                style={[
                  styles.identityHeading,
                  compact ? styles.headingCompact : null,
                ]}
              >
                <Text style={styles.eyebrow}>WORKLY · WORKER</Text>
                <Text style={styles.identityCode}>{text("Identidade profissional", "Professional identity")} · {worker.id}</Text>
                <Text
                  style={[styles.name, compact ? styles.nameCompact : null]}
                >
                  {worker.name}
                </Text>
                <Text style={styles.profession}>
                  {localizeDemoText(language, displayProfession)}
                </Text>
                <StatusPill
                  status={worker.status}
                  label={
                    worker.status === "on_site"
                      ? copy[language].onSite
                      : worker.status === "contracted"
                        ? copy[language].contracted
                        : copy[language].available
                  }
                />
              </View>
            </View>
            <Button
              label={text("Editar perfil", "Edit profile")}
              icon="create-outline"
              variant="secondary"
              onPress={() => setEditing(true)}
              style={styles.editButton}
              testID="edit-worker-profile"
            />
            <Divider />
            <Text style={styles.sectionLabel}>
              {text("Identificação", "Identity")}
            </Text>
            <View style={styles.identityRows}>
              <IdentityRow
                icon="construct-outline"
                label={text("Experiência", "Experience")}
                value={`${worker.experience_years} ${text("anos", "years")}`}
              />
              <IdentityRow
                icon="calendar-outline"
                label={text("Novas obras", "New projects")}
                value={worker.availability ? text("Disponível", "Available") : text("Indisponível", "Unavailable")}
              />
              <IdentityRow
                icon="flag-outline"
                label={text("País", "Country")}
                value={`${worker.flag} ${localizeDemoText(language, worker.country)}`}
              />
              <IdentityRow
                icon="location-outline"
                label={text("Localização", "Location")}
                value={worker.location}
              />
              <IdentityRow
                icon="mail-outline"
                label="Email"
                value={worker.email}
              />
              <IdentityRow
                icon="call-outline"
                label={text("Telefone", "Phone")}
                value={worker.phone || "—"}
              />
              <IdentityRow
                icon="language-outline"
                label={text("Idiomas", "Languages")}
                value={
                  worker.languages
                    .map((item) => localizeDemoText(language, item))
                    .join(" · ") || "—"
                }
              />
            </View>
            <Divider />
            <Text style={styles.sectionLabel}>
              {text("Percurso profissional", "Professional journey")}
            </Text>
            <Text style={styles.bio}>
              {localizeDemoText(language, worker.bio)}
            </Text>
            {worker.name.toLowerCase().includes("rodolfo maia") ? (
              <View style={styles.education}>
                <Ionicons
                  name="school-outline"
                  size={23}
                  color={workspaceColors.blueSoft}
                />
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={styles.educationTitle}>
                    {text(
                      "Técnico Eletromecânico IV",
                      "Electromechanical Technician IV",
                    )}
                  </Text>
                  <Text style={styles.muted}>2008 · Portugal</Text>
                </View>
              </View>
            ) : null}
          </View>
          <View style={styles.main}>
            {worker.professional_identity ? <ProfessionalProgress identity={worker.professional_identity} language={language} /> : null}
            <View style={styles.mainHeader}>
              <View style={styles.headingWrap}>
                <Text style={styles.eyebrow}>
                  {text(
                    "A tua profissão, organizada",
                    "Your profession, organized",
                  )}
                </Text>
                <Text
                  style={[styles.title, oneColumn ? styles.titleCompact : null]}
                >
                  {text("Árvore profissional", "Professional tree")}
                </Text>
                <Text style={styles.subtitle}>
                  {text(
                    "Certificações da profissão principal e skills adicionais desbloqueáveis.",
                    "Main profession certifications and unlockable additional skills.",
                  )}
                </Text>
              </View>
              <Button
                label={text("Adicionar certificado", "Add certificate")}
                icon="add-outline"
                onPress={() =>
                  setCertificateTarget({
                    professionId: primaryTree?.id || "professional",
                  })
                }
                style={styles.addButton}
                testID="add-worker-certificate"
              />
            </View>
            <View style={styles.overview}>
              <OverviewStat
                value={count}
                label={text(
                  "certificados associados",
                  "associated certificates",
                )}
                icon="ribbon-outline"
              />
              <OverviewStat
                value={trees.length}
                label={text("profissão principal", "main profession")}
                icon="git-branch-outline"
              />
              <OverviewStat
                value={worker.documents.filter((item) => item.file_id).length}
                label={text("comprovativos", "evidence files")}
                icon="document-attach-outline"
              />
            </View>
            <View style={styles.grid} testID="profession-trees">
              {visible.map((tree) => (
                <ProfessionCard
                  key={tree.id}
                  tree={tree}
                  language={language}
                  single
                  onNode={setSelected}
                  onExpand={() => setExpanded(tree.id)}
                />
              ))}
            </View>
            <View style={styles.legend}>
              <LegendItem
                label={text("Verificado", "Verified")}
                color={workspaceColors.blueSoft}
              />
              <LegendItem
                label={text("Registado", "Recorded")}
                color={accent}
              />
              <LegendItem
                label={text("A validar", "Pending")}
                color="#CDB37E"
              />
              <LegendItem
                label={text("Por adicionar", "To add")}
                color="#7D899C"
              />
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.sectionLabel}>{text("Competências adicionais", "Additional skills")}</Text>
              <Text style={styles.scoreHint}>{text("As competências declaradas só somam pontos após confirmação de um comprovativo.", "Declared skills only earn points after supporting evidence is confirmed.")}</Text>
              <View style={styles.skillTags}>
                {worker.skills.map((skill) => <View key={skill.name} style={styles.levelStep}><Text style={styles.scoreLabel}>{localizeDemoText(language, skill.name)}</Text></View>)}
              </View>
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.sectionLabel}>{text("Portefólio profissional", "Professional portfolio")}</Text>
              {worker.best_projects.length ? worker.best_projects.map((project) => <View key={project.id} style={styles.portfolioItem}>
                <Text style={styles.portfolioTitle}>{project.title}</Text>
                <Text style={styles.scoreHint}>{project.location} · {project.year} · {project.status === "verified" ? text("Confirmado pela empresa", "Confirmed by company") : text("Declarado pelo worker", "Declared by worker")}</Text>
                <Text style={styles.bio}>{project.summary}</Text>
              </View>) : <Text style={styles.scoreHint}>{text("Adiciona as tuas obras em Editar perfil.", "Add your projects using Edit profile.")}</Text>}
            </View>
          </View>
        </View>
      </ScrollView>
      {expandedTree ? (
        <ModalPanel
          visible
          wide
          onClose={() => setExpanded(null)}
          title={text(expandedTree.title, expandedTree.titleEn)}
          subtitle={text(
            "Certificados e progressão desta profissão",
            "Certificates and progression for this profession",
          )}
          footer={
            <Button
              label={text("Adicionar certificado", "Add certificate")}
              icon="add-outline"
              onPress={() => {
                setExpanded(null);
                setCertificateTarget({ professionId: expandedTree.id });
              }}
            />
          }
        >
          <View>
            {[
              expandedTree.root,
              ...expandedTree.certifications,
              ...expandedTree.additionalSkills,
            ].map((node, index) => {
              const skillStart = 1 + expandedTree.certifications.length;
              const lastIndex =
                expandedTree.certifications.length +
                expandedTree.additionalSkills.length;
              return (
                <React.Fragment key={node.id}>
                  {index === 1 ? (
                    <View style={styles.treeSectionHeading}>
                      <Ionicons
                        name="ribbon-outline"
                        size={16}
                        color={workspaceColors.blueSoft}
                      />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={styles.sectionLabel}>
                          {text(
                            "Certificações profissionais",
                            "Professional certifications",
                          )}
                        </Text>
                        <Text style={styles.treeSectionHint}>
                          {text(
                            "Formação e certificados diretamente ligados à profissão.",
                            "Training and certificates directly linked to the profession.",
                          )}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  {index === skillStart &&
                  expandedTree.additionalSkills.length ? (
                    <View style={styles.treeSectionHeading}>
                      <Ionicons
                        name="sparkles-outline"
                        size={16}
                        color={workspaceColors.blueSoft}
                      />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={styles.sectionLabel}>
                          {text("Skills adicionais", "Additional skills")}
                        </Text>
                        <Text style={styles.treeSectionHint}>
                          {text(
                            "Competências complementares desbloqueadas à medida que o percurso profissional evolui.",
                            "Complementary skills unlocked as the professional journey progresses.",
                          )}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.fullTreeRow}>
                    <View style={styles.fullTreeRail}>
                      <View
                        style={[
                          styles.fullTreeLine,
                          index === 0 ? { top: "50%" } : null,
                          index === lastIndex ? { bottom: "50%" } : null,
                        ]}
                      />
                      <Diamond node={node} />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={node.title}
                      onPress={() => {
                        setExpanded(null);
                        setSelected(node);
                      }}
                      style={({ pressed }) => [
                        styles.fullTreeContent,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text style={styles.nodeTitle}>
                        {localizeDemoText(language, node.title)}
                      </Text>
                      <Text style={styles.nodeSubtitle}>
                        {localizeDemoText(language, node.subtitle)}
                      </Text>
                      <NodeStatus node={node} language={language} />
                    </Pressable>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </ModalPanel>
      ) : null}
      {selected ? (
        <CertificateDetails
          node={selected}
          byId={byId}
          language={language}
          onClose={() => setSelected(null)}
          onAssociate={() => {
            const tree =
              trees.find((item) =>
                item.nodes.some((node) => node.id === selected.id),
              ) ||
              trees.find((item) => item.root.id === selected.id) ||
              trees[0];
            setCertificateTarget({
              professionId: tree?.id || "professional",
              node: selected,
            });
            setSelected(null);
          }}
        />
      ) : null}
      {editing ? (
        <WorkerIdentityEditor
          worker={{ ...worker, profession: displayProfession }}
          onClose={() => setEditing(false)}
        />
      ) : null}
      {certificateTarget ? (
        <WorkerCertificateEditor
          worker={worker}
          {...certificateTarget}
          onClose={() => setCertificateTarget(null)}
        />
      ) : null}
    </View>
  );
}

function ProfessionalProgress({ identity, language }: { identity: ProfessionalIdentity; language: LanguageCode }) {
  const text = (pt: string, en: string) => uiText(language, pt, en);
  return <View style={styles.scorePanel} testID="professional-progression">
    <View style={styles.scoreHeading}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.sectionLabel}>{text("Nível profissional Workly", "Workly professional level")}</Text>
        <Text style={styles.levelTitle}>{text(identity.level.label, identity.level.label_en)}</Text>
      </View>
      <View style={styles.scoreValueGroup}><Text style={styles.scoreValue}>{identity.score}<Text style={styles.scoreMaximum}>/100</Text></Text><Text style={styles.scoreLabel}>{text("Pontuação profissional", "Professional score")}</Text></View>
    </View>
    <View style={styles.levelSteps}>
      {identity.levels.map((level, index) => <View key={level.id} style={[styles.levelStep, index === identity.level_index ? styles.levelCurrent : null]}>
        <Ionicons name={index <= identity.level_index ? "ribbon-outline" : "lock-closed-outline"} size={17} color={index <= identity.level_index ? workspaceColors.blueSoft : workspaceColors.muted} />
        <Text style={styles.scoreLabel}>{text(level.label, level.label_en)}</Text><Text style={styles.scoreHint}>{level.minimum} {text("pts", "pts")}</Text>
      </View>)}
    </View>
    <ProgressBar value={identity.progress} accent={workspaceColors.blue} />
    <Text style={styles.scoreHint}>{identity.next_level ? text(`Faltam ${identity.points_to_next} pontos para ${identity.next_level.label}.`, `${identity.points_to_next} points to ${identity.next_level.label_en}.`) : text("Master alcançado nesta profissão.", "Master achieved in this profession.")}</Text>
    <View style={styles.scoreComponents}>
      {identity.components.map((part) => <View key={part.id} style={styles.scorePart}>
        <Text style={styles.scoreLabel}>{text(part.label, part.label_en)}</Text><Text style={styles.scorePartValue}>{part.points}/{part.maximum}</Text><Text style={styles.scoreHint}>{part.count} {text("confirmados", "confirmed")} · {part.points_each} {text("pts cada", "pts each")}</Text>
      </View>)}
    </View>
    <Text style={styles.scoreHint}>{text("Só contam comprovativos verificados e dentro da validade. Master exige 85 pontos, com certificações e obras confirmadas na profissão principal. O nível Workly é uma classificação interna.", "Only verified, current evidence counts. Master requires 85 points with certifications and confirmed projects in your primary trade. The Workly level is an internal classification.")}</Text>
  </View>;
}

function Divider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerDiamond} />
      <View style={styles.dividerLine} />
    </View>
  );
}
function IdentityRow({
  icon,
  label,
  value,
}: {
  icon: AchievementNode["icon"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.identityRow}>
      <Ionicons name={icon} size={16} color={workspaceColors.blueSoft} />
      <Text style={styles.identityLabel}>{label}</Text>
      <Text style={styles.identityValue}>{value}</Text>
    </View>
  );
}
function OverviewStat({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: AchievementNode["icon"];
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={workspaceColors.blueSoft} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}
function Diamond({ node }: { node: AchievementNode }) {
  return (
    <View
      style={[
        styles.diamond,
        {
          borderColor: statusTone(node.status, accent),
          backgroundColor: isCompleted(node.status) ? "#12243B" : "#111821",
        },
      ]}
    >
      <View style={styles.diamondInner}>
        <Ionicons
          name={node.icon}
          color={statusTone(node.status, accent)}
          size={19}
        />
      </View>
    </View>
  );
}
function NodeStatus({
  node,
  language,
}: {
  node: AchievementNode;
  language: LanguageCode;
}) {
  return (
    <View style={styles.nodeStatus}>
      <Ionicons
        name={statusIcon(node.status)}
        size={12}
        color={statusTone(node.status, accent)}
      />
      <Text
        style={[
          styles.nodeStatusText,
          { color: statusTone(node.status, accent) },
        ]}
      >
        {uiText(
          language,
          statusLabel(node.status),
          node.status === "verified"
            ? "VERIFIED"
            : node.status === "recorded"
              ? "RECORDED"
              : node.status === "pending"
                ? "PENDING"
                : node.status === "locked"
                  ? "NEXT STEP"
                  : "TO ADD",
        )}
      </Text>
    </View>
  );
}
function TreeNode({
  node,
  language,
  root = false,
  onPress,
}: {
  node: AchievementNode;
  language: LanguageCode;
  root?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={localizeDemoText(language, node.title)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.treeNode,
        root ? styles.treeRoot : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Diamond node={node} />
      <View style={styles.nodeCaption}>
        <Text style={styles.nodeTitle}>
          {root && node.id === "course" && node.meta?.includes("2008")
            ? uiText(
                language,
                "Formação técnica IV",
                "Technical qualification IV",
              )
            : localizeDemoText(language, node.title)}
        </Text>
        <NodeStatus node={node} language={language} />
      </View>
    </Pressable>
  );
}
function ProfessionCard({
  tree,
  language,
  single,
  onNode,
  onExpand,
}: {
  tree: ProfessionTree;
  language: LanguageCode;
  single: boolean;
  onNode: (node: AchievementNode) => void;
  onExpand: () => void;
}) {
  const confirmed = tree.certifications.filter((node) =>
    isCompleted(node.status),
  ).length;
  const unlockedSkills = tree.additionalSkills.filter((node) =>
    isCompleted(node.status),
  ).length;
  return (
    <View
      style={[styles.professionCard, single ? styles.cardSingle : null]}
      testID={`profession-tree-${tree.id}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons
            name={tree.icon}
            size={24}
            color={workspaceColors.blueSoft}
          />
        </View>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle}>
            {uiText(language, tree.title, tree.titleEn)}
          </Text>
          <Text style={styles.cardDescription}>
            {uiText(language, tree.description, tree.descriptionEn)}
          </Text>
        </View>
      </View>
      <View style={styles.treeDiagram}>
        <TreeNode
          node={tree.root}
          language={language}
          root
          onPress={() => onNode(tree.root)}
        />
        {tree.preview.length ? (
          <>
            <View style={styles.connector} pointerEvents="none">
              <Svg
                width="100%"
                height="32"
                viewBox="0 0 360 32"
                preserveAspectRatio="none"
              >
                <Path
                  d={
                    tree.preview.length === 1
                      ? "M180 0 V32"
                      : "M180 0 V12 M90 32 V12 H270 V32"
                  }
                  stroke="#637B93"
                  strokeWidth="1"
                  fill="none"
                />
              </Svg>
            </View>
            <View style={styles.branches}>
              {tree.preview.map((node) => (
                <View key={node.id} style={styles.branch}>
                  <TreeNode
                    node={node}
                    language={language}
                    onPress={() => onNode(node)}
                  />
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyTree}>
            {uiText(
              language,
              "Adiciona o primeiro certificado desta profissão.",
              "Add the first certificate for this profession.",
            )}
          </Text>
        )}
      </View>
      <View style={styles.skillSummary}>
        <View style={styles.skillSummaryLabel}>
          <Ionicons
            name="sparkles-outline"
            size={15}
            color={workspaceColors.blueSoft}
          />
          <Text style={styles.skillSummaryTitle}>
            {uiText(language, "Skills adicionais", "Additional skills")}
          </Text>
        </View>
        <Text style={styles.skillSummaryCount}>
          {unlockedSkills}/{tree.additionalSkills.length}{" "}
          {uiText(language, "desbloqueadas", "unlocked")}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${uiText(language, "Ver árvore", "View tree")} · ${uiText(language, tree.title, tree.titleEn)}`}
        onPress={onExpand}
        style={({ pressed }) => [
          styles.cardFooter,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.footerCount}>
          {confirmed}/{tree.certifications.length}{" "}
          {uiText(language, "certificados", "certificates")}
        </Text>
        <View style={styles.footerAction}>
          <Text style={styles.footerLabel}>
            {uiText(language, "Ver árvore", "View tree")}
          </Text>
          <Ionicons
            name="arrow-forward-outline"
            size={16}
            color={workspaceColors.blueSoft}
          />
        </View>
      </Pressable>
    </View>
  );
}
function CertificateDetails({
  node,
  byId,
  language,
  onClose,
  onAssociate,
}: {
  node: AchievementNode;
  byId: Map<string, AchievementNode>;
  language: LanguageCode;
  onClose: () => void;
  onAssociate: () => void;
}) {
  const { notify } = useWorklyData();
  const fileId = node.certificate?.file_id || node.evidence?.file_id;
  const text = (pt: string, en: string) => uiText(language, pt, en);
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
      title={localizeDemoText(language, node.title)}
      subtitle={localizeDemoText(language, node.subtitle)}
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
            label={text("Associar certificado", "Associate certificate")}
            icon="attach-outline"
            variant="secondary"
            onPress={onAssociate}
          />
        </>
      }
    >
      <View style={styles.detailContent}>
        <View style={styles.detailSymbol}>
          <Diamond node={node} />
          <NodeStatus node={node} language={language} />
        </View>
        <Text style={styles.sectionLabel}>{text("Âmbito", "Scope")}</Text>
        <Text style={styles.detailText}>
          {localizeDemoText(language, node.scope)}
        </Text>
        {node.certificate ? (
          <View style={styles.detailsGrid}>
            <DetailRow
              label={text("Entidade", "Issuer")}
              value={node.certificate.issuer || "—"}
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
        {!node.certificate &&
          node.meta?.map((item) => (
            <Text key={item} style={styles.detailText}>
              {localizeDemoText(language, item)}
            </Text>
          ))}
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
  identityCode: { color: "#94AAC0", fontSize: 12, lineHeight: 18 },
  scorePanel: { backgroundColor: "#0C1929", borderWidth: 1, borderColor: "#315379", borderRadius: 16, padding: 20, gap: 16, marginBottom: 24 },
  scoreHeading: { flexDirection: "row", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" },
  levelTitle: { color: "#EFF6FF", fontSize: 28, fontWeight: "700" },
  scoreValueGroup: { gap: 4 },
  scoreValue: { color: workspaceColors.blueSoft, fontSize: 34, fontWeight: "700" },
  scoreMaximum: { fontSize: 18, color: "#94AAC0" },
  scoreLabel: { fontSize: 14, lineHeight: 21, color: "#D3E2F0" },
  scoreHint: { fontSize: 14, lineHeight: 21, color: "#94AAC0" },
  levelSteps: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  levelStep: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "#2B3F55", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10 },
  levelCurrent: { borderColor: workspaceColors.blue, backgroundColor: "#112D4C" },
  scoreComponents: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  scorePart: { flex: 1, minWidth: 150, gap: 5, backgroundColor: "#09131F", borderRadius: 10, padding: 14 },
  scorePartValue: { color: "#EFF6FF", fontSize: 22, fontWeight: "700" },
  profileSection: { gap: 12, marginTop: 28 },
  skillTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  portfolioItem: { backgroundColor: "#0C1929", padding: 16, gap: 6, borderRadius: 10, borderWidth: 1, borderColor: "#26394B" },
  portfolioTitle: { color: "#EFF6FF", fontSize: 16, fontWeight: "600", lineHeight: 24 },
  root: { flex: 1, minHeight: 0, backgroundColor: "#080E15" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  content: { padding: 26, paddingBottom: 30 },
  contentCompact: { padding: 16 },
  layout: {
    width: "100%",
    maxWidth: 1680,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  layoutCompact: { flexDirection: "column", gap: 20 },
  identity: {
    width: 286,
    flexShrink: 0,
    padding: 22,
    borderWidth: 1,
    borderColor: "#2A3C50",
    backgroundColor: "#0B131DEB",
    borderRadius: 8,
  },
  identityCompact: { width: "100%", padding: 20 },
  identityHero: { alignItems: "center", gap: 18 },
  heroCompact: { flexDirection: "row", alignItems: "flex-start", gap: 18 },
  identityHeading: { width: "100%", alignItems: "center", gap: 8 },
  headingCompact: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  eyebrow: {
    color: workspaceColors.blueSoft,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  name: {
    color: "#F0ECE5",
    fontFamily: serif,
    fontSize: 27,
    lineHeight: 34,
    textAlign: "center",
  },
  nameCompact: { fontSize: 24, lineHeight: 30, textAlign: "left" },
  profession: {
    color: workspaceColors.textSoft,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    flexShrink: 1,
  },
  editButton: { marginTop: 20, borderRadius: 6, borderColor: "#355875" },
  divider: {
    marginVertical: 22,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#293B4C" },
  dividerDiamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: "#8AA8BF",
    transform: [{ rotate: "45deg" }],
  },
  sectionLabel: {
    color: "#C8D4DF",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  identityRows: { gap: 15, marginTop: 17 },
  identityRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  identityLabel: { color: "#8AA5BF", width: 67, fontSize: 11, lineHeight: 18 },
  identityValue: {
    color: workspaceColors.textSoft,
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 18,
  },
  bio: { color: "#90A0B1", fontSize: 12, lineHeight: 20, marginTop: 12 },
  education: { flexDirection: "row", gap: 10, marginTop: 18 },
  educationTitle: {
    color: workspaceColors.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  muted: { color: workspaceColors.muted, fontSize: 12, lineHeight: 18 },
  main: { flex: 1, minWidth: 0, width: "100%", gap: 18 },
  mainHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  headingWrap: { flexGrow: 1, flexShrink: 1, gap: 5 },
  title: { color: "#F0ECE5", fontFamily: serif, fontSize: 33, lineHeight: 42 },
  titleCompact: { fontSize: 28, lineHeight: 36 },
  subtitle: { color: "#91A8BC", fontSize: 13, lineHeight: 20 },
  addButton: { borderRadius: 6, minHeight: 44 },
  overview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#233446",
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  statValue: { color: workspaceColors.text, fontSize: 18, fontWeight: "600" },
  statLabel: { color: "#8AA0B5", fontSize: 11, flexShrink: 1 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderColor: "#314256",
    paddingHorizontal: 11,
    paddingVertical: 10,
    justifyContent: "center",
  },
  filterActive: { borderColor: accent, backgroundColor: "#2388FF10" },
  filterText: { color: "#92A3B6", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  professionCard: {
    width: "48%",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 280,
    borderWidth: 1,
    borderColor: "#2A3C50",
    backgroundColor: "#0A131DEB",
    borderRadius: 8,
    overflow: "hidden",
  },
  cardSingle: { width: "100%", minWidth: 0 },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderColor: "#213142",
  },
  cardIcon: {
    width: 40,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#416383",
    borderRadius: 5,
    backgroundColor: "#102033",
  },
  cardHeading: { flex: 1, minWidth: 0, gap: 4 },
  cardTitle: {
    color: "#E8E5DE",
    fontFamily: serif,
    fontSize: 21,
    lineHeight: 26,
  },
  cardDescription: { color: "#8FA4B8", fontSize: 11, lineHeight: 17 },
  treeDiagram: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    minHeight: 182,
  },
  treeNode: {
    minWidth: 0,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 3,
    paddingVertical: 4,
  },
  diamond: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
  diamondInner: { transform: [{ rotate: "-45deg" }] },
  treeRoot: { flexDirection: "row", justifyContent: "center", gap: 16 },
  nodeCaption: { minWidth: 0, alignItems: "center", gap: 5 },
  nodeTitle: {
    color: "#DDE4EC",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    flexShrink: 1,
  },
  nodeSubtitle: { color: "#8FA4B8", fontSize: 12, lineHeight: 18 },
  nodeStatus: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  nodeStatusText: {
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  connector: { width: "100%", height: 24 },
  branches: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  branch: { flex: 1, minWidth: 0 },
  emptyTree: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: workspaceColors.muted,
    marginTop: 18,
  },
  skillSummary: {
    borderTopWidth: 1,
    borderColor: "#1F3040",
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0C1621",
  },
  skillSummaryLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  skillSummaryTitle: {
    color: "#B9C9D8",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  skillSummaryCount: { color: "#7892AA", fontSize: 11 },
  treeSectionHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#26394B",
  },
  treeSectionHint: {
    color: "#7F95AA",
    fontSize: 11,
    lineHeight: 17,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderColor: "#243649",
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  footerCount: { fontSize: 11, color: "#7892AA" },
  footerAction: { flexDirection: "row", alignItems: "center", gap: 9 },
  footerLabel: { color: workspaceColors.blueSoft, fontSize: 12 },
  pressed: { opacity: 0.72 },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingVertical: 5,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 5, height: 5, transform: [{ rotate: "45deg" }] },
  legendLabel: { color: "#7D92A7", fontSize: 11 },
  fullTreeRow: { flexDirection: "row", gap: 20, minHeight: 108 },
  fullTreeRail: { width: 62, alignItems: "center", justifyContent: "center" },
  fullTreeLine: {
    position: "absolute",
    width: 1,
    top: 0,
    bottom: 0,
    backgroundColor: "#425A70",
  },
  fullTreeContent: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#1D2A38",
  },
  detailContent: { gap: 16 },
  detailSymbol: { alignItems: "center", gap: 8, paddingBottom: 12 },
  detailText: { color: workspaceColors.textSoft, fontSize: 13, lineHeight: 20 },
  detailNote: { color: "#8FA3B8", fontSize: 12, lineHeight: 19 },
  detailsGrid: {
    gap: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A3C50",
    borderRadius: 7,
  },
  detailRow: { flexDirection: "row", gap: 12 },
  related: {
    gap: 9,
    borderTopWidth: 1,
    borderColor: "#2A3C50",
    paddingTop: 18,
  },
});
