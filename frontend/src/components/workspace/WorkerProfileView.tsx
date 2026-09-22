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
  return "BLOQUEADO";
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
  const compact = width < 820;

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
    certificate?: Certificate,
  ): AchievementNode => {
    const evidence = findEvidence(worker.documents, certificate);
    return {
      id,
      title,
      subtitle,
      icon,
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
    meta: isRodolfo ? ["Portugal", "Concluído em 2008"] : [],
  };

  const achievements: AchievementNode[] = [
    certificateNode(
      "ipaf",
      "IPAF 3A / 3B",
      "Plataformas elevatórias",
      "arrow-up-circle-outline",
      ipaf,
    ),
    certificateNode(
      "electrical",
      "Habilitação elétrica H0B0",
      "Segurança elétrica",
      "flash-outline",
      electrical,
    ),
    certificateNode(
      "heights",
      "Trabalho em altura",
      "body-outline",
      heights,
    ),
    {
      id: "atex",
      title: "ATEX",
      subtitle: "Atmosferas explosivas · comprovativo por associar",
      icon: "warning-outline",
      status: isRodolfo ? "pending" : "locked",
      meta: ["Indústria", "Ambiente ATEX"],
    },
    {
      id: "vca",
      title: "VCA",
      subtitle: "Segurança industrial · Benelux",
      icon: "shield-outline",
      status: "locked",
      meta: ["Países Baixos", "Bélgica", "Recomendado para indústria"],
    },
  ];

  const projectCount = worker.best_projects.length;
  const recordedCount = achievements.filter(
    (item) => item.status === "verified" || item.status === "recorded",
  ).length;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          compact ? styles.contentCompact : null,
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
              <HeroStat value={recordedCount} label="conquistas" />
              <HeroStat value={projectCount} label="obras destaque" />
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

        <View style={[styles.mainGrid, compact ? styles.mainGridCompact : null]}>
          <Card style={styles.profileCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>PERFIL</Text>
                <Text style={styles.sectionTitle}>Identidade profissional</Text>
              </View>
              <Ionicons name="finger-print-outline" size={24} color={accent} />
            </View>

            <Text style={styles.bio}>
              {isRodolfo
                ? "Técnico multidisciplinar com experiência em eletromecânica, refrigeração, eletricidade, montagem industrial e trabalho em obra internacional."
                : worker.bio}
            </Text>

            <View style={styles.timeline}>
              {isRodolfo ? (
                <>
                  <TimelineItem
                    year="2008"
                    title="Formação técnica"
                    detail="Eletromecânica · Refrigeração e Climatização"
                    accent={accent}
                  />
                  <TimelineItem
                    year="2024"
                    title="Daltile Quartz"
                    detail="Tennessee · Estados Unidos"
                    accent={accent}
                  />
                  <TimelineItem
                    year="2025"
                    title="Rennes Métropole"
                    detail="Rennes · França"
                    accent={accent}
                  />
                </>
              ) : (
                worker.best_projects.map((project) => (
                  <TimelineItem
                    key={project.id}
                    year={String(project.year)}
                    title={project.title}
                    detail={project.location}
                    accent={accent}
                  />
                ))
              )}
            </View>
          </Card>

          <Card style={styles.treeCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>CONQUISTAS</Text>
                <Text style={styles.sectionTitle}>Árvore profissional</Text>
                <Text style={styles.sectionSubtitle}>
                  Formação e certificações · toca num badge para ver o comprovativo
                </Text>
              </View>
              <View style={[styles.treeMark, { borderColor: accent + "66" }]}>
                <Ionicons name="git-network-outline" size={22} color={accent} />
              </View>
            </View>

            <View style={styles.tree}>
              <AchievementBadge
                node={courseNode}
                accent={accent}
                large
                onPress={() => setSelected(courseNode)}
              />
              <View style={[styles.verticalLine, { backgroundColor: accent + "44" }]} />
              <View style={styles.branchLineWrap}>
                <View style={[styles.branchLine, { backgroundColor: accent + "33" }]} />
              </View>

              <View style={styles.branchRow}>
                {achievements.slice(0, 3).map((node) => (
                  <AchievementBadge
                    key={node.id}
                    node={node}
                    accent={accent}
                    onPress={() => setSelected(node)}
                  />
                ))}
              </View>

              <View style={[styles.verticalLine, { backgroundColor: accent + "33" }]} />
              <View style={styles.branchRowCentered}>
                {achievements.slice(3).map((node) => (
                  <AchievementBadge
                    key={node.id}
                    node={node}
                    accent={accent}
                    onPress={() => setSelected(node)}
                  />
                ))}
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      <AchievementModal
        node={selected}
        accent={accent}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function TimelineItem({
  year,
  title,
  detail,
  accent,
}: {
  year: string;
  title: string;
  detail: string;
  accent: string;
}) {
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineNode, { borderColor: accent }]}>
        <View style={[styles.timelineNodeDot, { backgroundColor: accent }]} />
      </View>
      <View style={styles.timelineText}>
        <Text style={[styles.timelineYear, { color: accent }]}>{year}</Text>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineDetail}>{detail}</Text>
      </View>
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
});
