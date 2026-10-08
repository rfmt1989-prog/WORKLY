export type EvidenceType =
  | "qualification"
  | "work_record"
  | "employer_validation"
  | "technical_assessment"
  | "authorisation";

export type EvidenceTypeDefinition = {
  id: EvidenceType;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  icon:
    | "school-outline"
    | "briefcase-outline"
    | "business-outline"
    | "clipboard-outline"
    | "shield-checkmark-outline";
  countsForProficiency: boolean;
  countsForCompliance: boolean;
};

export const evidenceTypes: EvidenceTypeDefinition[] = [
  {
    id: "qualification",
    label: "Formação / qualificação",
    labelEn: "Training / qualification",
    description: "Diploma, curso, qualificação ou certificado de aprendizagem.",
    descriptionEn: "Diploma, course, qualification or learning certificate.",
    icon: "school-outline",
    countsForProficiency: true,
    countsForCompliance: false,
  },
  {
    id: "work_record",
    label: "Obra / intervenção",
    labelEn: "Project / intervention",
    description: "Trabalho executado e ligado diretamente à competência.",
    descriptionEn: "Completed work directly linked to the competence.",
    icon: "briefcase-outline",
    countsForProficiency: true,
    countsForCompliance: false,
  },
  {
    id: "employer_validation",
    label: "Validação de empresa",
    labelEn: "Employer validation",
    description: "Confirmação independente de execução, autonomia ou responsabilidade.",
    descriptionEn: "Independent confirmation of execution, autonomy or responsibility.",
    icon: "business-outline",
    countsForProficiency: true,
    countsForCompliance: false,
  },
  {
    id: "technical_assessment",
    label: "Avaliação técnica",
    labelEn: "Technical assessment",
    description: "Avaliação prática, teste técnico ou validação por avaliador competente.",
    descriptionEn: "Practical assessment, technical test or validation by a competent assessor.",
    icon: "clipboard-outline",
    countsForProficiency: true,
    countsForCompliance: false,
  },
  {
    id: "authorisation",
    label: "Autorização / conformidade",
    labelEn: "Authorisation / compliance",
    description: "Habilitação, cartão ou requisito legal, empresarial ou de site.",
    descriptionEn: "Legal, employer or site authorisation/card.",
    icon: "shield-checkmark-outline",
    countsForProficiency: false,
    countsForCompliance: true,
  },
];

export type ProficiencyCriterion = {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  labelEn: string;
  headline: string;
  headlineEn: string;
  requirements: string[];
  requirementsEn: string[];
};

export const proficiencyCriteria: ProficiencyCriterion[] = [
  {
    level: 0,
    label: "Não avaliada",
    labelEn: "Not assessed",
    headline: "Sem evidência suficiente",
    headlineEn: "Insufficient evidence",
    requirements: [
      "Não existe prova associada à competência.",
      "A autodeclaração não altera o nível.",
    ],
    requirementsEn: [
      "No evidence is linked to the competence.",
      "Self-declaration does not change the level.",
    ],
  },
  {
    level: 1,
    label: "Documentada",
    labelEn: "Documented",
    headline: "Existe evidência documental",
    headlineEn: "Documentary evidence exists",
    requirements: [
      "Pelo menos um registo de formação, obra, validação ou avaliação associado.",
      "O registo pode ainda estar pendente de validação.",
    ],
    requirementsEn: [
      "At least one training, project, validation or assessment record is linked.",
      "The record may still be awaiting verification.",
    ],
  },
  {
    level: 2,
    label: "Demonstrada",
    labelEn: "Demonstrated",
    headline: "Competência confirmada em contexto real",
    headlineEn: "Competence confirmed in a real context",
    requirements: [
      "Evidência verificada ligada diretamente à competência.",
      "Para competências práticas/diagnóstico: obra, validação de empresa ou avaliação técnica.",
      "Para conhecimento: uma qualificação verificada pode demonstrar o nível base.",
    ],
    requirementsEn: [
      "Verified evidence directly linked to the competence.",
      "For practical/diagnostic competences: project, employer validation or technical assessment.",
      "For knowledge: a verified qualification may demonstrate the base level.",
    ],
  },
  {
    level: 3,
    label: "Avançada",
    labelEn: "Advanced",
    headline: "Execução repetida e autónoma",
    headlineEn: "Repeated autonomous execution",
    requirements: [
      "Pelo menos duas evidências técnicas verificadas.",
      "Pelo menos duas obras/intervenções verificadas na profissão.",
      "Deve existir prova de execução, diagnóstico ou validação independente; formação isolada não chega.",
    ],
    requirementsEn: [
      "At least two verified technical evidence items.",
      "At least two verified projects/interventions in the occupation.",
      "Execution, diagnostics or independent validation must be evidenced; training alone is insufficient.",
    ],
  },
  {
    level: 4,
    label: "Referência",
    labelEn: "Reference",
    headline: "Domínio consistente e reconhecido",
    headlineEn: "Consistent recognised mastery",
    requirements: [
      "Pelo menos quatro evidências técnicas verificadas.",
      "Pelo menos quatro obras/intervenções verificadas.",
      "Inclui validação de empresa ou avaliação técnica independente.",
      "Competências de responsabilidade exigem evidência explícita de coordenação/autonomia.",
    ],
    requirementsEn: [
      "At least four verified technical evidence items.",
      "At least four verified projects/interventions.",
      "Includes employer validation or independent technical assessment.",
      "Responsibility competences require explicit coordination/autonomy evidence.",
    ],
  },
];

export function evidenceTypeDefinition(type?: string) {
  return evidenceTypes.find((item) => item.id === type);
}

export function proficiencyCriterion(level: number) {
  return proficiencyCriteria.find((item) => item.level === level) || proficiencyCriteria[0];
}
