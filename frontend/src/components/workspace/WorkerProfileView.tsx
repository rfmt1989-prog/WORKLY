import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { openWorklyFile } from "@/src/api/documentFiles";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { Certificate, DemoDocument } from "@/src/demo/types";

import {
  Avatar,
  Button,
  Card,
  ModalPanel,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type AchievementStatus = "verified" | "recorded" | "pending" | "locked";

type AchievementNode = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  status: AchievementStatus;
  level: number;
  certificate?: Certificate;
  evidence?: DemoDocument;
  meta?: string[];
};

const rodolfoAreas = [
  { label: "Eletromecânica", icon: "settings-outline" as const },
  { label: "Refrigeração / HVAC", icon: "snow-outline" as const },
  { label: "Eletricidade", icon: "flash-outline" as const },
  { label: "Montagem industrial", icon: "construct-outline" as const },
];

function findCertificate(certificates: Certificate[], needles: string[]) {
  return certificates.find((certificate) => {
    const value = certificate.name.toLowerCase();
    return needles.some((needle) => value.includes(needle.toLowerCase()));
  });
}

function findEvidence(
  documents: DemoDocument[],
  certificate?: Certificate,
): DemoDocument | undefined {
  if (!certificate) return undefined;
  const normalizedFile = certificate.file_name.toLowerCase();
  const normalizedName = certificate.name.toLowerCase();

  return documents.find((document) => {
    const fileMatch =
      Boolean(document.file_name) &&
      document.file_name.toLowerCase() === normalizedFile;
    const titleMatch = document.title.toLowerCase().includes(normalizedName);
    return fileMatch || titleMatch;
  });
}

function statusLabel(status: AchievementStatus) {
  if (status === "verified") return "VERIFICADO";
  if (status === "recorded") return "REGISTADO";
  if (status === "pending") return "A VALIDAR";
  return "POR CONQUISTAR";
}

function statusIcon(status: AchievementStatus) {
  if (status === "verified") return "shield-checkmark-outline" as const;
  if (status === "recorded") return "checkmark-circle-outline" as const;
  if (status === "pending") return "time-outline" as const;
  return "lock-closed-outline" as const;
}

export function WorkerProfileView() {
  const { user } = useAuth();
  const { state } = useWorklyData();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<AchievementNode | null>(null);

  const accent = roleAccent("worker");
  const compact = width < 900;
  const mobile = width < 680;

  const worker = useMemo(
    () => state?.workers.find((item) => item.id === user?.id),
    [state?.workers, user?.id],
  );

  if (!state || !user || !worker) return null;

  const isRodolfo = worker.name.toLowerCase().includes("rodolfo maia");
  const profession = isRodolfo
    ? "Técnico Eletromecânico · Refrigeração & Climatização"
    : worker.profession;

  const ipaf = findCertificate(worker.certificates, ["ipaf", "3a", "3b"]);
  const electrical = findCertificate(worker.certificates, ["h0b0", "habilitação elétrica"]);
  const heights = findCertificate(worker.certificates, ["altura", "heights"]);

  const certificateNode = (
    id: string,
    title: string,
    subtitle: string,
    icon: AchievementNode["icon"],
    level: number,
    certificate?: Certificate,
  ): AchievementNode => {
    const evidence = findEvidence(worker.documents, certificate);
    return {
      id,
      title,
      subtitle,
      icon,
      level,
      certificate,
      evidence,
      status: evidence?.file_id ? "verified" : certificate ? "recorded" : "pending",
    };
  };

  const courseNode: AchievementNode = {
    id: "course",
    title: isRodolfo
      ? "Técnico Eletromecânico de Refrigeração e Climatização IV"
      : "Formação técnica base",
    subtitle: isRodolfo ? "Formação profissional · 2008" : "Ponto de partida profissional",
    icon: "school-outline",
    status: "pending",
    level: 0,
    meta: isRodolfo ? ["Portugal", "Concluído em 2008"] : [],
  };

  const achievements: AchievementNode[] = [
    certificateNode("ipaf", "IPAF 3A / 3B", "Plataformas elevatórias", "arrow-up-circle-outline", 1, ipaf),
    certificateNode("electrical", "H0B0", "Habilitação elétrica", "flash-outline", 1, electrical),
    certificateNode("heights", "Trabalho em altura", "Proteção e arnês", "body-outline", 1, heights),
    { id: "vca", title: "VCA", subtitle: "Basic Safety", icon: "shield-outline", status: "locked", level: 2, meta: ["Benelux", "Indústria"] },
    { id: "scc", title: "SCC", subtitle: "Safety Contractor", icon: "shield-checkmark-outline", status: "locked", level: 2, meta: ["Alemanha", "Áustria"] },
    { id: "france-chimie", title: "France Chimie N1", subtitle: "Acesso industrial", icon: "flask-outline", status: "locked", level: 2, meta: ["França", "Indústria química"] },
    { id: "sst", title: "SST / First Aid", subtitle: "Primeiros socorros", icon: "medkit-outline", status: "locked", level: 2, meta: ["Segurança"] },
    { id: "atex", title: "ATEX", subtitle: "Atmosferas explosivas", icon: "warning-outline", status: isRodolfo ? "pending" : "locked", level: 3, meta: ["Indústria", "Comprovativo por associar"] },
    { id: "confined", title: "Espaços confinados", subtitle: "Acesso e resgate", icon: "contract-outline", status: "locked", level: 3, meta: ["Manutenção industrial"] },
    { id: "rigging", title: "Rigging / Lifting", subtitle: "Elevação de cargas", icon: "git-compare-outline", status: "locked", level: 3, meta: ["Montagem industrial"] },
    { id: "electrical-advanced", title: "Elétrica avançada", subtitle: "BR / B2V ou equivalente", icon: "flash-outline", status: "locked", level: 3, meta: ["Eletricidade industrial"] },
    { id: "fgas", title: "F-Gas A1 / A2", subtitle: "Fluidos frigorigéneos", icon: "snow-outline", status: "locked", level: 4, meta: ["HVAC", "Refrigeração"] },
    { id: "natural-refrigerants", title: "Refrigerantes naturais", subtitle: "CO₂ · NH₃ · hidrocarbonetos", icon: "leaf-outline", status: "locked", level: 4, meta: ["HVAC industrial"] },
    { id: "r484", title: "Ponte rolante", subtitle: "R484 / equivalente", icon: "git-network-outline", status: "locked", level: 4, meta: ["Movimentação de cargas"] },
    { id: "r489", title: "Empilhador", subtitle: "R489 / equivalente", icon: "cube-outline", status: "locked", level: 4, meta: ["Logística industrial"] },
    { id: "atex-n2", title: "ATEX Supervisor", subtitle: "Nível avançado / responsável", icon: "warning-outline", status: "locked", level: 5, meta: ["Supervisão industrial"] },
    { id: "vol-vca", title: "VOL-VCA / SCC Supervisor", subtitle: "Liderança de segurança", icon: "shield-checkmark-outline", status: "locked", level: 5, meta: ["Supervisão"] },
    { id: "iecex", title: "IECEx CoPC", subtitle: "Competência Ex avançada", icon: "diamond-outline", status: "locked", level: 5, meta: ["Internacional", "Atmosferas explosivas"] },
  ];

  const totalCertificates = achievements.length;
  const obtainedCount = achievements.filter(
    (item) => item.status === "verified" || item.status === "recorded" || item.status === "pending",
  ).length;
  const documentedCount = achievements.filter(
    (item) => item.status === "verified" || item.status === "recorded",
  ).length;
  const pendingCount = achievements.filter((item) => item.status === "pending").length;
  const levelOneComplete = achievements
    .filter((item) => item.level === 1)
    .every((item) => item.status !== "locked");
  const currentLevel = levelOneComplete ? 2 : 1;
  const levelName = currentLevel === 2 ? "Operacional" : "Principiante";
  const levelGroups = [
    { level: 1, name: "Principiante", note: "Base para trabalhar com segurança" },
    { level: 2, name: "Operacional", note: "Acesso a ambientes industriais europeus" },
    { level: 3, name: "Industrial", note: "Competências de risco e manutenção" },
    { level: 4, name: "Especialista", note: "Certificações técnicas avançadas" },
    { level: 5, name: "Master", note: "Supervisão e competência internacional" },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          compact ? styles.contentCompact : null,
          mobile ? styles.contentMobile : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { borderColor: accent + "55" }]}>
          <View style={[styles.heroGlow, { backgroundColor: accent + "18" }]} />
          <View style={[styles.heroGrid, compact ? styles.heroGridCompact : null]}>
            <View style={styles.identityBlock}>
              <Avatar
                name={worker.name}
                flag={worker.flag}
                size={compact ? 78 : 98}
                accent={accent}
              />
              <View style={styles.identityText}>
                <View style={styles.eyebrowRow}>
                  <Text style={[styles.eyebrow, { color: accent }]}>
                    WORKLY PROFESSIONAL ID
                  </Text>
                  <View style={[styles.liveDot, { backgroundColor: accent }]} />
                </View>
                <Text style={styles.name}>{worker.name}</Text>
                <Text style={styles.profession}>{profession}</Text>
                <Text style={styles.location}>
                  {worker.flag} {worker.country} · {worker.location}
                </Text>
              </View>
            </View>

            <View style={styles.heroStats}>
              <HeroStat value={worker.experience_years} label="anos" />
              <HeroStat value={String(obtainedCount) + "/" + String(totalCertificates)} label="certificados" />
              <HeroStat value={"N" + String(currentLevel)} label={levelName} />
              <HeroStat value={isRodolfo ? 3 : 1} label="países" />
            </View>
          </View>

          <View style={styles.areaRow}>
            {(isRodolfo ? rodolfoAreas : [{ label: worker.profession, icon: "construct-outline" as const }]).map(
              (area, index) => (
                <View
                  key={area.label}
                  style={[
                    styles.areaChip,
                    index === 0
                      ? {
                          borderColor: accent + "66",
                          backgroundColor: accent + "12",
                        }
                      : null,
                  ]}
                >
                  <Ionicons
                    name={area.icon}
                    size={16}
                    color={index === 0 ? accent : workspaceColors.muted}
                  />
                  <Text
                    style={[
                      styles.areaText,
                      index === 0 ? { color: workspaceColors.text } : null,
                    ]}
                  >
                    {area.label}
                  </Text>
                  {index === 0 ? (
                    <Text style={[styles.primaryLabel, { color: accent }]}>
                      PRINCIPAL
                    </Text>
                  ) : null}
                </View>
              ),
            )}
          </View>
        </View>

        <Card style={styles.treeCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>CONQUISTAS</Text>
              <Text style={styles.sectionTitle}>Árvore de certificações</Text>
              <Text style={styles.sectionSubtitle}>
                Do curso técnico ao nível Master
              </Text>
            </View>
            <View style={[styles.treeMark, { borderColor: accent + "66" }]}>
              <Ionicons name="git-network-outline" size={22} color={accent} />
            </View>
          </View>

          <View style={styles.certificateProgress}>
            <View>
              <Text style={styles.progressValue}>{obtainedCount}/{totalCertificates}</Text>
              <Text style={styles.progressLabel}>CERTIFICADOS / CONQUISTAS</Text>
            </View>
            <View style={styles.progressRight}>
              <Text style={[styles.currentLevel, { color: accent }]}>NÍVEL {currentLevel}</Text>
              <Text style={styles.currentLevelName}>{levelName}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: String(Math.round((obtainedCount / totalCertificates) * 100)) + "%",
                  backgroundColor: accent,
                },
              ]}
            />
          </View>
          <Text style={styles.progressMeta}>
            {documentedCount} registados · {pendingCount} a validar · {totalCertificates - obtainedCount} por conquistar
          </Text>

          <View style={styles.tree}>
            <Text style={styles.levelKicker}>FORMAÇÃO · PONTO DE PARTIDA</Text>
            <AchievementBadge
              node={courseNode}
              accent={accent}
              large
              onPress={() => setSelected(courseNode)}
            />
            <View style={[styles.verticalLine, { backgroundColor: accent + "44" }]} />

            {levelGroups.map((group, index) => {
              const nodes = achievements.filter((item) => item.level === group.level);
              const complete = nodes.filter((item) => item.status !== "locked").length;
              return (
                <View key={group.level} style={styles.levelSection}>
                  <View style={styles.levelHeader}>
                    <View
                      style={[
                        styles.levelNumber,
                        {
                          borderColor: group.level <= currentLevel ? accent + "88" : workspaceColors.lineStrong,
                          backgroundColor: group.level <= currentLevel ? accent + "18" : workspaceColors.panelStrong,
                        },
                      ]}
                    >
                      <Text style={[styles.levelNumberText, group.level <= currentLevel ? { color: accent } : null]}>
                        {group.level}
                      </Text>
                    </View>
                    <View style={styles.levelHeaderText}>
                      <Text style={styles.levelTitle}>{group.name}</Text>
                      <Text style={styles.levelNote}>{group.note}</Text>
                    </View>
                    <Text style={styles.levelCount}>{complete}/{nodes.length}</Text>
                  </View>

                  <View style={[styles.levelBadges, mobile ? styles.levelBadgesMobile : null]}>
                    {nodes.map((node) => (
                      <AchievementBadge
                        key={node.id}
                        node={node}
                        accent={accent}
                        onPress={() => setSelected(node)}
                      />
                    ))}
                  </View>

                  {index < levelGroups.length - 1 ? (
                    <View style={[styles.levelConnector, { backgroundColor: accent + "35" }]} />
                  ) : null}
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      <AchievementModal
        node={selected}
        accent={accent}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function HeroStat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function AchievementBadge({
  node,
  accent,
  large = false,
  onPress,
}: {
  node: AchievementNode;
  accent: string;
  large?: boolean;
  onPress: () => void;
}) {
  const active = node.status === "verified" || node.status === "recorded";
  const pending = node.status === "pending";
  const tone = active
    ? accent
    : pending
      ? workspaceColors.yellow
      : workspaceColors.muted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={node.title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.badgeWrap,
        large ? styles.badgeWrapLarge : null,
        pressed ? { opacity: 0.72, transform: [{ scale: 0.98 }] } : null,
      ]}
    >
      <View
        style={[
          styles.badgeOuter,
          large ? styles.badgeOuterLarge : null,
          {
            borderColor: tone + (active ? "99" : "55"),
            backgroundColor: tone + (active ? "16" : "0B"),
          },
        ]}
      >
        <View
          style={[
            styles.badgeInner,
            large ? styles.badgeInnerLarge : null,
            { borderColor: tone + "55" },
          ]}
        >
          <Ionicons
            name={node.status === "locked" ? "lock-closed-outline" : node.icon}
            size={large ? 31 : 25}
            color={tone}
          />
        </View>
      </View>
      <Text style={[styles.badgeTitle, large ? styles.badgeTitleLarge : null]}>
        {node.title}
      </Text>
      <View style={styles.badgeStatusRow}>
        <Ionicons name={statusIcon(node.status)} size={11} color={tone} />
        <Text style={[styles.badgeStatus, { color: tone }]}>
          {statusLabel(node.status)}
        </Text>
      </View>
    </Pressable>
  );
}

function AchievementModal({
  node,
  accent,
  onClose,
}: {
  node: AchievementNode | null;
  accent: string;
  onClose: () => void;
}) {
  if (!node) return null;

  const evidence = node.evidence;
  const certificate = node.certificate;
  const canOpenFile = Boolean(evidence?.file_id);

  return (
    <ModalPanel
      visible
      onClose={onClose}
      title={node.title}
      subtitle={node.subtitle}
      footer={
        <>
          {canOpenFile ? (
            <Button
              label="Abrir comprovativo"
              icon="open-outline"
              accent={accent}
              onPress={() => void openWorklyFile(evidence!.file_id!)}
            />
          ) : null}
          <Button label="Fechar" variant="secondary" onPress={onClose} />
        </>
      }
    >
      <View style={styles.modalContent}>
        <View style={[styles.modalBadge, { borderColor: accent + "66" }]}>
          <Ionicons name={node.icon} size={36} color={accent} />
        </View>

        <View style={styles.modalStatus}>
          <Ionicons
            name={statusIcon(node.status)}
            size={16}
            color={
              node.status === "locked"
                ? workspaceColors.muted
                : node.status === "pending"
                  ? workspaceColors.yellow
                  : accent
            }
          />
          <Text style={styles.modalStatusText}>{statusLabel(node.status)}</Text>
        </View>

        {certificate ? (
          <View style={styles.metaGrid}>
            <Meta label="Entidade" value={certificate.issuer} />
            <Meta label="Emissão" value={certificate.issued_at} />
            <Meta label="Validade" value={certificate.expires_at} />
            <Meta label="Ficheiro" value={certificate.file_name} />
          </View>
        ) : null}

        {node.meta?.length ? (
          <View style={styles.metaPills}>
            {node.meta.map((item) => (
              <View key={item} style={styles.metaPill}>
                <Text style={styles.metaPillText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View
          style={[
            styles.evidenceBox,
            {
              borderColor: canOpenFile
                ? workspaceColors.green + "55"
                : workspaceColors.yellow + "44",
            },
          ]}
        >
          <Ionicons
            name={canOpenFile ? "document-attach-outline" : "document-outline"}
            size={22}
            color={canOpenFile ? workspaceColors.green : workspaceColors.yellow}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.evidenceTitle}>
              {canOpenFile ? "Comprovativo associado" : "Comprovativo por associar"}
            </Text>
            <Text style={styles.evidenceText}>
              {canOpenFile
                ? "Este badge está ligado ao documento guardado na WORKLY."
                : "O badge fica registado, mas só passa a verificado quando o documento real for associado."}
            </Text>
          </View>
        </View>
      </View>
    </ModalPanel>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={sharedStyles.label}>{label}</Text>
      <Text style={styles.metaValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    backgroundColor: workspaceColors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 1460,
    alignSelf: "center",
    padding: 22,
    paddingBottom: 38,
    gap: 14,
  },
  contentCompact: {
    padding: 12,
    paddingBottom: 86,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    backgroundColor: workspaceColors.panelSoft,
  },
  heroGlow: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    right: -130,
    top: -280,
  },
  heroGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  heroGridCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  identityBlock: {
    flex: 1,
    minWidth: 260,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  name: {
    marginTop: 4,
    color: workspaceColors.text,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  profession: {
    marginTop: 3,
    color: workspaceColors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  location: {
    marginTop: 4,
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  heroStat: {
    minWidth: 82,
    minHeight: 62,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 14,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatValue: {
    color: workspaceColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  heroStatLabel: {
    marginTop: 2,
    color: workspaceColors.muted,
    fontSize: 8,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  areaRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: workspaceColors.line,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  areaChip: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panel,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  areaText: {
    color: workspaceColors.textSoft,
    fontSize: 10,
    fontWeight: "700",
  },
  primaryLabel: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  mainGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  mainGridCompact: {
    flexDirection: "column",
  },
  profileCard: {
    flex: 0.86,
    minWidth: 0,
  },
  treeCard: {
    flex: 1.35,
    minWidth: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionEyebrow: {
    color: workspaceColors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  sectionTitle: {
    marginTop: 2,
    color: workspaceColors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  sectionSubtitle: {
    marginTop: 3,
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 14,
  },
  treeMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  bio: {
    marginTop: 15,
    color: workspaceColors.textSoft,
    fontSize: 12,
    lineHeight: 19,
  },
  timeline: {
    marginTop: 18,
    gap: 0,
  },
  timelineItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timelineNode: {
    marginTop: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineNodeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  timelineText: {
    flex: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: workspaceColors.line,
  },
  timelineYear: {
    fontSize: 8,
    fontWeight: "900",
  },
  timelineTitle: {
    marginTop: 2,
    color: workspaceColors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  timelineDetail: {
    marginTop: 2,
    color: workspaceColors.muted,
    fontSize: 9,
  },
  tree: {
    marginTop: 16,
    alignItems: "center",
  },
  verticalLine: {
    width: 1,
    height: 24,
  },
  branchLineWrap: {
    width: "68%",
    alignItems: "center",
  },
  branchLine: {
    width: "100%",
    height: 1,
  },
  branchRow: {
    width: "100%",
    marginTop: -1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    gap: 7,
  },
  branchRowCentered: {
    width: "72%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    gap: 12,
  },
  badgeWrap: {
    flex: 1,
    minWidth: 90,
    maxWidth: 150,
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  badgeWrapLarge: {
    flex: 0,
    minWidth: 210,
    maxWidth: 250,
  },
  badgeOuter: {
    width: 66,
    height: 66,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeOuterLarge: {
    width: 82,
    height: 82,
    borderRadius: 26,
  },
  badgeInner: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: workspaceColors.backgroundElevated,
  },
  badgeInnerLarge: {
    width: 62,
    height: 62,
    borderRadius: 21,
  },
  badgeTitle: {
    marginTop: 7,
    color: workspaceColors.textSoft,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  badgeTitleLarge: {
    color: workspaceColors.text,
    fontSize: 10,
  },
  badgeStatusRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  badgeStatus: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  modalContent: {
    alignItems: "center",
    gap: 13,
    paddingVertical: 10,
  },
  modalBadge: {
    width: 82,
    height: 82,
    borderRadius: 25,
    borderWidth: 1.5,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  modalStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalStatusText: {
    color: workspaceColors.textSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  metaGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: {
    flexGrow: 1,
    flexBasis: 180,
    minWidth: 160,
    padding: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 11,
    backgroundColor: workspaceColors.panelSoft,
  },
  metaValue: {
    marginTop: 3,
    color: workspaceColors.textSoft,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  metaPills: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  metaPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  metaPillText: {
    color: workspaceColors.textSoft,
    fontSize: 9,
    fontWeight: "700",
  },
  evidenceBox: {
    width: "100%",
    marginTop: 4,
    padding: 12,
    borderWidth: 1,
    borderRadius: 13,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  evidenceTitle: {
    color: workspaceColors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  evidenceText: {
    marginTop: 3,
    color: workspaceColors.muted,
    fontSize: 9,
    lineHeight: 14,
  },
  contentMobile: {
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 10,
  },
  certificateProgress: {
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 14,
    backgroundColor: workspaceColors.panelStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressValue: {
    color: workspaceColors.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
  },
  progressLabel: {
    marginTop: 2,
    color: workspaceColors.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  progressRight: {
    alignItems: "flex-end",
  },
  currentLevel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  currentLevelName: {
    marginTop: 2,
    color: workspaceColors.textSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  progressTrack: {
    marginTop: 9,
    height: 5,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: workspaceColors.line,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressMeta: {
    marginTop: 6,
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 12,
  },
  levelKicker: {
    marginBottom: 8,
    color: workspaceColors.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },
  levelSection: {
    width: "100%",
    alignItems: "stretch",
  },
  levelHeader: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: workspaceColors.line,
    paddingTop: 9,
  },
  levelNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumberText: {
    color: workspaceColors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  levelHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  levelTitle: {
    color: workspaceColors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  levelNote: {
    marginTop: 1,
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 11,
  },
  levelCount: {
    color: workspaceColors.textSoft,
    fontSize: 10,
    fontWeight: "900",
  },
  levelBadges: {
    width: "100%",
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  levelBadgesMobile: {
    justifyContent: "space-between",
  },
  levelConnector: {
    alignSelf: "center",
    width: 1,
    height: 24,
    marginVertical: 5,
  },
});
