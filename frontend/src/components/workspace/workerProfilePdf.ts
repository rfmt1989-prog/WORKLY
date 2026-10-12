import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  complianceTitle,
  competencyTitle,
  levelText,
  professionTitle,
  professionalText,
  scopeText,
  specialtyCopy,
} from "@/src/demo/professionalI18n";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { Attendance, LanguageCode, Project, Worker } from "@/src/demo/types";
import {
  complianceCatalog,
  findProfessionDefinition,
  specialtyCatalog,
} from "./professionCatalog";
import { workerFormationNodes } from "./WorkerFormationPath";
import type { WorkerCompetencyAssessment } from "./workerCompetencyEngine";
import type { SpecialtyTree, ComplianceTree } from "./workerCertificateTree";
import { verifiedAttendanceHours } from "./workerExperience";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWorklyId(worker: Worker) {
  if (worker.workly_id) return worker.workly_id;
  if (worker.id === "worker-1") return "WLY-W-000001";
  const compact = worker.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `WLY-W-${compact.slice(-8).padStart(8, "0")}`;
}

function statusLabel(status: string, language: LanguageCode) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  if (status === "verified") return text("Verificado", "Verified");
  if (status === "pending") return text("A validar", "Pending");
  if (status === "recorded") return text("Registado", "Recorded");
  if (status === "locked") return text("Bloqueado", "Next step");
  return text("Por adicionar", "To add");
}

function buildHtml(
  worker: Worker,
  assessment: WorkerCompetencyAssessment | null,
  specialties: SpecialtyTree | null,
  compliance: ComplianceTree | null,
  projects: Project[],
  attendance: Attendance[],
  language: LanguageCode,
) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const professionDefinition = findProfessionDefinition(worker.profession);
  const professionLabel = professionDefinition
    ? professionTitle(
        language,
        professionDefinition.id,
        professionDefinition.title,
        professionDefinition.titleEn,
      )
    : worker.profession || text("Profissão por definir", "Profession not set");

  const levelLabel = assessment
    ? levelText(
        language,
        assessment.levelId,
        assessment.levelLabel,
        assessment.levelLabelEn,
      )
    : "—";

  const worklyId = formatWorklyId(worker);
  const eligibilityStatus =
    worker.work_eligibility_status ||
    (worker.id === "worker-1" ? "eligible" : "pending");
  const eligibilityLabel =
    eligibilityStatus === "eligible"
      ? text("Apto para trabalhar", "Eligible to work")
      : eligibilityStatus === "not_eligible"
        ? text("Não apto para trabalhar", "Not eligible to work")
        : text(
            "Aptidão a aguardar validação",
            "Eligibility pending verification",
          );

  const formation = workerFormationNodes(worker, language);
  const formationComplete =
    formation.length > 0 &&
    formation.every((node) => node.status === "verified");

  const formationRows = formation
    .map(
      (node) => `
        <tr>
          <td><strong>${esc(node.title)}</strong><div class="tiny">${esc(node.subtitle)}</div></td>
          <td class="right">${esc(statusLabel(node.status, language))}</td>
        </tr>`,
    )
    .join("");

  const workerProjects = projects
    .filter((project) => project.worker_ids.includes(worker.id))
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  const verifiedProjects = assessment?.verifiedProjects ?? 0;
  const verifiedHours = Math.round(assessment?.verifiedExperienceHours ?? 0);

  const projectRows = workerProjects.length
    ? workerProjects
        .map((project) => {
          const hours = verifiedAttendanceHours(
            worker.id,
            attendance,
            project.id,
          );
          const status =
            project.status === "completed"
              ? text("Concluída", "Completed")
              : text("Em curso", "In progress");
          return `
          <tr>
            <td>
              <strong>${esc(project.name)}</strong>
              <div class="tiny">${esc(project.client || "—")}</div>
            </td>
            <td>${esc(project.start_date)} → ${esc(project.end_date || "—")}</td>
            <td class="right">${hours} h</td>
            <td class="right">${esc(status)}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" class="muted">${esc(
        text("Sem Obras WORKLY registadas.", "No WORKLY projects recorded."),
      )}</td></tr>`;

  const competenceRows =
    assessment?.competencies
      .filter(
        (item) =>
          item.competency.relation === "essential" &&
          item.proficiency > 0,
      )
      .sort((a, b) => {
        if (a.competency.critical !== b.competency.critical)
          return a.competency.critical ? -1 : 1;
        return b.proficiency - a.proficiency;
      })
      .map(
        (item) => `
        <tr>
          <td>${esc(
            competencyTitle(
              language,
              item.competency.id,
              item.competency.title,
              item.competency.titleEn,
            ),
          )}${item.competency.critical ? ' <span class="core">CORE</span>' : ""}</td>
          <td class="right">${item.proficiency}/4 · ${esc(
            text(item.proficiencyLabel, item.proficiencyLabelEn),
          )}</td>
          <td class="right">${item.evidenceCount}</td>
        </tr>`,
      )
      .join("") || "";

  const qualificationRows = worker.certificates
    .filter(
      (item) =>
        item.status === "verified" &&
        (item.evidence_type === "qualification" ||
          (!item.evidence_type && item.kind !== "skill")),
    )
    .map(
      (item) => `
        <tr>
          <td><strong>${esc(item.name)}</strong></td>
          <td>${esc(item.issuer || "—")}</td>
          <td class="right">${esc(statusLabel(item.status, language))}</td>
        </tr>`,
    )
    .join("");

  const specialtyRows =
    specialties?.nodes
      .filter(
        (item) =>
          item.status === "verified" ||
          item.status === "recorded" ||
          item.status === "pending",
      )
      .map((item) => {
        const definition = specialtyCatalog.find(
          (candidate) => candidate.id === item.id,
        );
        const display = definition
          ? specialtyCopy(
              language,
              item.id,
              definition.title,
              definition.titleEn,
            )
          : item.title;
        return `
        <tr>
          <td>${esc(display)}</td>
          <td class="right">${esc(statusLabel(item.status, language))}</td>
        </tr>`;
      })
      .join("") || "";

  const complianceRows =
    compliance?.nodes
      .filter(
        (item) =>
          item.status === "verified" ||
          item.status === "recorded" ||
          item.status === "pending",
      )
      .map((item) => {
        const definition = complianceCatalog.find(
          (candidate) => candidate.id === item.id,
        );
        const display = definition
          ? complianceTitle(
              language,
              item.id,
              definition.title,
              definition.titleEn,
            )
          : item.title;
        return `
        <tr>
          <td>${esc(display)}</td>
          <td>${esc(scopeText(language, item.scope))}</td>
          <td class="right">${esc(statusLabel(item.status, language))}</td>
        </tr>`;
      })
      .join("") || "";

  const componentCards =
    assessment?.components
      .map(
        (item) => `
        <div class="component">
          <div class="component-name">${esc(text(item.label, item.labelEn))}</div>
          <div class="component-value">${item.points}/${item.maximum}</div>
        </div>`,
      )
      .join("") || "";

  const languages =
    worker.languages
      .map((item) => localizeDemoText(language, item))
      .join(" · ") || "—";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  @page { margin: 24px; }
  * { box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color:#17212b; margin:0; font-size:10.5px; line-height:1.4; }
  h1 { font-size:25px; margin:0 0 3px; }
  h2 { font-size:13px; margin:18px 0 7px; padding-bottom:5px; border-bottom:1px solid #dbe3ea; break-after:avoid; }
  .brand { font-size:10px; font-weight:800; letter-spacing:2.2px; color:#256da8; }
  .header { display:flex; justify-content:space-between; gap:18px; padding-bottom:14px; border-bottom:2px solid #256da8; }
  .header-main { min-width:0; flex:1; }
  .profession { font-size:13px; font-weight:700; }
  .workly-id { margin-top:4px; color:#607080; font-size:9px; letter-spacing:.5px; }
  .hero { text-align:right; min-width:135px; }
  .hero-level { font-size:28px; line-height:30px; color:#256da8; font-weight:800; }
  .hero-score { font-size:12px; font-weight:700; margin-top:2px; }
  .fit { display:inline-block; margin-top:6px; padding:3px 7px; border-radius:999px; border:1px solid #a9c7dc; color:#225f8d; font-size:8px; font-weight:700; }
  .identity-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px 14px; margin:12px 0 0; }
  .item { min-width:0; }
  .item-label { font-size:7.5px; text-transform:uppercase; letter-spacing:.7px; color:#748494; }
  .item-value { margin-top:2px; font-weight:700; }
  .snapshot { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; margin-top:10px; }
  .snapshot-card { border:1px solid #d9e4ec; border-radius:8px; padding:8px; background:#f8fbfd; }
  .snapshot-value { font-size:17px; color:#256da8; font-weight:800; }
  .snapshot-label { margin-top:2px; font-size:7.5px; color:#657787; text-transform:uppercase; letter-spacing:.4px; }
  .components { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; margin-top:8px; }
  .component { border:1px solid #e0e8ee; border-radius:7px; padding:7px; }
  .component-name { font-size:8px; color:#607080; }
  .component-value { margin-top:3px; font-size:13px; font-weight:800; }
  .section-status { float:right; font-size:8px; color:#607080; font-weight:700; }
  table { width:100%; border-collapse:collapse; break-inside:auto; }
  tr { break-inside:avoid; }
  th { text-align:left; font-size:7.5px; text-transform:uppercase; letter-spacing:.5px; color:#748494; border-bottom:1px solid #cfd9e2; padding:5px 4px; }
  td { border-bottom:1px solid #e7edf2; padding:6px 4px; vertical-align:top; }
  .right { text-align:right; white-space:nowrap; }
  .tiny { color:#71808d; font-size:8px; margin-top:1px; }
  .muted { color:#71808d; }
  .core { display:inline-block; margin-left:4px; padding:1px 4px; border-radius:999px; border:1px solid #b7d0e2; color:#256da8; font-size:6px; font-weight:800; vertical-align:middle; }
  .footer { margin-top:20px; padding-top:8px; border-top:1px solid #dbe3ea; color:#71808d; font-size:7.5px; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-main">
      <div class="brand">WORKLY</div>
      <h1>${esc(worker.name || text("Perfil Worker", "Worker Profile"))}</h1>
      <div class="profession">${esc(professionLabel)}</div>
      <div class="workly-id">${esc(text("WORKLY ID", "WORKLY ID"))}: ${esc(worklyId)}</div>
    </div>
    <div class="hero">
      <div class="item-label">${esc(text("Nível", "Level"))}</div>
      <div class="hero-level">${esc(levelLabel)}</div>
      <div class="hero-score">WORKLY VALUE · ${assessment?.score ?? 0}/100</div>
      <div class="fit">${esc(eligibilityLabel)}</div>
    </div>
  </div>

  <div class="identity-grid">
    <div class="item">
      <div class="item-label">${esc(text("Nacionalidade", "Nationality"))}</div>
      <div class="item-value">${esc(localizeDemoText(language, worker.nationality || worker.country || "—"))}</div>
    </div>
    <div class="item">
      <div class="item-label">${esc(text("Idiomas", "Languages"))}</div>
      <div class="item-value">${esc(languages)}</div>
    </div>
    <div class="item">
      <div class="item-label">${esc(text("Apto para trabalhar", "Fit to work"))}</div>
      <div class="item-value">${esc(eligibilityLabel)}</div>
    </div>
  </div>

  <div class="snapshot">
    <div class="snapshot-card">
      <div class="snapshot-value">${assessment?.score ?? 0}</div>
      <div class="snapshot-label">WORKLY VALUE / 100</div>
    </div>
    <div class="snapshot-card">
      <div class="snapshot-value">${verifiedHours} h</div>
      <div class="snapshot-label">${esc(text("Experiência WORKLY", "WORKLY experience"))}</div>
    </div>
    <div class="snapshot-card">
      <div class="snapshot-value">${verifiedProjects}</div>
      <div class="snapshot-label">${esc(text("Obras verificadas", "Verified projects"))}</div>
    </div>
    <div class="snapshot-card">
      <div class="snapshot-value">${assessment?.coreCoverage ?? 0}%</div>
      <div class="snapshot-label">${esc(text("Cobertura essencial", "Essential coverage"))}</div>
    </div>
  </div>

  <h2>
    ${esc(text("Formação de base", "Foundation education"))}
    <span class="section-status">${esc(
      formationComplete
        ? text("Nível I concluído", "Level I completed")
        : text("Nível I em progresso", "Level I in progress"),
    )}</span>
  </h2>
  <table><tbody>${formationRows}</tbody></table>

  <h2>${esc(text("Avaliação profissional", "Professional overview"))}</h2>
  <div class="components">${componentCards}</div>

  <h2>${esc(text("Histórico WORKLY em Obras", "WORKLY project history"))}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(text("Obra", "Project"))}</th>
        <th>${esc(text("Período", "Period"))}</th>
        <th class="right">${esc(text("Horas", "Hours"))}</th>
        <th class="right">${esc(text("Estado", "Status"))}</th>
      </tr>
    </thead>
    <tbody>${projectRows}</tbody>
  </table>

  <h2>${esc(text("Competências essenciais", "Essential competences"))}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(text("Competência", "Competence"))}</th>
        <th class="right">${esc(text("Nível", "Level"))}</th>
        <th class="right">${esc(text("Provas", "Evidence"))}</th>
      </tr>
    </thead>
    <tbody>${
      competenceRows ||
      `<tr><td colspan="3" class="muted">${esc(
        text("Sem competências avaliadas.", "No assessed competences."),
      )}</td></tr>`
    }</tbody>
  </table>

  <h2>${esc(text("Qualificações", "Qualifications"))}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(text("Qualificação", "Qualification"))}</th>
        <th>${esc(text("Entidade", "Issuer"))}</th>
        <th class="right">${esc(text("Estado", "Status"))}</th>
      </tr>
    </thead>
    <tbody>${
      qualificationRows ||
      `<tr><td colspan="3" class="muted">${esc(
        text("Sem qualificações verificadas.", "No verified qualifications."),
      )}</td></tr>`
    }</tbody>
  </table>

  <h2>${esc(text("Especializações", "Specialisations"))}</h2>
  <table><tbody>${
    specialtyRows ||
    `<tr><td class="muted">${esc(
      text("Sem especializações ativas.", "No active specialisations."),
    )}</td></tr>`
  }</tbody></table>

  <h2>${esc(text("Certificações extra", "Extra certifications"))}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(text("Certificação", "Requirement"))}</th>
        <th>${esc(text("Âmbito", "Scope"))}</th>
        <th class="right">${esc(text("Estado", "Status"))}</th>
      </tr>
    </thead>
    <tbody>${
      complianceRows ||
      `<tr><td colspan="3" class="muted">${esc(
        text("Sem certificações extra registadas.", "No compliance records."),
      )}</td></tr>`
    }</tbody>
  </table>

  <div class="footer">
    ${esc(
      text(
        "Documento gerado pela WORKLY. O WORKLY VALUE e os níveis I–V são classificações internas baseadas em evidência e não substituem qualificações, licenças ou autorizações legais.",
        "Generated by WORKLY. WORKLY VALUE and levels I–V are internal evidence-based classifications and do not replace legal qualifications, licences or authorisations.",
      ),
    )}
  </div>
</body>
</html>`;
}

export async function exportWorkerProfilePdf(
  worker: Worker,
  assessment: WorkerCompetencyAssessment | null,
  specialties: SpecialtyTree | null,
  compliance: ComplianceTree | null,
  projects: Project[],
  attendance: Attendance[],
  language: LanguageCode,
) {
  const html = buildHtml(
    worker,
    assessment,
    specialties,
    compliance,
    projects,
    attendance,
    language,
  );
  const result = await Print.printToFileAsync({ html });

  if (Platform.OS !== "web" && result.uri && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      UTI: ".pdf",
      dialogTitle: professionalText(
        language,
        "Partilhar perfil WORKLY",
        "Share WORKLY profile",
      ),
    });
  }
  return result;
}
