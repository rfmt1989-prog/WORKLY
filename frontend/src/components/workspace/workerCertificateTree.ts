import type Ionicons from "@expo/vector-icons/Ionicons";
import type React from "react";
import type { Certificate, DemoDocument, Worker } from "@/src/demo/types";
import { workspaceColors } from "./primitives";

export type AchievementStatus =
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

export type AchievementNode = {
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
  verificationNote?: string;
};

type NodeSpec = Omit<AchievementNode, "status"> & {
  baseStatus: Exclude<AchievementStatus, "locked">;
};

const badgeColors = {
  verified: "#8CBFFF",
  recorded: workspaceColors.blue,
  pending: "#CDB37E",
  available: "#687385",
  locked: "#3E4652",
};

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
    if (certificate.file_id && document.file_id === certificate.file_id)
      return true;
    const fileMatch =
      Boolean(document.file_name) &&
      document.file_name.toLowerCase() === normalizedFile;
    const titleMatch = document.title.toLowerCase().includes(normalizedName);
    return fileMatch || titleMatch;
  });
}

export type ProfessionTree = {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: AchievementNode["icon"];
  root: AchievementNode;
  nodes: AchievementNode[];
  preview: AchievementNode[];
};

type ProfessionDefinition = Omit<
  ProfessionTree,
  "root" | "nodes" | "preview"
> & {
  matches: string[];
  nodeIds: string[];
  previewIds: string[];
};

export const professionDefinitions: ProfessionDefinition[] = [
  {
    id: "electrical",
    title: "Eletricidade",
    titleEn: "Electrical",
    description: "Instalação, manutenção e sistemas elétricos",
    descriptionEn: "Installation, maintenance and electrical systems",
    icon: "flash-outline",
    matches: ["eletric", "electri"],
    nodeIds: ["h0b0", "electrical-b1", "electrical-b2", "loto"],
    previewIds: ["h0b0", "loto"],
  },
  {
    id: "hvac",
    title: "Climatização",
    titleEn: "HVAC",
    description: "Refrigeração, ar condicionado e eficiência",
    descriptionEn: "Refrigeration, air conditioning and efficiency",
    icon: "snow-outline",
    matches: ["hvac", "climat", "refrig", "eletromec"],
    nodeIds: ["fgas-a2", "fgas-a1", "fgas-b", "fgas-c"],
    previewIds: ["fgas-a2", "fgas-b"],
  },
  {
    id: "plumbing",
    title: "Canalização",
    titleEn: "Plumbing",
    description: "Redes de água e instalações hidráulicas",
    descriptionEn: "Water networks and plumbing installations",
    icon: "water-outline",
    matches: ["canal", "plumb", "hidraul"],
    nodeIds: ["water-networks", "sanitation", "pipe-testing"],
    previewIds: ["water-networks", "sanitation"],
  },
  {
    id: "solar",
    title: "Energia solar",
    titleEn: "Solar energy",
    description: "Sistemas fotovoltaicos e solares térmicos",
    descriptionEn: "Photovoltaic and solar thermal systems",
    icon: "sunny-outline",
    matches: ["solar", "fotovolt", "photovolta"],
    nodeIds: ["photovoltaic", "solar-thermal", "solar-maintenance"],
    previewIds: ["photovoltaic", "solar-thermal"],
  },
  {
    id: "industrial",
    title: "Montagem industrial",
    titleEn: "Industrial assembly",
    description: "Plataformas, elevação e segurança industrial",
    descriptionEn: "Access platforms, lifting and industrial safety",
    icon: "construct-outline",
    matches: [
      "industr",
      "montag",
      "ipaf",
      "plataform",
      "nacell",
      "heavy",
      "equipament",
      "metal",
    ],
    nodeIds: [
      "ipaf-3ab",
      "ipaf-mm",
      "risk-chem-n1",
      "atex-n1",
      "atex-n2",
      "iecex-copc",
      "france-n1",
      "france-n2",
      "b-vca",
      "vol-vca",
      "scc-018",
      "scc-017",
      "site-induction",
      "work-height",
      "scaffolding",
      "rigging",
      "overhead-crane",
      "forklift",
      "confined-space",
      "first-aid",
    ],
    previewIds: ["ipaf-3ab", "risk-chem-n1"],
  },
];

const suggestedNodes = [
  [
    "water-networks",
    "Redes de água",
    "Instalação e manutenção",
    "water-outline",
    "plumbing",
  ],
  [
    "sanitation",
    "Saneamento",
    "Redes e escoamento",
    "git-merge-outline",
    "plumbing",
  ],
  [
    "pipe-testing",
    "Ensaios de tubagem",
    "Estanquidade e manutenção",
    "speedometer-outline",
    "plumbing",
  ],
  [
    "photovoltaic",
    "Fotovoltaico",
    "Instalação de sistemas solares",
    "grid-outline",
    "solar",
  ],
  [
    "solar-thermal",
    "Solar térmico",
    "Instalação e manutenção",
    "sunny-outline",
    "solar",
  ],
  [
    "solar-maintenance",
    "Manutenção solar",
    "Diagnóstico e manutenção",
    "construct-outline",
    "solar",
  ],
] as const;

export function buildProfessionTrees(
  worker: Worker,
  achievements: AchievementNode[],
): ProfessionTree[] {
  const nodes = new Map(achievements.map((node) => [node.id, node]));
  for (const [id, title, subtitle, icon, family] of suggestedNodes) {
    if (!nodes.has(id))
      nodes.set(id, {
        id,
        title,
        subtitle,
        icon,
        family,
        status: "available",
        stage: "technical",
        scope: "Formação profissional",
      });
  }
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const areas = normalize(
    [worker.profession, ...worker.skills.map((item) => item.name)].join(" "),
  );
  const isRodolfo = normalize(worker.name).includes("rodolfo maia");
  const definitions = professionDefinitions.filter(
    (definition) =>
      isRodolfo ||
      definition.matches.some((needle) => areas.includes(needle)) ||
      worker.certificates.some((item) => item.profession_id === definition.id),
  );
  const assigned = new Set<string>();
  const trees: ProfessionTree[] = definitions.map((definition) => {
    const specific = achievements.filter(
      (node) => node.certificate?.profession_id === definition.id,
    );
    const ids = [
      ...new Set([...definition.nodeIds, ...specific.map((node) => node.id)]),
    ];
    const treeNodes = ids
      .map((id) => nodes.get(id))
      .filter((node): node is AchievementNode => Boolean(node))
      .filter(
        (node) =>
          !node.certificate?.profession_id ||
          node.certificate.profession_id === definition.id,
      );
    treeNodes.forEach((node) => assigned.add(node.id));
    const course = nodes.get("course")!;
    const savedRoot = nodes.get(`${definition.id}-foundation`);
    const root: AchievementNode =
      savedRoot ||
      (isRodolfo && ["electrical", "hvac", "industrial"].includes(definition.id)
        ? course
        : {
            id: `${definition.id}-foundation`,
            title: "Formação de base",
            subtitle: definition.title,
            icon: "school-outline",
            status: "available",
            stage: "foundation",
            family: definition.id,
            scope: "Formação profissional",
          });
    // A foundation belongs at the root, not a second time in its own branches.
    const branches = treeNodes.filter((node) => node.id !== root.id);
    assigned.add(root.id);
    const preview = definition.previewIds
      .map((id) => branches.find((node) => node.id === id))
      .filter((node): node is AchievementNode => Boolean(node));
    return {
      ...definition,
      root,
      nodes: branches,
      preview: preview.length ? preview : branches.slice(0, 2),
    };
  });
  const unassigned = achievements.filter(
    (node) => node.certificate && !assigned.has(node.id),
  );
  if (!trees.length || unassigned.length) {
    const root = {
      ...nodes.get("course")!,
      title: isRodolfo ? nodes.get("course")!.title : "Formação de base",
    };
    trees.push({
      id: "professional",
      title: worker.profession,
      titleEn: worker.profession,
      description: "Certificados da profissão",
      descriptionEn: "Professional certificates",
      icon: "ribbon-outline",
      root,
      nodes: unassigned,
      preview: unassigned.slice(0, 2),
    });
  }
  return trees;
}

export function isCompleted(status: AchievementStatus) {
  return status === "verified" || status === "recorded";
}

export function statusLabel(status: AchievementStatus) {
  if (status === "verified") return "VERIFICADO";
  if (status === "recorded") return "REGISTADO";
  if (status === "pending") return "A VALIDAR";
  if (status === "available") return "POR ADICIONAR";
  return "PRÓXIMO PASSO";
}

export function statusIcon(status: AchievementStatus) {
  if (status === "verified") return "shield-checkmark-outline" as const;
  if (status === "recorded") return "checkmark-circle-outline" as const;
  if (status === "pending") return "time-outline" as const;
  if (status === "available") return "add-circle-outline" as const;
  return "lock-closed-outline" as const;
}

export function statusTone(status: AchievementStatus, accent: string) {
  if (status === "verified") return badgeColors.verified;
  if (status === "recorded") return accent;
  if (status === "pending") return badgeColors.pending;
  if (status === "available") return badgeColors.available;
  return badgeColors.locked;
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

export function buildWorkerCertificateNodes(worker: Worker): AchievementNode[] {
  const isRodolfo = worker.name.toLowerCase().includes("rodolfo maia");
  const ipaf = findCertificate(worker.certificates, ["ipaf", "3a", "3b"]);
  const electrical = isRodolfo
    ? undefined
    : findCertificate(worker.certificates, [
        "h0b0",
        "h0 / b0",
        "habilitação elétrica",
      ]);
  const heights = isRodolfo
    ? undefined
    : findCertificate(worker.certificates, ["altura", "heights"]);
  const riskChemical = findCertificate(worker.certificates, [
    "risco químico",
    "sensibilização atex",
  ]);

  const nodeFromCertificate = (
    spec: Omit<NodeSpec, "baseStatus" | "certificate" | "evidence">,
    certificate?: Certificate,
  ): NodeSpec => {
    const evidence = findEvidence(worker.documents, certificate);

    return {
      ...spec,
      certificate,
      evidence,
      baseStatus:
        certificate?.status === "verified"
          ? "verified"
          : certificate?.status === "pending"
            ? "pending"
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
      baseStatus: isRodolfo ? "recorded" : "available",
      meta: isRodolfo ? ["Portugal", "2008"] : [],
    },

    {
      id: "ipaf-3ab",
      title: "IPAF 3A / 3B",
      subtitle: "PAL · Powered Access Licence",
      icon: "arrow-up-circle-outline",
      stage: "base",
      family: "powered-access",
      scope: "Internacional",
      dependsOn: ["course"],
      certificate: ipaf,
      evidence: findEvidence(worker.documents, ipaf),
      baseStatus:
        isRodolfo && ipaf ? "verified" : ipaf ? "recorded" : "available",
      meta: isRodolfo
        ? [
            "PAL · 3A / 3B",
            "Avaliado · 26/05/2026",
            "Válido até · 31/05/2031",
            "Going Up Portugal",
            "Formação · 8 h",
          ]
        : ["3A · móvel vertical", "3B · móvel multidirecional"],
      verificationNote: isRodolfo
        ? "PAL e certificado de formação apresentados e conferidos. O ficheiro pessoal não é publicado no demo público."
        : undefined,
    },
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
      meta: [
        "Não é uma certificação universal",
        "Pode expirar por site/projeto",
      ],
    },

    {
      id: "risk-chem-n1",
      title: "Risco Químico · Nível 1",
      subtitle: "VERIFICADO · SGP Formation · conteúdo ATEX",
      icon: "flask-outline",
      stage: "industrial-access",
      family: "chemical-risk",
      scope: "Formação industrial · conteúdo ATEX",
      dependsOn: ["course"],
      certificate: riskChemical,
      evidence: findEvidence(worker.documents, riskChemical),
      baseStatus:
        isRodolfo && riskChemical
          ? "verified"
          : riskChemical
            ? "recorded"
            : "available",
      meta: isRodolfo
        ? ["SGP Formation", "28–29/08/2026", "7 h", "Validação · Succès"]
        : [],
      verificationNote: isRodolfo
        ? "Atestado de fim de formação apresentado e conferido. Não equivale automaticamente a France Chimie N1 nem a Ism-ATEX N1."
        : undefined,
    },
    {
      id: "atex-n1",
      title: "Ism-ATEX N1",
      subtitle: "1E / 1M · execução",
      icon: "warning-outline",
      stage: "technical",
      family: "atex",
      scope: "Indústria ATEX",
      dependsOn: ["risk-chem-n1"],
      baseStatus: "available",
      meta: ["Progressão WORKLY · não equivalência automática"],
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

  // Explicit associations survive renaming and keep uploads in their profession.
  const resolvedSpecs = specs.map((spec) => {
    const certificate = worker.certificates.find(
      (item) => item.node_id === spec.id,
    );
    if (!certificate) return spec;
    return {
      ...spec,
      certificate,
      evidence: findEvidence(worker.documents, certificate),
      baseStatus:
        certificate.status === "verified"
          ? ("verified" as const)
          : certificate.status === "pending"
            ? ("pending" as const)
            : ("recorded" as const),
    };
  });
  const extraSpecs: NodeSpec[] = [];
  for (const certificate of worker.certificates) {
    if (resolvedSpecs.some((item) => item.certificate?.id === certificate.id))
      continue;
    // These legacy demonstration entries were intentionally excluded from the
    // existing Rodolfo profile; only an explicit upload may associate them.
    if (
      isRodolfo &&
      !certificate.node_id &&
      !certificate.file_id &&
      /h0b0|trabalho em altura/i.test(certificate.name)
    )
      continue;
    extraSpecs.push({
      id: certificate.node_id || `certificate-${certificate.id}`,
      title: certificate.name,
      subtitle: certificate.issuer,
      icon: "ribbon-outline",
      stage: "technical",
      family: certificate.profession_id || "professional",
      scope: "Certificado profissional",
      certificate,
      evidence: findEvidence(worker.documents, certificate),
      baseStatus:
        certificate.status === "verified"
          ? "verified"
          : certificate.status === "pending"
            ? "pending"
            : "recorded",
    });
  }
  return resolveStatuses([...resolvedSpecs, ...extraSpecs]);
}
