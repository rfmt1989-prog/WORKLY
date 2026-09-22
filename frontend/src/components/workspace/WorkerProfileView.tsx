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
  family: string;
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
    family: string,
    certificate?: Certificate,
  ): AchievementNode => {
    const evidence = findEvidence(worker.documents, certificate);
    return {
      id,
      title,
      subtitle,
      icon,
      level,
      family,
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
    family: "technical-foundation",
    meta: isRodolfo ? ["Portugal", "Concluído em 2008"] : [],
  };

  const achievements: AchievementNode[] = [
    certificateNode(
      "ipaf",
      "IPAF 3A / 3B",
      "Categorias de plataformas elevatórias",
      "arrow-up-circle-outline",
      1,
      "powered-access",
      ipaf,
    ),
    certificateNode(
      "electrical",
      "H0 / B0",
      "Acesso em ambiente elétrico · operações não elétricas",
      "flash-outline",
      1,
      "electrical-access",
      electrical,
    ),
    certificateNode(
      "heights",
      "Trabalho em altura",
      "Proteção, arnês e prevenção de queda",
      "body-outline",
      1,
      "work-at-height",
      heights,
    ),

    {
      id: "france-chimie-n1", family: "industrial-safety-passport",
      title: "France Chimie N1",
      subtitle: "Operador em site industrial",
      icon: "flask-outline",
      status: "locked",
      level: 2,
      meta: ["França · âmbito nacional", "Segurança industrial"],
    },
    {
      id: "b-vca", family: "industrial-safety-passport",
      title: "B-VCA",
      subtitle: "Basisveiligheid VCA",
      icon: "shield-outline",
      status: "locked",
      level: 2,
      meta: ["Benelux · âmbito setorial", "Segurança industrial"],
    },
    {
      id: "scc-018", family: "industrial-safety-passport",
      title: "SCC 018",
      subtitle: "Operativ tätige Mitarbeiter",
      icon: "shield-checkmark-outline",
      status: "locked",
      level: 2,
      meta: ["Alemanha · âmbito setorial", "Operador"],
    },
    {
      id: "sst", family: "first-aid",
      title: "SST / First Aid",
      subtitle: "Primeiros socorros",
      icon: "medkit-outline",
      status: "locked",
      level: 2,
      meta: ["Segurança"],
    },

    {
      id: "atex-n1", family: "atex-execution",
      title: "Ism-ATEX N1",
      subtitle: "1E / 1M · agente de execução",
      icon: "warning-outline",
      status: isRodolfo ? "pending" : "locked",
      level: 3,
      meta: ["ATEX", "Execução", "Comprovativo por associar"],
    },
    {
      id: "confined", family: "confined-spaces",
      title: "Espaços confinados",
      subtitle: "Acesso, vigilância e resgate",
      icon: "contract-outline",
      status: "locked",
      level: 3,
      meta: ["Manutenção industrial"],
    },
    {
      id: "rigging", family: "lifting-rigging",
      title: "Rigging / Lifting",
      subtitle: "Elevação e orientação de cargas",
      icon: "git-compare-outline",
      status: "locked",
      level: 3,
      meta: ["Montagem industrial"],
    },
    {
      id: "electrical-execution", family: "electrical-execution",
      title: "B1 / B1V / BR",
      subtitle: "Execução e intervenção elétrica",
      icon: "flash-outline",
      status: "locked",
      level: 3,
      meta: ["França · âmbito nacional", "Função elétrica"],
    },
    {
      id: "fgas-a2", family: "fgas-core",
      title: "F-Gas A2",
      subtitle: "F-gases e hidrocarbonetos · carga limitada",
      icon: "snow-outline",
      status: "locked",
      level: 3,
      meta: ["UE", "HVAC / Refrigeração"],
    },

    {
      id: "france-chimie-n2", family: "industrial-safety-supervisor",
      title: "France Chimie N2",
      subtitle: "Encadramento e liderança de intervenção",
      icon: "flask-outline",
      status: "locked",
      level: 4,
      meta: ["França · âmbito nacional", "Responsável"],
    },
    {
      id: "vol-vca", family: "industrial-safety-supervisor",
      title: "VOL-VCA",
      subtitle: "Segurança para responsáveis operacionais",
      icon: "shield-checkmark-outline",
      status: "locked",
      level: 4,
      meta: ["Benelux · âmbito setorial", "Responsável"],
    },
    {
      id: "scc-017", family: "industrial-safety-supervisor",
      title: "SCC 017",
      subtitle: "Operativ tätige Führungskräfte",
      icon: "shield-checkmark-outline",
      status: "locked",
      level: 4,
      meta: ["Alemanha · âmbito setorial", "Responsável"],
    },
    {
      id: "atex-n2", family: "atex-supervisor",
      title: "Ism-ATEX N2",
      subtitle: "2E / 2M · pessoa autorizada",
      icon: "warning-outline",
      status: "locked",
      level: 4,
      meta: ["ATEX", "Responsabilidade"],
    },
    {
      id: "electrical-responsibility", family: "electrical-responsibility",
      title: "B2 / B2V / BC",
      subtitle: "Chefia de trabalhos / consignação",
      icon: "flash-outline",
      status: "locked",
      level: 4,
      meta: ["França · âmbito nacional", "Função elétrica"],
    },
    {
      id: "fgas-a1", family: "fgas-advanced",
      title: "F-Gas A1",
      subtitle: "Âmbito completo F-gases e hidrocarbonetos",
      icon: "snow-outline",
      status: "locked",
      level: 4,
      meta: ["UE", "HVAC / Refrigeração"],
    },

    {
      id: "iecex", family: "explosive-atmospheres-advanced",
      title: "IECEx CoPC",
      subtitle: "Competência internacional em atmosferas Ex",
      icon: "diamond-outline",
      status: "locked",
      level: 5,
      meta: ["Internacional", "Especialização Ex"],
    },
    {
      id: "fgas-b", family: "co2-specialist",
      title: "Certificado B · CO₂",
      subtitle: "Especialização em dióxido de carbono",
      icon: "snow-outline",
      status: "locked",
      level: 5,
      meta: ["UE", "Refrigerante natural"],
    },
    {
      id: "fgas-c", family: "nh3-specialist",
      title: "Certificado C · NH₃",
      subtitle: "Especialização em amoníaco",
      icon: "snow-outline",
      status: "locked",
      level: 5,
      meta: ["UE", "Refrigerante natural"],
    },
  ];

  const totalCertificates = achievements.length;
  const obtainedCount = achievements.filter(
    (item) =>
      item.status === "verified" ||
      item.status === "recorded" ||
      item.status === "pending",
  ).length;
  const documentedCount = achievements.filter(
    (item) => item.status === "verified" || item.status === "recorded",
  ).length;
  const pendingCount = achievements.filter((item) => item.status === "pending").length;

  const beginnerComplete = achievements
    .filter((item) => item.level === 1)
    .every((item) => item.status !== "locked");
  const currentStage = beginnerComplete ? 2 : 1;
  const stageName = currentStage === 2 ? "Operador Qualificado" : "Principiante";
  const stageShort = currentStage === 2 ? "Operador" : "Principiante";

  const certificationFamilies = Array.from(
    new Set(achievements.map((item) => item.family)),
  );
  const completedFamilies = certificationFamilies.filter((family) =>
    achievements.some(
      (item) =>
        item.family === family &&
        (item.status === "verified" ||
          item.status === "recorded" ||
          item.status === "pending"),
    ),
  );

  const levelGroups = [
    {
      level: 1,
      code: "P",
      name: "Principiante",
      note: "Base prática após a formação técnica",
    },
    {
      level: 2,
      code: "O",
      name: "Operador Qualificado",
      note: "Segurança e acesso industrial no mercado europeu",
    },
    {
      level: 3,
      code: "I",
      name: "Técnico Industrial",
      note: "Execução técnica, risco e manutenção industrial",
    },
    {
      level: 4,
      code: "R",
      name: "Responsável Técnico",
      note: "Certificações de responsabilidade, supervisão e maior âmbito",
    },
    {
      level: 5,
      code: "M",
      name: "Master WORKLY",
      note: "Especializações avançadas relevantes à profissão",
    },
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
              <HeroStat value={stageShort} label="etapa" />
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
                Da formação técnica ao Master WORKLY
              </Text>
            </View>
            <View style={[styles.treeMark, { borderColor: accent + "66" }]}>
              <Ionicons name="git-network-outline" size={22} color={accent} />
            </View>
          </View>

          <View style={styles.certificateProgress}>
            <View>
              <Text style={styles.progressValue}>{obtainedCount}/{totalCertificates}</Text>
              <Text style={styles.progressLabel}>CERTIFICADOS NO CATÁLOGO EUROPEU</Text>
            </View>
            <View style={styles.progressRight}>
              <Text style={[styles.currentLevel, { color: accent }]}>ETAPA ATUAL</Text>
              <Text style={styles.currentLevelName}>{stageName}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: (String(Math.round((obtainedCount / totalCertificates) * 100)) + "%") as `${number}%`,
                  backgroundColor: accent,
                },
              ]}
            />
          </View>
          <Text style={styles.progressMeta}>
            {documentedCount} registados · {pendingCount} a validar · {totalCertificates - obtainedCount} disponíveis no mapa\n          </Text>\n          <Text style={styles.progressMeta}>\n            {completedFamilies.length}/{certificationFamilies.length} famílias profissionais cobertas · equivalentes nacionais não são obrigatórios em duplicado\n          </Text>

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
              const families = Array.from(new Set(nodes.map((item) => item.family)));
              const complete = families.filter((family) =>
                nodes.some(
                  (item) =>
                    item.family === family &&
                    (item.status === "verified" ||
                      item.status === "recorded" ||
                      item.status === "pending"),
                ),
              ).length;
              return (
                <View key={group.level} style={styles.levelSection}>
                  <View style={styles.levelHeader}>
                    <View
                      style={[
                        styles.levelNumber,
                        {
                          borderColor: group.level <= currentStage ? accent + "88" : workspaceColors.lineStrong,
                          backgroundColor: group.level <= currentStage ? accent + "18" : workspaceColors.panelStrong,
                        },
                      ]}
                    >
                      <Text style={[styles.levelNumberText, group.level <= currentStage ? { color: accent } : null]}>
                        {group.level}
                      </Text>
                    </View>
                    <View style={styles.levelHeaderText}>
                      <Text style={styles.levelTitle}>{group.name}</Text>
                      <Text style={styles.levelNote}>{group.note}</Text>
                    </View>
                    <Text style={styles.levelCount}>{complete}/{families.length}</Text>
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
