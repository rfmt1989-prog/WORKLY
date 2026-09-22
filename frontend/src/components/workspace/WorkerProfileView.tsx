import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { openWorklyFile } from "@/src/api/documentFiles";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { Certificate, DemoDocument } from "@/src/demo/types";

import {
  Avatar,
  Button,
  ModalPanel,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type AchievementStatus =
  | "verified"
  | "recorded"
  | "pending"
  | "available"
  | "locked";

type StageKey =
  | "foundation"
  | "base"
  | "industrial-access"
  | "technical"
  | "responsibility"
  | "master";

type AchievementNode = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  status: AchievementStatus;
  stage: StageKey;
  family: string;
  scope: string;
  dependsOn?: string[];
  certificate?: Certificate;
  evidence?: DemoDocument;
  meta?: string[];
};

type NodeSpec = Omit<AchievementNode, "status"> & {
  baseStatus: Exclude<AchievementStatus, "locked">;
};

type StageDefinition = {
  key: StageKey;
  title: string;
  subtitle: string;
};

const STAGES: StageDefinition[] = [
  {
    key: "foundation",
    title: "Formação",
    subtitle: "Ponto de partida profissional",
  },
  {
    key: "base",
    title: "Base profissional",
    subtitle: "Segurança e acesso essenciais",
  },
  {
    key: "industrial-access",
    title: "Acesso industrial",
    subtitle: "Passaportes e segurança de fábrica",
  },
  {
    key: "technical",
    title: "Técnico industrial",
    subtitle: "Execução técnica e ambientes de risco",
  },
  {
    key: "responsibility",
    title: "Responsável técnico",
    subtitle: "Supervisão, liderança e maior âmbito",
  },
  {
    key: "master",
    title: "Master WORKLY",
    subtitle: "Especializações avançadas e reconhecimento profissional",
  },
];

const rodolfoAreas = [
  { label: "Eletromecânica", icon: "settings-outline" as const },
  { label: "HVAC", icon: "snow-outline" as const },
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

function isCompleted(status: AchievementStatus) {
  return status === "verified" || status === "recorded";
}

function statusLabel(status: AchievementStatus) {
  if (status === "verified") return "VERIFICADO";
  if (status === "recorded") return "REGISTADO";
  if (status === "pending") return "A VALIDAR";
  if (status === "available") return "DISPONÍVEL";
  return "BLOQUEADO";
}

function statusIcon(status: AchievementStatus) {
  if (status === "verified") return "shield-checkmark-outline" as const;
  if (status === "recorded") return "checkmark-circle-outline" as const;
  if (status === "pending") return "time-outline" as const;
  if (status === "available") return "add-circle-outline" as const;
  return "lock-closed-outline" as const;
}

function statusTone(status: AchievementStatus, accent: string) {
  if (status === "verified" || status === "recorded") return accent;
  if (status === "pending") return workspaceColors.yellow;
  if (status === "available") return workspaceColors.textSoft;
  return workspaceColors.muted;
}

function resolveStatuses(specs: NodeSpec[]): AchievementNode[] {
  const resolved = new Map<string, AchievementNode>();

  for (const spec of specs) {
    const directEvidence =
      spec.baseStatus === "verified" ||
      spec.baseStatus === "recorded" ||
      spec.baseStatus === "pending";

    const prerequisitesMet = (spec.dependsOn ?? []).every((id) => {
      const parent = resolved.get(id);
      return parent ? isCompleted(parent.status) : false;
    });

    const status: AchievementStatus =
      directEvidence || !spec.dependsOn?.length || prerequisitesMet
        ? spec.baseStatus
        : "locked";

    resolved.set(spec.id, {
      ...spec,
      status,
    });
  }

  return Array.from(resolved.values());
}

export function WorkerProfileView() {
  const { user } = useAuth();
  const { state } = useWorklyData();
  const [selected, setSelected] = useState<AchievementNode | null>(null);

  const accent = roleAccent("worker");

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
  const electrical = findCertificate(worker.certificates, [
    "h0b0",
    "h0 / b0",
    "habilitação elétrica",
  ]);
  const heights = findCertificate(worker.certificates, ["altura", "heights"]);

  const nodeFromCertificate = (
    spec: Omit<NodeSpec, "baseStatus" | "certificate" | "evidence">,
    certificate?: Certificate,
  ): NodeSpec => {
    const evidence = findEvidence(worker.documents, certificate);

    return {
      ...spec,
      certificate,
      evidence,
      baseStatus: evidence?.file_id
        ? "verified"
        : certificate
          ? "recorded"
          : "available",
    };
  };

  const specs: NodeSpec[] = [
    {
      id: "course",
      title: isRodolfo
        ? "Técnico Eletromecânico de Refrigeração e Climatização IV"
        : "Formação técnica",
      subtitle: isRodolfo ? "Concluído em 2008" : "Formação profissional",
      icon: "school-outline",
      stage: "foundation",
      family: "technical-foundation",
      scope: "Formação profissional",
      baseStatus: "recorded",
      meta: isRodolfo ? ["Portugal", "2008"] : [],
    },

    nodeFromCertificate(
      {
        id: "ipaf-3ab",
        title: "IPAF 3A / 3B",
        subtitle: "Plataformas elevatórias móveis",
        icon: "arrow-up-circle-outline",
        stage: "base",
        family: "powered-access",
        scope: "Internacional",
        dependsOn: ["course"],
        meta: ["3A · móvel vertical", "3B · móvel multidirecional"],
      },
      ipaf,
    ),
    nodeFromCertificate(
      {
        id: "h0b0",
        title: "H0 / B0",
        subtitle: "Operações não elétricas em ambiente elétrico",
        icon: "flash-outline",
        stage: "base",
        family: "electrical-safety",
        scope: "França / equivalente nacional",
        dependsOn: ["course"],
      },
      electrical,
    ),
    nodeFromCertificate(
      {
        id: "work-height",
        title: "Trabalho em altura",
        subtitle: "Arnês e prevenção de queda",
        icon: "body-outline",
        stage: "base",
        family: "work-at-height",
        scope: "Europa · aplicação por país/site",
        dependsOn: ["course"],
      },
      heights,
    ),
    {
      id: "first-aid",
      title: "First Aid / SST",
      subtitle: "Primeiros socorros no trabalho",
      icon: "medkit-outline",
      stage: "base",
      family: "first-aid",
      scope: "Europa · esquema nacional",
      dependsOn: ["course"],
      baseStatus: "available",
    },

    {
      id: "france-n1",
      title: "France Chimie N1",
      subtitle: "Intervenção em site químico",
      icon: "flask-outline",
      stage: "industrial-access",
      family: "industrial-safety-france",
      scope: "França · indústria química",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "b-vca",
      title: "B-VCA",
      subtitle: "Segurança básica VCA",
      icon: "shield-outline",
      stage: "industrial-access",
      family: "industrial-safety-vca",
      scope: "Países Baixos / Bélgica e clientes VCA",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "scc-018",
      title: "SCC 018",
      subtitle: "Operador SGU",
      icon: "shield-checkmark-outline",
      stage: "industrial-access",
      family: "industrial-safety-scc",
      scope: "Alemanha / mercado SCC",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "site-induction",
      title: "Site Safety Induction",
      subtitle: "Indução específica de fábrica",
      icon: "business-outline",
      stage: "industrial-access",
      family: "site-induction",
      scope: "Específico do cliente/site",
      dependsOn: ["course"],
      baseStatus: "available",
      meta: ["Não é uma certificação universal", "Pode expirar por site/projeto"],
    },

    {
      id: "atex-n1",
      title: "Ism-ATEX N1",
      subtitle: "1E / 1M · execução",
      icon: "warning-outline",
      stage: "technical",
      family: "atex",
      scope: "Indústria ATEX",
      dependsOn: ["course"],
      baseStatus: isRodolfo ? "pending" : "available",
      meta: isRodolfo ? ["Comprovativo por associar"] : [],
    },
    {
      id: "electrical-b1",
      title: "B1 / B1V / BR",
      subtitle: "Execução / intervenção elétrica",
      icon: "flash-outline",
      stage: "technical",
      family: "electrical-work",
      scope: "França / equivalente nacional",
      dependsOn: ["h0b0"],
      baseStatus: "available",
    },
    {
      id: "fgas-a2",
      title: "F-Gas A2",
      subtitle: "F-gases e hidrocarbonetos · âmbito limitado",
      icon: "snow-outline",
      stage: "technical",
      family: "refrigeration-eu",
      scope: "UE / reconhecimento entre Estados-Membros",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "confined-space",
      title: "Espaços confinados",
      subtitle: "Acesso, vigilância e resgate",
      icon: "contract-outline",
      stage: "technical",
      family: "confined-spaces",
      scope: "Europa · esquema nacional/site",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "rigging",
      title: "Rigging / Slinging",
      subtitle: "Elevação e orientação de cargas",
      icon: "git-compare-outline",
      stage: "technical",
      family: "lifting",
      scope: "Europa · esquema nacional/site",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "loto",
      title: "LOTO",
      subtitle: "Lockout / Tagout · consignação de energias",
      icon: "lock-closed-outline",
      stage: "technical",
      family: "energy-isolation",
      scope: "Indústria · procedimento de empresa/site",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "overhead-crane",
      title: "Ponte rolante",
      subtitle: "R484 / equivalente",
      icon: "git-network-outline",
      stage: "technical",
      family: "lifting-equipment",
      scope: "Nacional / cliente",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "forklift",
      title: "Empilhador",
      subtitle: "R489 / equivalente",
      icon: "cube-outline",
      stage: "technical",
      family: "industrial-vehicles",
      scope: "Nacional / cliente",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "scaffolding",
      title: "Andaimes",
      subtitle: "Montagem / utilização conforme função",
      icon: "grid-outline",
      stage: "technical",
      family: "scaffolding",
      scope: "Nacional / cliente",
      dependsOn: ["work-height"],
      baseStatus: "available",
    },

    {
      id: "france-n2",
      title: "France Chimie N2",
      subtitle: "Encadramento de intervenções",
      icon: "flask-outline",
      stage: "responsibility",
      family: "industrial-safety-france",
      scope: "França · indústria química",
      dependsOn: ["france-n1"],
      baseStatus: "available",
      meta: ["Desbloqueio WORKLY após N1"],
    },
    {
      id: "vol-vca",
      title: "VOL-VCA",
      subtitle: "Responsável operacional VCA",
      icon: "shield-checkmark-outline",
      stage: "responsibility",
      family: "industrial-safety-vca",
      scope: "Países Baixos / Bélgica e clientes VCA",
      dependsOn: ["b-vca"],
      baseStatus: "available",
      meta: ["Desbloqueio WORKLY após B-VCA"],
    },
    {
      id: "scc-017",
      title: "SCC 017",
      subtitle: "Chefias operacionais SGU",
      icon: "shield-checkmark-outline",
      stage: "responsibility",
      family: "industrial-safety-scc",
      scope: "Alemanha / mercado SCC",
      dependsOn: ["scc-018"],
      baseStatus: "available",
      meta: ["Desbloqueio WORKLY após SCC 018"],
    },
    {
      id: "atex-n2",
      title: "Ism-ATEX N2",
      subtitle: "2E / 2M · pessoa autorizada",
      icon: "warning-outline",
      stage: "responsibility",
      family: "atex",
      scope: "Indústria ATEX",
      dependsOn: ["atex-n1"],
      baseStatus: "available",
      meta: ["Desbloqueio WORKLY após N1 validado"],
    },
    {
      id: "electrical-b2",
      title: "B2 / B2V / BC",
      subtitle: "Chefia de trabalhos / consignação",
      icon: "flash-outline",
      stage: "responsibility",
      family: "electrical-work",
      scope: "França / equivalente nacional",
      dependsOn: ["electrical-b1"],
      baseStatus: "available",
      meta: ["Progressão WORKLY por responsabilidade"],
    },
    {
      id: "fgas-a1",
      title: "F-Gas A1",
      subtitle: "Âmbito completo F-gases e hidrocarbonetos",
      icon: "snow-outline",
      stage: "responsibility",
      family: "refrigeration-eu",
      scope: "UE / reconhecimento entre Estados-Membros",
      dependsOn: ["fgas-a2"],
      baseStatus: "available",
      meta: [
        "Progressão visual WORKLY",
        "A2 não é apresentado como pré-requisito legal universal de A1",
      ],
    },

    {
      id: "iecex-copc",
      title: "IECEx CoPC",
      subtitle: "Competência internacional em atmosferas Ex",
      icon: "diamond-outline",
      stage: "master",
      family: "explosive-atmospheres-advanced",
      scope: "Internacional",
      dependsOn: ["atex-n2"],
      baseStatus: "available",
    },
    {
      id: "fgas-b",
      title: "F-Gas B · CO₂",
      subtitle: "Especialização em dióxido de carbono",
      icon: "snow-outline",
      stage: "master",
      family: "refrigeration-co2",
      scope: "UE",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "fgas-c",
      title: "F-Gas C · NH₃",
      subtitle: "Especialização em amoníaco",
      icon: "snow-outline",
      stage: "master",
      family: "refrigeration-nh3",
      scope: "UE",
      dependsOn: ["course"],
      baseStatus: "available",
    },
    {
      id: "ipaf-mm",
      title: "IPAF MM",
      subtitle: "MEWPs for Managers",
      icon: "people-outline",
      stage: "master",
      family: "powered-access-management",
      scope: "Internacional",
      dependsOn: ["ipaf-3ab"],
      baseStatus: "available",
    },
  ];

  const achievements = resolveStatuses(specs);
  const byId = new Map(achievements.map((item) => [item.id, item]));

  const certificateNodes = achievements.filter((item) => item.id !== "course");
  const confirmedCount = certificateNodes.filter((item) =>
    isCompleted(item.status),
  ).length;
  const pendingCount = certificateNodes.filter(
    (item) => item.status === "pending",
  ).length;
  const totalCount = certificateNodes.length;

  const families = Array.from(
    new Set(certificateNodes.map((item) => item.family)),
  );
  const coveredFamilies = families.filter((family) =>
    certificateNodes.some(
      (item) => item.family === family && isCompleted(item.status),
    ),
  ).length;

  const currentStage =
    confirmedCount >= 12
      ? "Responsável"
      : confirmedCount >= 7
        ? "Técnico"
        : confirmedCount >= 4
          ? "Operador"
          : "Base";

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.identityCard, { borderColor: accent + "44" }]}>
          <View style={styles.identityRow}>
            <Avatar
              name={worker.name}
              flag={worker.flag}
              size={70}
              accent={accent}
            />
            <View style={styles.identityText}>
              <Text style={[styles.eyebrow, { color: accent }]}>WORKLY ID</Text>
              <Text style={styles.name} numberOfLines={1}>
                {worker.name}
              </Text>
              <Text style={styles.profession} numberOfLines={2}>
                {profession}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <MiniStat
              value={String(confirmedCount) + "/" + String(totalCount)}
              label="certificados"
              icon="ribbon-outline"
              accent={accent}
            />
            <MiniStat
              value={String(pendingCount)}
              label="a validar"
              icon="time-outline"
              accent={workspaceColors.yellow}
            />
            <MiniStat
              value={currentStage}
              label="etapa"
              icon="git-branch-outline"
              accent={accent}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.areaScroller}
          >
            {(isRodolfo
              ? rodolfoAreas
              : [{ label: worker.profession, icon: "construct-outline" as const }]
            ).map((area) => (
              <View key={area.label} style={styles.areaChip}>
                <Ionicons name={area.icon} size={14} color={accent} />
                <Text style={styles.areaChipText}>{area.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryEyebrow}>MAPA EUROPEU</Text>
              <Text style={styles.summaryTitle}>Árvore de certificações</Text>
            </View>
            <View style={[styles.familyCounter, { borderColor: accent + "55" }]}>
              <Text style={[styles.familyCounterValue, { color: accent }]}>
                {coveredFamilies}/{families.length}
              </Text>
              <Text style={styles.familyCounterLabel}>FAMÍLIAS</Text>
            </View>
          </View>
          <Text style={styles.summaryText}>
            Progressão vertical. Certificações nacionais equivalentes contam como
            caminhos alternativos; não tens de possuir todas para evoluir.
          </Text>
        </View>

        <View style={styles.tree}>
          {STAGES.map((stage, stageIndex) => {
            const nodes = achievements.filter((item) => item.stage === stage.key);
            if (!nodes.length) return null;

            const stageFamilies = Array.from(
              new Set(nodes.map((item) => item.family)),
            );

            return (
              <React.Fragment key={stage.key}>
                <StageHeader
                  title={stage.title}
                  subtitle={stage.subtitle}
                  accent={accent}
                  finalStage={stage.key === "master"}
                />

                <View style={styles.stageBody}>
                  {stageFamilies.map((family) => {
                    const familyNodes = nodes.filter(
                      (item) => item.family === family,
                    );
                    return (
                      <FamilyChain
                        key={family}
                        nodes={familyNodes}
                        byId={byId}
                        accent={accent}
                        onPress={setSelected}
                        showFamilyLabel={familyNodes.length > 1}
                      />
                    );
                  })}
                </View>

                {stageIndex < STAGES.length - 1 ? (
                  <View style={styles.stageConnector}>
                    <View
                      style={[
                        styles.stageConnectorLine,
                        { backgroundColor: accent + "35" },
                      ]}
                    />
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={accent + "99"}
                    />
                    <View
                      style={[
                        styles.stageConnectorLine,
                        { backgroundColor: accent + "35" },
                      ]}
                    />
                  </View>
                ) : null}
              </React.Fragment>
            );
          })}

          <MasterSeal
            accent={accent}
            unlocked={confirmedCount >= 12 && coveredFamilies >= 9}
          />
        </View>
      </ScrollView>

      <AchievementModal
        node={selected}
        byId={byId}
        accent={accent}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function MiniStat({
  value,
  label,
  icon,
  accent,
}: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={15} color={accent} />
      <View style={styles.miniStatText}>
        <Text style={styles.miniStatValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.miniStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

function StageHeader({
  title,
  subtitle,
  accent,
  finalStage,
}: {
  title: string;
  subtitle: string;
  accent: string;
  finalStage?: boolean;
}) {
  return (
    <View
      style={[
        styles.stageHeader,
        finalStage ? { borderColor: accent + "55" } : null,
      ]}
    >
      <View
        style={[
          styles.stageHeaderIcon,
          {
            borderColor: finalStage ? accent + "66" : workspaceColors.lineStrong,
            backgroundColor: finalStage
              ? accent + "12"
              : workspaceColors.panelStrong,
          },
        ]}
      >
        <Ionicons
          name={finalStage ? "diamond-outline" : "layers-outline"}
          size={18}
          color={finalStage ? accent : workspaceColors.textSoft}
        />
      </View>
      <View style={styles.stageHeaderText}>
        <Text style={styles.stageTitle}>{title}</Text>
        <Text style={styles.stageSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function FamilyChain({
  nodes,
  byId,
  accent,
  onPress,
  showFamilyLabel,
}: {
  nodes: AchievementNode[];
  byId: Map<string, AchievementNode>;
  accent: string;
  onPress: (node: AchievementNode) => void;
  showFamilyLabel: boolean;
}) {
  return (
    <View style={styles.familyChain}>
      {showFamilyLabel ? (
        <Text style={styles.familyLabel}>
          {familyDisplayName(nodes[0]?.family ?? "")}
        </Text>
      ) : null}

      {nodes.map((node, index) => {
        const prerequisiteNames = (node.dependsOn ?? [])
          .map((id) => byId.get(id)?.title)
          .filter(Boolean) as string[];

        return (
          <React.Fragment key={node.id}>
            <AchievementBadge
              node={node}
              accent={accent}
              prerequisiteNames={prerequisiteNames}
              onPress={() => onPress(node)}
            />
            {index < nodes.length - 1 ? (
              <View style={styles.nodeConnector}>
                <View
                  style={[
                    styles.nodeConnectorLine,
                    {
                      backgroundColor: isCompleted(node.status)
                        ? accent + "66"
                        : workspaceColors.lineStrong,
                    },
                  ]}
                />
                <Ionicons
                  name={
                    isCompleted(node.status)
                      ? "checkmark-circle"
                      : "lock-closed-outline"
                  }
                  size={13}
                  color={
                    isCompleted(node.status)
                      ? accent
                      : workspaceColors.muted
                  }
                />
                <View
                  style={[
                    styles.nodeConnectorLine,
                    {
                      backgroundColor: isCompleted(node.status)
                        ? accent + "66"
                        : workspaceColors.lineStrong,
                    },
                  ]}
                />
              </View>
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function familyDisplayName(family: string) {
  const names: Record<string, string> = {
    "industrial-safety-france": "FRANCE CHIMIE",
    "industrial-safety-vca": "VCA",
    "industrial-safety-scc": "SCC",
    atex: "ATEX",
    "electrical-work": "ELÉTRICA",
    "refrigeration-eu": "REFRIGERAÇÃO UE",
  };
  return names[family] ?? "";
}

function AchievementBadge({
  node,
  accent,
  prerequisiteNames,
  onPress,
}: {
  node: AchievementNode;
  accent: string;
  prerequisiteNames: string[];
  onPress: () => void;
}) {
  const tone = statusTone(node.status, accent);
  const locked = node.status === "locked";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={node.title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.nodeCard,
        {
          borderColor:
            node.status === "verified" || node.status === "recorded"
              ? tone + "66"
              : workspaceColors.line,
        },
        pressed ? styles.nodePressed : null,
      ]}
    >
      <View style={styles.nodeTop}>
        <View
          style={[
            styles.badgeOuter,
            {
              borderColor: tone + (locked ? "55" : "99"),
              backgroundColor: tone + (locked ? "08" : "12"),
            },
          ]}
        >
          <View
            style={[
              styles.badgeInner,
              {
                borderColor: tone + "44",
              },
            ]}
          >
            <Ionicons
              name={locked ? "lock-closed-outline" : node.icon}
              size={26}
              color={tone}
            />
          </View>
        </View>

        <View style={styles.nodeText}>
          <Text style={styles.nodeTitle} numberOfLines={2}>
            {node.title}
          </Text>
          <Text style={styles.nodeSubtitle} numberOfLines={2}>
            {node.subtitle}
          </Text>
          <Text style={styles.nodeScope} numberOfLines={1}>
            {node.scope}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            {
              borderColor: tone + "44",
              backgroundColor: tone + "0D",
            },
          ]}
        >
          <Ionicons name={statusIcon(node.status)} size={11} color={tone} />
          <Text style={[styles.statusText, { color: tone }]}>
            {statusLabel(node.status)}
          </Text>
        </View>
      </View>

      {locked && prerequisiteNames.length ? (
        <View style={styles.unlockRow}>
          <Ionicons
            name="git-branch-outline"
            size={12}
            color={workspaceColors.muted}
          />
          <Text style={styles.unlockText} numberOfLines={1}>
            Desbloqueia após {prerequisiteNames.join(" + ")}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function MasterSeal({
  accent,
  unlocked,
}: {
  accent: string;
  unlocked: boolean;
}) {
  const tone = unlocked ? accent : workspaceColors.muted;

  return (
    <View style={styles.masterWrap}>
      <View style={[styles.masterLine, { backgroundColor: tone + "44" }]} />
      <View
        style={[
          styles.masterSeal,
          {
            borderColor: tone + "77",
            backgroundColor: tone + "10",
          },
        ]}
      >
        <Ionicons
          name={unlocked ? "diamond" : "lock-closed-outline"}
          size={30}
          color={tone}
        />
        <Text style={[styles.masterTitle, { color: tone }]}>MASTER WORKLY</Text>
        <Text style={styles.masterSubtitle}>
          {unlocked
            ? "Progressão avançada concluída"
            : "Bloqueado até reunir experiência e famílias avançadas verificadas"}
        </Text>
      </View>
    </View>
  );
}

function AchievementModal({
  node,
  byId,
  accent,
  onClose,
}: {
  node: AchievementNode | null;
  byId: Map<string, AchievementNode>;
  accent: string;
  onClose: () => void;
}) {
  if (!node) return null;

  const evidence = node.evidence;
  const certificate = node.certificate;
  const tone = statusTone(node.status, accent);
  const canOpenFile = Boolean(evidence?.file_id);
  const prerequisites = (node.dependsOn ?? [])
    .map((id) => byId.get(id))
    .filter(Boolean) as AchievementNode[];

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
        <View style={[styles.modalBadge, { borderColor: tone + "77" }]}>
          <Ionicons
            name={node.status === "locked" ? "lock-closed-outline" : node.icon}
            size={34}
            color={tone}
          />
        </View>

        <View style={styles.modalStatusRow}>
          <Ionicons name={statusIcon(node.status)} size={15} color={tone} />
          <Text style={[styles.modalStatusText, { color: tone }]}>
            {statusLabel(node.status)}
          </Text>
        </View>

        <View style={styles.scopeCard}>
          <Text style={sharedStyles.label}>ÂMBITO</Text>
          <Text style={styles.scopeValue}>{node.scope}</Text>
        </View>

        {prerequisites.length ? (
          <View style={styles.scopeCard}>
            <Text style={sharedStyles.label}>DESBLOQUEIO WORKLY</Text>
            <Text style={styles.scopeValue}>
              {prerequisites.map((item) => item.title).join(" + ")}
            </Text>
            <Text style={styles.scopeNote}>
              É uma sequência visual de progressão. Os requisitos legais podem
              variar por certificação, função, país e entidade emissora.
            </Text>
          </View>
        ) : null}

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
                : node.status === "pending"
                  ? workspaceColors.yellow + "55"
                  : workspaceColors.line,
            },
          ]}
        >
          <Ionicons
            name={canOpenFile ? "document-attach-outline" : "document-outline"}
            size={21}
            color={
              canOpenFile
                ? workspaceColors.green
                : node.status === "pending"
                  ? workspaceColors.yellow
                  : workspaceColors.muted
            }
          />
          <View style={styles.evidenceTextWrap}>
            <Text style={styles.evidenceTitle}>
              {canOpenFile
                ? "Comprovativo associado"
                : node.status === "pending"
                  ? "Comprovativo por associar"
                  : node.status === "locked"
                    ? "Badge ainda bloqueado"
                    : "Sem documento associado"}
            </Text>
            <Text style={styles.evidenceText}>
              {canOpenFile
                ? "Toca em Abrir comprovativo para consultar o documento real."
                : node.status === "pending"
                  ? "Depois de associares o documento, a conquista pode passar a verificada."
                  : node.status === "locked"
                    ? "Conclui o passo anterior da progressão WORKLY para desbloquear este badge."
                    : "Quando adicionares esta certificação, o documento fica ligado diretamente ao badge."}
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
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 92,
    gap: 10,
  },
  identityCard: {
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: workspaceColors.panelSoft,
    padding: 13,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 7,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  name: {
    marginTop: 3,
    color: workspaceColors.text,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  profession: {
    marginTop: 2,
    color: workspaceColors.textSoft,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 6,
  },
  miniStat: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  miniStatText: {
    minWidth: 0,
  },
  miniStatValue: {
    color: workspaceColors.text,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
  },
  miniStatLabel: {
    color: workspaceColors.muted,
    fontSize: 6,
    lineHeight: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  areaScroller: {
    paddingTop: 10,
    gap: 6,
  },
  areaChip: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panel,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  areaChipText: {
    color: workspaceColors.textSoft,
    fontSize: 8,
    fontWeight: "700",
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 16,
    backgroundColor: workspaceColors.panelSoft,
    padding: 12,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryEyebrow: {
    color: workspaceColors.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  summaryTitle: {
    marginTop: 2,
    color: workspaceColors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },
  familyCounter: {
    minWidth: 62,
    minHeight: 45,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  familyCounterValue: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
  },
  familyCounterLabel: {
    marginTop: 1,
    color: workspaceColors.muted,
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  summaryText: {
    marginTop: 8,
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 12,
  },
  tree: {
    width: "100%",
    alignItems: "stretch",
  },
  stageHeader: {
    width: "100%",
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 15,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  stageHeaderIcon: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  stageHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  stageTitle: {
    color: workspaceColors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
  },
  stageSubtitle: {
    marginTop: 2,
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 11,
  },
  stageBody: {
    width: "100%",
    paddingTop: 9,
    gap: 9,
  },
  familyChain: {
    width: "100%",
    alignItems: "stretch",
  },
  familyLabel: {
    marginBottom: 6,
    color: workspaceColors.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
  nodeCard: {
    width: "100%",
    minHeight: 88,
    padding: 10,
    borderWidth: 1,
    borderRadius: 15,
    backgroundColor: workspaceColors.panelSoft,
  },
  nodePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  nodeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badgeOuter: {
    width: 58,
    height: 58,
    borderWidth: 1.5,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeInner: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: workspaceColors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeText: {
    flex: 1,
    minWidth: 0,
  },
  nodeTitle: {
    color: workspaceColors.text,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
  },
  nodeSubtitle: {
    marginTop: 2,
    color: workspaceColors.textSoft,
    fontSize: 8,
    lineHeight: 11,
  },
  nodeScope: {
    marginTop: 3,
    color: workspaceColors.muted,
    fontSize: 7,
    lineHeight: 10,
  },
  statusPill: {
    minWidth: 66,
    minHeight: 24,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  statusText: {
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.35,
  },
  unlockRow: {
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: workspaceColors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  unlockText: {
    flex: 1,
    color: workspaceColors.muted,
    fontSize: 7,
    lineHeight: 10,
  },
  nodeConnector: {
    alignSelf: "center",
    width: 20,
    height: 38,
    alignItems: "center",
    justifyContent: "space-between",
  },
  nodeConnectorLine: {
    width: 1,
    flex: 1,
  },
  stageConnector: {
    alignSelf: "center",
    width: 22,
    height: 52,
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageConnectorLine: {
    width: 1,
    flex: 1,
  },
  masterWrap: {
    marginTop: 2,
    alignItems: "center",
  },
  masterLine: {
    width: 1,
    height: 28,
  },
  masterSeal: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: workspaceColors.panelSoft,
  },
  masterTitle: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  masterSubtitle: {
    marginTop: 4,
    maxWidth: 360,
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 12,
    textAlign: "center",
  },
  modalContent: {
    alignItems: "center",
    gap: 11,
    paddingVertical: 7,
  },
  modalBadge: {
    width: 72,
    height: 72,
    borderWidth: 1.5,
    borderRadius: 22,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  modalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  modalStatusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  scopeCard: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 11,
    backgroundColor: workspaceColors.panelSoft,
  },
  scopeValue: {
    marginTop: 3,
    color: workspaceColors.textSoft,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  scopeNote: {
    marginTop: 5,
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 12,
  },
  metaGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  metaItem: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 135,
    padding: 9,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 10,
    backgroundColor: workspaceColors.panelSoft,
  },
  metaValue: {
    marginTop: 2,
    color: workspaceColors.textSoft,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
  },
  metaPills: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
  },
  metaPill: {
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: workspaceColors.panelStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  metaPillText: {
    color: workspaceColors.textSoft,
    fontSize: 8,
    fontWeight: "700",
  },
  evidenceBox: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderRadius: 11,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  evidenceTextWrap: {
    flex: 1,
  },
  evidenceTitle: {
    color: workspaceColors.text,
    fontSize: 10,
    fontWeight: "800",
  },
  evidenceText: {
    marginTop: 2,
    color: workspaceColors.muted,
    fontSize: 8,
    lineHeight: 12,
  },
});
