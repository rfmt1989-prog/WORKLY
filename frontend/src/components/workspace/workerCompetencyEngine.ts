import type { Project, Worker } from "@/src/demo/types";
import { findProfessionDefinition } from "./professionCatalog";
import {
  competencyProfileFor,
  worklyLevelGates,
  type CompetencySpec,
} from "./competencyFramework";
import { evidenceTypeDefinition, type EvidenceType } from "./competencyEvidenceModel";

export type CompetencyEvidenceState =
  | "verified"
  | "pending"
  | "recorded"
  | "declared"
  | "none";

export type CompetencyAssessment = {
  competency: CompetencySpec;
  evidenceState: CompetencyEvidenceState;
  evidenceCount: number;
  proficiency: 0 | 1 | 2 | 3 | 4;
  proficiencyLabel: string;
  proficiencyLabelEn: string;
  certificate?: Worker["certificates"][number];
  evidence: Worker["certificates"];
  evidenceByType: Partial<Record<EvidenceType, number>>;
};

export type WorkerCompetencyAssessment = {
  professionId: string;
  score: number;
  levelId: string;
  levelLabel: string;
  levelLabelEn: string;
  nextLevelId: string | null;
  coreCoverage: number;
  verifiedProjects: number;
  verifiedQualifications: number;
  responsibilityEvidence: number;
  verifiedRegulatory: number;
  totalRegulatory: number;
  complianceLabel: string;
  complianceLabelEn: string;
  components: {
    id: string;
    label: string;
    labelEn: string;
    points: number;
    maximum: number;
    detail: string;
    detailEn: string;
  }[];
  competencies: CompetencyAssessment[];
  missingGates: string[];
  missingGatesEn: string[];
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

function isCurrentVerified(certificate: Worker["certificates"][number]) {
  if (certificate.status !== "verified") return false;
  if (!certificate.expires_at) return true;
  const expiry = Date.parse(certificate.expires_at);
  return Number.isFinite(expiry) && expiry >= Date.now();
}

function matchingCertificates(worker: Worker, spec: CompetencySpec) {
  const aliases = [spec.id, ...spec.aliases].map(normalize);
  return worker.certificates.filter((certificate) => {
    if (certificate.competency_id === spec.id) return true;
    if (certificate.node_id && aliases.includes(normalize(certificate.node_id)))
      return true;
    const name = normalize(certificate.name);
    return aliases.some((alias) => alias && name.includes(alias));
  });
}

function inferredEvidenceType(
  certificate: Worker["certificates"][number],
): EvidenceType {
  if (certificate.evidence_type) return certificate.evidence_type;
  const value = normalize(certificate.name);
  const authorisationTerms = [
    "ipaf",
    "vca",
    "scc",
    "atex",
    "h0b0",
    "b0",
    "b1",
    "b2",
    "br",
    "bc",
    "loto",
    "altura",
    "height",
    "first aid",
    "socorr",
    "confined",
    "confin",
  ];
  if (authorisationTerms.some((term) => value.includes(term)))
    return "authorisation";
  return "qualification";
}

function matchingDeclaredSkill(worker: Worker, spec: CompetencySpec) {
  const aliases = [spec.title, ...spec.aliases].map(normalize);
  return worker.skills.some((skill) => {
    const name = normalize(skill.name);
    return aliases.some(
      (alias) => alias && (name.includes(alias) || alias.includes(name)),
    );
  });
}

function workerProjectEvidence(
  worker: Worker,
  projects: Project[],
  professionId: string,
) {
  const projectIds = new Set(
    projects
      .filter((project) => {
        const tagged = project as Project & { profession_id?: string };
        return (
          project.status === "completed" &&
          project.worker_ids.includes(worker.id) &&
          tagged.profession_id === professionId
        );
      })
      .map((project) => project.id),
  );

  for (const project of worker.best_projects) {
    if (
      project.status === "verified" &&
      project.verified_by &&
      (!project.profession_id || project.profession_id === professionId)
    ) {
      projectIds.add(project.id);
    }
  }

  return projectIds.size;
}

function proficiencyFromEvidence(
  evidence: Worker["certificates"],
  declared: boolean,
  verifiedProjects: number,
  dimension: CompetencySpec["dimension"],
): 0 | 1 | 2 | 3 | 4 {
  const proficiencyEvidence = evidence.filter(
    (item) => evidenceTypeDefinition(inferredEvidenceType(item))?.countsForProficiency,
  );
  if (!proficiencyEvidence.length && !declared) return 0;

  const verified = proficiencyEvidence.filter(isCurrentVerified);
  if (!verified.length) return 1;

  const qualifications = verified.filter(
    (item) => inferredEvidenceType(item) === "qualification",
  );
  const technical = verified.filter((item) =>
    ["work_record", "employer_validation", "technical_assessment"].includes(
      inferredEvidenceType(item),
    ),
  );
  const independent = verified.filter((item) =>
    ["employer_validation", "technical_assessment"].includes(
      inferredEvidenceType(item),
    ),
  );

  const demonstrated =
    technical.length >= 1 ||
    (dimension === "knowledge" && qualifications.length >= 1);
  if (!demonstrated) return 1;

  const advanced =
    technical.length >= 2 &&
    verifiedProjects >= 2 &&
    (dimension !== "responsibility" || independent.length >= 1);
  if (!advanced) return 2;

  const reference =
    technical.length >= 4 &&
    verifiedProjects >= 4 &&
    independent.length >= 1 &&
    (dimension !== "responsibility" || independent.length >= 2);
  if (!reference) return 3;

  return 4;
}

function proficiencyLabels(level: number) {
  if (level <= 0) return ["Não avaliada", "Not assessed"] as const;
  if (level === 1) return ["Documentada", "Documented"] as const;
  if (level === 2) return ["Demonstrada", "Demonstrated"] as const;
  if (level === 3) return ["Avançada", "Advanced"] as const;
  return ["Referência", "Reference"] as const;
}

export function assessWorkerCompetence(
  worker: Worker,
  projects: Project[],
): WorkerCompetencyAssessment | null {
  const profession = findProfessionDefinition(worker.profession);
  if (!profession) return null;
  const profile = competencyProfileFor(profession.id);
  if (!profile) return null;

  const verifiedProjects = workerProjectEvidence(worker, projects, profession.id);

  const competencies = profile.competencies.map((competency) => {
    const certificates = matchingCertificates(worker, competency);
    const verified = certificates.filter(isCurrentVerified).length;
    const pending = certificates.filter((item) => item.status === "pending").length;
    const recorded = certificates.filter(
      (item) => item.status !== "pending" && item.status !== "verified",
    ).length;
    const declared = matchingDeclaredSkill(worker, competency);
    const proficiency = proficiencyFromEvidence(
      certificates,
      declared,
      verifiedProjects,
      competency.dimension,
    );
    const labels = proficiencyLabels(proficiency);

    let evidenceState: CompetencyEvidenceState = "none";
    if (verified) evidenceState = "verified";
    else if (pending) evidenceState = "pending";
    else if (recorded) evidenceState = "recorded";
    else if (declared) evidenceState = "declared";

    const certificate =
      certificates.find(isCurrentVerified) ||
      certificates.find((item) => item.status === "pending") ||
      certificates[0];

    const evidenceByType = certificates.reduce<Partial<Record<EvidenceType, number>>>(
      (acc, item) => {
        const type = inferredEvidenceType(item);
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      competency,
      evidenceState,
      evidenceCount: certificates.length,
      proficiency,
      proficiencyLabel: labels[0],
      proficiencyLabelEn: labels[1],
      certificate,
      evidence: certificates,
      evidenceByType,
    };
  });

  const essential = competencies.filter(
    (item) => item.competency.relation === "essential",
  );
  const verifiedEssential = essential.filter(
    (item) => item.proficiency >= 2,
  );
  const coreCoverage = essential.length
    ? Math.round((verifiedEssential.length / essential.length) * 100)
    : 0;

  const relevantCertificates = worker.certificates.filter((certificate) => {
    if (certificate.profession_id === profession.id) return true;
    const nodeId = normalize(certificate.node_id || "");
    return profile.competencies.some((competency) =>
      [competency.id, ...competency.aliases]
        .map(normalize)
        .some((alias) => alias && (nodeId === alias || normalize(certificate.name).includes(alias))),
    );
  });
  const verifiedRelevant = relevantCertificates.filter(isCurrentVerified);
  const verifiedQualifications = verifiedRelevant.filter(
    (item) => inferredEvidenceType(item) === "qualification",
  ).length;

  const responsibilityEvidence = competencies.filter(
    (item) =>
      item.competency.dimension === "responsibility" &&
      item.proficiency >= 2,
  ).length;

  const regulatoryMatched = profile.regulatory.map((requirement) => {
    const aliases = requirement.aliases.map(normalize);
    const evidence = worker.certificates.find((certificate) => {
      const name = normalize(certificate.name);
      return (
        inferredEvidenceType(certificate) === "authorisation" &&
        aliases.some((alias) => alias && name.includes(alias))
      );
    });
    return evidence && isCurrentVerified(evidence);
  });
  const verifiedRegulatory = regulatoryMatched.filter(Boolean).length;

  const corePoints = Math.round(coreCoverage * 0.4);
  const experiencePoints = Math.min(25, verifiedProjects * 5);
  const qualificationPoints = Math.min(15, verifiedQualifications * 5);
  const autonomyPoints = Math.min(
    10,
    responsibilityEvidence * 5 + (verifiedProjects >= 3 ? 5 : 0),
  );

  const verifiableEvidence = relevantCertificates.filter(
    (item) =>
      evidenceTypeDefinition(inferredEvidenceType(item))?.countsForProficiency &&
      (item.status === "verified" ||
        item.status === "pending" ||
        item.status === "recorded"),
  );
  const verifiedProficiencyEvidence = verifiedRelevant.filter(
    (item) => evidenceTypeDefinition(inferredEvidenceType(item))?.countsForProficiency,
  );
  const qualityRatio = verifiableEvidence.length
    ? verifiedProficiencyEvidence.length / verifiableEvidence.length
    : 0;
  const qualityPoints = Math.round(qualityRatio * 10);

  const score = Math.min(
    100,
    corePoints +
      experiencePoints +
      qualificationPoints +
      autonomyPoints +
      qualityPoints,
  );

  let achieved = worklyLevelGates[0];
  for (const gate of worklyLevelGates) {
    const eligible =
      score >= gate.minimum &&
      coreCoverage >= gate.coreCoverage &&
      verifiedProjects >= gate.verifiedProjects &&
      responsibilityEvidence >= gate.responsibilityEvidence;
    if (eligible) achieved = gate;
  }
  const achievedIndex = worklyLevelGates.findIndex(
    (item) => item.id === achieved.id,
  );
  const next = worklyLevelGates[achievedIndex + 1] || null;

  const missingGates: string[] = [];
  const missingGatesEn: string[] = [];
  if (next) {
    if (score < next.minimum) {
      missingGates.push(`Score de evidência: ${score}/${next.minimum}`);
      missingGatesEn.push(`Evidence score: ${score}/${next.minimum}`);
    }
    if (coreCoverage < next.coreCoverage) {
      missingGates.push(`Cobertura essencial: ${coreCoverage}%/${next.coreCoverage}%`);
      missingGatesEn.push(`Essential coverage: ${coreCoverage}%/${next.coreCoverage}%`);
    }
    if (verifiedProjects < next.verifiedProjects) {
      missingGates.push(
        `Obras verificadas: ${verifiedProjects}/${next.verifiedProjects}`,
      );
      missingGatesEn.push(
        `Verified projects: ${verifiedProjects}/${next.verifiedProjects}`,
      );
    }
    if (responsibilityEvidence < next.responsibilityEvidence) {
      missingGates.push(
        `Evidência de autonomia: ${responsibilityEvidence}/${next.responsibilityEvidence}`,
      );
      missingGatesEn.push(
        `Autonomy evidence: ${responsibilityEvidence}/${next.responsibilityEvidence}`,
      );
    }
  }

  const complianceLabel = profile.regulatory.length
    ? verifiedRegulatory
      ? `${verifiedRegulatory} comprovativo(s) regulatório(s) válido(s)`
      : "Requisitos dependem do país e da atividade"
    : "Sem requisito universal definido";
  const complianceLabelEn = profile.regulatory.length
    ? verifiedRegulatory
      ? `${verifiedRegulatory} valid regulatory evidence item(s)`
      : "Requirements depend on country and activity"
    : "No universal requirement defined";

  return {
    professionId: profession.id,
    score,
    levelId: achieved.id,
    levelLabel: achieved.label,
    levelLabelEn: achieved.labelEn,
    nextLevelId: next?.id || null,
    coreCoverage,
    verifiedProjects,
    verifiedQualifications,
    responsibilityEvidence,
    verifiedRegulatory,
    totalRegulatory: profile.regulatory.length,
    complianceLabel,
    complianceLabelEn,
    components: [
      {
        id: "core",
        label: "Competências essenciais",
        labelEn: "Essential competences",
        points: corePoints,
        maximum: 40,
        detail: `${verifiedEssential.length}/${essential.length} com evidência verificada`,
        detailEn: `${verifiedEssential.length}/${essential.length} with verified evidence`,
      },
      {
        id: "experience",
        label: "Experiência verificada",
        labelEn: "Verified experience",
        points: experiencePoints,
        maximum: 25,
        detail: `${verifiedProjects} obra(s) confirmada(s)`,
        detailEn: `${verifiedProjects} confirmed project(s)`,
      },
      {
        id: "qualifications",
        label: "Qualificações relevantes",
        labelEn: "Relevant qualifications",
        points: qualificationPoints,
        maximum: 15,
        detail: `${verifiedQualifications} qualificação(ões) verificada(s)`,
        detailEn: `${verifiedQualifications} verified qualification(s)`,
      },
      {
        id: "autonomy",
        label: "Autonomia e responsabilidade",
        labelEn: "Autonomy & responsibility",
        points: autonomyPoints,
        maximum: 10,
        detail: `${responsibilityEvidence} evidência(s) específica(s)`,
        detailEn: `${responsibilityEvidence} specific evidence item(s)`,
      },
      {
        id: "quality",
        label: "Qualidade da evidência",
        labelEn: "Evidence quality",
        points: qualityPoints,
        maximum: 10,
        detail: verifiableEvidence.length
          ? `${verifiedProficiencyEvidence.length}/${verifiableEvidence.length} registos verificados`
          : "Sem evidência associada",
        detailEn: verifiableEvidence.length
          ? `${verifiedProficiencyEvidence.length}/${verifiableEvidence.length} records verified`
          : "No evidence attached",
      },
    ],
    competencies,
    missingGates,
    missingGatesEn,
  };
}
