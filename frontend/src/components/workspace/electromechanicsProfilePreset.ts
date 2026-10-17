import type { Certificate, Worker } from "@/src/demo/types";

/**
 * Optional user-initiated profile starter. No identity details, experience durations
 * or verified claims are fabricated. Evidence stays recorded until independently reviewed.
 */
export const electromechanicsProfilePreset = {
  profession: "Eletromecânica Industrial",
  title: "Eletromecânico | Refrigeração e Climatização",
  bio: "Profissional com experiência nas áreas de eletromecânica, refrigeração e climatização, com atuação em instalações e manutenção técnica. Competências declaradas em eletricidade, sistemas AVAC, águas, proteção contra incêndios e instalações solares. Experiência de execução autónoma de trabalhos e intervenções em obra. Registo de formação em plataformas elevatórias móveis IPAF 3A e 3B e riscos de atmosferas explosivas (ATEX), sujeito a verificação documental.",
  specialties: [
    "Refrigeração",
    "Climatização",
    "Sistemas AVAC",
    "Manutenção eletromecânica",
  ],
} as const;

const suggestedCertificates = [
  {
    key: "ipaf-3a",
    name: "IPAF 3A — Plataformas elevatórias verticais móveis",
    evidence_type: "authorisation" as const,
    context: "Categoria 3A (tesoura / plataforma vertical móvel). Aguardar cartão PAL/ePAL para validação.",
  },
  {
    key: "ipaf-3b",
    name: "IPAF 3B — Plataformas elevatórias de braço móveis",
    evidence_type: "authorisation" as const,
    context: "Categoria 3B (braço articulado/telescópico móvel). Aguardar cartão PAL/ePAL para validação.",
  },
  {
    key: "atex",
    name: "Formação em riscos de atmosferas explosivas (ATEX)",
    evidence_type: "qualification" as const,
    context: "Sensibilização/formação para riscos explosivos. Âmbito, entidade formadora e validade a confirmar pelo documento.",
  },
];

export const electromechanicsCertificates = suggestedCertificates.map(({ key, name }) => ({ key, name }));

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function containsEquivalent(existing: Certificate[], key: string): boolean {
  return existing.some(cert => {
    const name = normalize(cert.name);
    if (key === "ipaf-3a") return name.includes("3a") && (name.includes("ipaf") || name.includes("epal") || name.includes("plataforma"));
    if (key === "ipaf-3b") return name.includes("3b") && (name.includes("ipaf") || name.includes("epal") || name.includes("plataforma"));
    return name.includes("atex") || name.includes("atmosferasexplosivas") || name.includes("riscosexplosivos");
  });
}

export function addDeclaredProfileCertificates(worker: Worker, selected: string[]): Certificate[] {
  const certificates = [...worker.certificates];
  for (const proposal of suggestedCertificates) {
    if (!selected.includes(proposal.key) || containsEquivalent(certificates, proposal.key)) continue;
    certificates.push({
      id: `profile-evidence-${worker.id}-${proposal.key}`,
      name: proposal.name,
      issuer: "",
      issued_at: "",
      expires_at: "",
      status: "recorded",
      file_name: "",
      kind: "certification",
      evidence_type: proposal.evidence_type,
      profession_id: "electromechanics",
      context: proposal.context,
    });
  }
  return certificates;
}
