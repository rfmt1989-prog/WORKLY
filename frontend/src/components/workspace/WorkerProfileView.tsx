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
import type { LanguageCode } from "@/src/demo/types";
import {
  Avatar,
  Button,
  ModalPanel,
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
  const [filter, setFilter] = useState<string | null>(null);
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
  const visible = filter
    ? trees.filter((tree) => tree.id === filter)
    : trees.slice(0, 4);
  const expandedTree = trees.find((tree) => tree.id === expanded);
  const count = new Set(
    achievements.flatMap((node) =>
      node.certificate ? [node.certificate.id] : [],
    ),
  ).size;
  const displayProfession =
    worker.name.toLowerCase().includes("rodolfo maia") &&
    /^nacellista/i.test(worker.profession)
      ? "Técnico Eletromecânico · Refrigeração e Climatização"
      : worker.profession;

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
            <View style={styles.mainHeader}>
              <View style={styles.headingWrap}>
                <Text style={styles.eyebrow}>
                  {text(
                    "O teu percurso, organizado",
                    "Your professional journey",
                  )}
                </Text>
                <Text
                  style={[styles.title, oneColumn ? styles.titleCompact : null]}
                >
                  {text("Árvore de certificados", "Certificate trees")}
                </Text>
                <Text style={styles.subtitle}>
                  {text(
                    "Um percurso para cada profissão.",
                    "A separate journey for each profession.",
                  )}
                </Text>
              </View>
              <Button
                label={text("Adicionar certificado", "Add certificate")}
                icon="add-outline"
                onPress={() =>
                  setCertificateTarget({
                    professionId: filter || trees[0]?.id || "professional",
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
                label={text("profissões", "professions")}
                icon="git-branch-outline"
              />
              <OverviewStat
                value={worker.documents.filter((item) => item.file_id).length}
                label={text("comprovativos", "evidence files")}
                icon="document-attach-outline"
              />
            </View>
            <View style={styles.filters} accessibilityRole="tablist">
              <ProfessionFilter
                active={filter === null}
                label={text("Visão geral", "Overview")}
                onPress={() => setFilter(null)}
              />
              {trees.map((tree) => (
                <ProfessionFilter
                  key={tree.id}
                  active={filter === tree.id}
                  label={text(tree.title, tree.titleEn)}
                  onPress={() => setFilter(tree.id)}
                />
              ))}
            </View>
            <View style={styles.grid} testID="profession-trees">
              {visible.map((tree) => (
                <ProfessionCard
                  key={tree.id}
                  tree={tree}
                  language={language}
                  single={oneColumn || Boolean(filter)}
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
            {[expandedTree.root, ...expandedTree.nodes].map((node, index) => (
              <View key={node.id} style={styles.fullTreeRow}>
                <View style={styles.fullTreeRail}>
                  <View
                    style={[
                      styles.fullTreeLine,
                      index === 0 ? { top: "50%" } : null,
                      index === expandedTree.nodes.length
                        ? { bottom: "50%" }
                        : null,
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
            ))}
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
function ProfessionFilter({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filter,
        active ? styles.filterActive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.filterText,
          active ? { color: workspaceColors.blueSoft } : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
  const confirmed = tree.nodes.filter((node) =>
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
          {confirmed}/{tree.nodes.length}{" "}
          {uiText(language, "registados", "recorded")}
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
