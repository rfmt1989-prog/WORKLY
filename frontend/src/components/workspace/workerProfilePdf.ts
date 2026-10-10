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

function statusLabel(status: string, language: LanguageCode) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  if (status === "verified") return text("Verificado", "Verified");
  if (status === "pending") return text("A validar", "Pending");
  if (status === "recorded") return text("Registado", "Recorded");
  if (status === "locked") return text("Bloqueado", "Next step");
  return text("Disponível", "Available");
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
  const title = text("Perfil Profissional WORKLY", "WORKLY Professional Profile");
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
    : text("Não avaliada", "Not assessed");

  const workHistory = projects
    .filter((project) => project.worker_ids.includes(worker.id))
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  const componentRows =
    assessment?.components
      .map(
        (item) => `
        <tr>
          <td>${esc(text(item.label, item.labelEn))}</td>
          <td style="text-align:right;font-weight:700">${item.points}/${item.maximum}</td>
        </tr>`,
      )
      .join("") || "";

  const competenceRows =
    assessment?.competencies
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
          )}</td>
          <td>${item.proficiency}/4 · ${esc(
            text(item.proficiencyLabel, item.proficiencyLabelEn),
          )}</td>
          <td>${item.evidenceCount}</td>
        </tr>`,
      )
      .join("") || "";

  const experienceRows = workHistory.length
    ? workHistory
        .map((project) => {
          const hours = verifiedAttendanceHours(
            worker.id,
            attendance,
            project.id,
          );
          const projectStatus =
            project.status === "completed"
              ? text("Concluída", "Completed")
              : text("Em curso", "In progress");
          return `
            <div class="experience">
              <div class="experience-head">
                <strong>${esc(project.name)}</strong>
                <span class="badge">${esc(projectStatus)}</span>
              </div>
              <div class="muted">${esc(project.client || "—")} · ${esc(
                project.location || "—",
              )}</div>
              <div class="muted">${esc(project.start_date)} → ${esc(
                project.end_date || "—",
              )} · ${hours} h WORKLY</div>
              ${project.description ? `<p>${esc(project.description)}</p>` : ""}
            </div>`;
        })
        .join("")
    : `<p class="muted">${esc(
        text("Sem Obras WORKLY registadas.", "No WORKLY projects recorded."),
      )}</p>`;

  const qualificationRows = worker.certificates
    .filter(
      (item) =>
        item.evidence_type === "qualification" ||
        (!item.evidence_type && item.kind !== "skill"),
    )
    .map(
      (item) => `
        <tr>
          <td>${esc(item.name)}</td>
          <td>${esc(item.issuer)}</td>
          <td>${esc(statusLabel(item.status, language))}</td>
        </tr>`,
    )
    .join("");

  const specialtyRows =
    specialties?.nodes
      .filter((item) => item.status !== "locked")
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
          <td>${esc(statusLabel(item.status, language))}</td>
        </tr>`;
      })
      .join("") || "";

  const complianceRows =
    compliance?.nodes
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
          <td>${esc(statusLabel(item.status, language))}</td>
        </tr>`;
      })
      .join("") || "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  @page { margin: 28px; }
  body { font-family: Arial, Helvetica, sans-serif; color:#17212b; margin:0; font-size:11px; line-height:1.45; }
  h1 { font-size:26px; margin:0 0 4px; }
  h2 { font-size:15px; margin:22px 0 8px; padding-bottom:5px; border-bottom:1px solid #dbe3ea; }
  .brand { font-size:11px; font-weight:700; letter-spacing:2px; color:#256da8; }
  .header { display:flex; justify-content:space-between; gap:18px; padding-bottom:16px; border-bottom:2px solid #256da8; }
  .value { text-align:right; }
  .value strong { font-size:28px; color:#256da8; }
  .level { font-size:13px; font-weight:700; }
  .muted { color:#607080; }
  .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px 18px; margin-top:10px; }
  .item-label { font-size:9px; text-transform:uppercase; letter-spacing:.6px; color:#748494; }
  .item-value { font-weight:600; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; font-size:9px; text-transform:uppercase; letter-spacing:.5px; color:#748494; border-bottom:1px solid #cfd9e2; padding:5px 4px; }
  td { border-bottom:1px solid #e7edf2; padding:6px 4px; vertical-align:top; }
  .experience { border-left:3px solid #8eb7d8; padding:7px 10px; margin-bottom:8px; background:#f7fafc; }
  .experience-head { display:flex; justify-content:space-between; gap:12px; }
  .badge { font-size:9px; color:#256da8; font-weight:700; }
  .footer { margin-top:24px; padding-top:8px; border-top:1px solid #dbe3ea; color:#71808d; font-size:8px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">WORKLY</div>
      <h1>${esc(worker.name || text("Perfil Worker", "Worker Profile"))}</h1>
      <div class="level">${esc(professionLabel)}</div>
      <div class="muted">${esc(title)}</div>
    </div>
    <div class="value">
      <div class="muted">WORKLY VALUE</div>
      <strong>${assessment?.score ?? 0}/100</strong>
      <div class="level">${esc(levelLabel)}</div>
    </div>
  </div>

  <div class="grid">
    <div><div class="item-label">${esc(text("País", "Country"))}</div><div class="item-value">${esc(worker.country || "—")}</div></div>
    <div><div class="item-label">${esc(text("Localização", "Location"))}</div><div class="item-value">${esc(worker.location || "—")}</div></div>
    <div><div class="item-label">${esc(text("Experiência WORKLY", "WORKLY experience"))}</div><div class="item-value">${esc(assessment?.verifiedExperienceHours || 0)} h</div></div>
    <div><div class="item-label">${esc(text("Idiomas", "Languages"))}</div><div class="item-value">${esc(worker.languages.map((item) => localizeDemoText(language, item)).join(" · ") || "—")}</div></div>
    <div><div class="item-label">${esc(text("Telefone", "Phone"))}</div><div class="item-value">${esc(worker.phone || "—")}</div></div>
    <div><div class="item-label">Email</div><div class="item-value">${esc(worker.email || "—")}</div></div>
  </div>

  ${worker.bio ? `<h2>${esc(text("Apresentação", "About"))}</h2><p>${esc(worker.bio)}</p>` : ""}

  <h2>WORKLY VALUE</h2>
  <table><tbody>${componentRows || `<tr><td class="muted">${esc(text("Sem avaliação disponível.", "No assessment available."))}</td></tr>`}</tbody></table>

  <h2>${esc(text("Histórico WORKLY em Obras", "WORKLY project history"))}</h2>
  ${experienceRows}

  <h2>${esc(text("Competências", "Competences"))}</h2>
  <table>
    <thead><tr><th>${esc(text("Competência", "Competence"))}</th><th>${esc(text("Nível", "Level"))}</th><th>${esc(text("Provas", "Evidence"))}</th></tr></thead>
    <tbody>${competenceRows || `<tr><td colspan="3" class="muted">${esc(text("Sem competências avaliadas.", "No assessed competences."))}</td></tr>`}</tbody>
  </table>

  <h2>${esc(text("Qualificações", "Qualifications"))}</h2>
  <table>
    <thead><tr><th>${esc(text("Qualificação", "Qualification"))}</th><th>${esc(text("Entidade", "Issuer"))}</th><th>${esc(text("Estado", "Status"))}</th></tr></thead>
    <tbody>${qualificationRows || `<tr><td colspan="3" class="muted">${esc(text("Sem qualificações registadas.", "No qualifications recorded."))}</td></tr>`}</tbody>
  </table>

  <h2>${esc(text("Especializações", "Specialisations"))}</h2>
  <table><tbody>${specialtyRows || `<tr><td class="muted">${esc(text("Sem especializações desbloqueadas.", "No unlocked specialisations."))}</td></tr>`}</tbody></table>

  <h2>${esc(text("Conformidade e autorizações", "Compliance and authorisations"))}</h2>
  <table>
    <thead><tr><th>${esc(text("Requisito", "Requirement"))}</th><th>${esc(text("Âmbito", "Scope"))}</th><th>${esc(text("Estado", "Status"))}</th></tr></thead>
    <tbody>${complianceRows || `<tr><td colspan="3" class="muted">${esc(text("Sem registos de conformidade.", "No compliance records."))}</td></tr>`}</tbody>
  </table>

  <div class="footer">
    ${esc(
      text(
        "Documento gerado pela WORKLY. O WORKLY VALUE e os níveis são classificações internas e não substituem qualificações, licenças ou autorizações legais.",
        "Generated by WORKLY. WORKLY VALUE and levels are internal classifications and do not replace legal qualifications, licences or authorisations.",
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
