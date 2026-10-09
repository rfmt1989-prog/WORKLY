import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { LanguageCode, Worker } from "@/src/demo/types";
import type { WorkerCompetencyAssessment } from "./workerCompetencyEngine";
import type { SpecialtyTree, ComplianceTree } from "./workerCertificateTree";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabel(status: string, language: LanguageCode) {
  if (language === "pt") {
    if (status === "verified") return "Verificado";
    if (status === "pending") return "A validar";
    if (status === "recorded") return "Registado";
    if (status === "locked") return "Bloqueado";
    return "Disponível";
  }
  if (status === "verified") return "Verified";
  if (status === "pending") return "Pending";
  if (status === "recorded") return "Recorded";
  if (status === "locked") return "Locked";
  return "Available";
}

function buildHtml(
  worker: Worker,
  assessment: WorkerCompetencyAssessment | null,
  specialties: SpecialtyTree | null,
  compliance: ComplianceTree | null,
  language: LanguageCode,
) {
  const pt = language === "pt";
  const title = pt ? "Perfil Profissional WORKLY" : "WORKLY Professional Profile";
  const workHistory = [...(worker.work_experience || [])].sort((a, b) =>
    b.start_date.localeCompare(a.start_date),
  );

  const componentRows = assessment?.components
    .map(
      (item) => `
        <tr>
          <td>${esc(pt ? item.label : item.labelEn)}</td>
          <td style="text-align:right;font-weight:700">${item.points}/${item.maximum}</td>
        </tr>`,
    )
    .join("") || "";

  const competenceRows = assessment?.competencies
    .map(
      (item) => `
        <tr>
          <td>${esc(pt ? item.competency.title : item.competency.titleEn)}</td>
          <td>${item.proficiency}/4 · ${esc(pt ? item.proficiencyLabel : item.proficiencyLabelEn)}</td>
          <td>${item.evidenceCount}</td>
        </tr>`,
    )
    .join("") || "";

  const experienceRows = workHistory.length
    ? workHistory
        .map(
          (entry) => `
            <div class="experience">
              <div class="experience-head">
                <strong>${esc(entry.role)}</strong>
                <span class="badge">${esc(statusLabel(entry.status, language))}</span>
              </div>
              <div class="muted">${esc(entry.company)} · ${esc(entry.start_date)} → ${esc(entry.current ? (pt ? "Atual" : "Present") : entry.end_date || "—")}</div>
              <div class="muted">${esc([entry.location, entry.country].filter(Boolean).join(" · "))}</div>
              ${entry.hours ? `<div class="muted">${entry.hours} h</div>` : ""}
              ${entry.description ? `<p>${esc(entry.description)}</p>` : ""}
            </div>`,
        )
        .join("")
    : `<p class="muted">${pt ? "Sem experiência registada." : "No work experience recorded."}</p>`;

  const qualificationRows = worker.certificates
    .filter((item) => item.evidence_type === "qualification" || (!item.evidence_type && item.kind !== "skill"))
    .map(
      (item) => `
        <tr>
          <td>${esc(item.name)}</td>
          <td>${esc(item.issuer)}</td>
          <td>${esc(statusLabel(item.status, language))}</td>
        </tr>`,
    )
    .join("");

  const specialtyRows = specialties?.nodes
    .filter((item) => item.status !== "locked")
    .map(
      (item) => `
        <tr>
          <td>${esc(item.title)}</td>
          <td>${esc(statusLabel(item.status, language))}</td>
        </tr>`,
    )
    .join("") || "";

  const complianceRows = compliance?.nodes
    .map(
      (item) => `
        <tr>
          <td>${esc(item.title)}</td>
          <td>${esc(item.scope)}</td>
          <td>${esc(statusLabel(item.status, language))}</td>
        </tr>`,
    )
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
      <h1>${esc(worker.name || (pt ? "Perfil Worker" : "Worker Profile"))}</h1>
      <div class="level">${esc(worker.profession || (pt ? "Profissão por definir" : "Profession not set"))}</div>
      <div class="muted">${esc(title)}</div>
    </div>
    <div class="value">
      <div class="muted">WORKLY VALUE</div>
      <strong>${assessment?.score ?? 0}/100</strong>
      <div class="level">${esc(assessment ? (pt ? assessment.levelLabel : assessment.levelLabelEn) : (pt ? "Sem avaliação" : "Not assessed"))}</div>
    </div>
  </div>

  <div class="grid">
    <div><div class="item-label">${pt ? "País" : "Country"}</div><div class="item-value">${esc(worker.country || "—")}</div></div>
    <div><div class="item-label">${pt ? "Localização" : "Location"}</div><div class="item-value">${esc(worker.location || "—")}</div></div>
    <div><div class="item-label">${pt ? "Experiência calculada" : "Calculated experience"}</div><div class="item-value">${esc(worker.experience_years || 0)} ${pt ? "anos" : "years"}</div></div>
    <div><div class="item-label">${pt ? "Idiomas" : "Languages"}</div><div class="item-value">${esc(worker.languages.join(" · ") || "—")}</div></div>
    <div><div class="item-label">${pt ? "Telefone" : "Phone"}</div><div class="item-value">${esc(worker.phone || "—")}</div></div>
    <div><div class="item-label">Email</div><div class="item-value">${esc(worker.email || "—")}</div></div>
  </div>

  ${worker.bio ? `<h2>${pt ? "Apresentação" : "About"}</h2><p>${esc(worker.bio)}</p>` : ""}

  <h2>WORKLY VALUE</h2>
  <table><tbody>${componentRows || `<tr><td class="muted">${pt ? "Sem avaliação disponível." : "No assessment available."}</td></tr>`}</tbody></table>

  <h2>${pt ? "Experiência profissional" : "Professional experience"}</h2>
  ${experienceRows}

  <h2>${pt ? "Competências" : "Competences"}</h2>
  <table>
    <thead><tr><th>${pt ? "Competência" : "Competence"}</th><th>${pt ? "Nível" : "Level"}</th><th>${pt ? "Provas" : "Evidence"}</th></tr></thead>
    <tbody>${competenceRows || `<tr><td colspan="3" class="muted">${pt ? "Sem competências avaliadas." : "No assessed competences."}</td></tr>`}</tbody>
  </table>

  <h2>${pt ? "Qualificações" : "Qualifications"}</h2>
  <table>
    <thead><tr><th>${pt ? "Qualificação" : "Qualification"}</th><th>${pt ? "Entidade" : "Issuer"}</th><th>${pt ? "Estado" : "Status"}</th></tr></thead>
    <tbody>${qualificationRows || `<tr><td colspan="3" class="muted">${pt ? "Sem qualificações registadas." : "No qualifications recorded."}</td></tr>`}</tbody>
  </table>

  <h2>${pt ? "Especializações" : "Specialisations"}</h2>
  <table><tbody>${specialtyRows || `<tr><td class="muted">${pt ? "Sem especializações desbloqueadas." : "No unlocked specialisations."}</td></tr>`}</tbody></table>

  <h2>${pt ? "Conformidade e autorizações" : "Compliance and authorisations"}</h2>
  <table>
    <thead><tr><th>${pt ? "Requisito" : "Requirement"}</th><th>${pt ? "Âmbito" : "Scope"}</th><th>${pt ? "Estado" : "Status"}</th></tr></thead>
    <tbody>${complianceRows || `<tr><td colspan="3" class="muted">${pt ? "Sem registos de conformidade." : "No compliance records."}</td></tr>`}</tbody>
  </table>

  <div class="footer">
    ${pt
      ? "Documento gerado pela WORKLY. O WORKLY VALUE e os níveis são classificações internas e não substituem qualificações, licenças ou autorizações legais."
      : "Generated by WORKLY. WORKLY VALUE and levels are internal classifications and do not replace legal qualifications, licences or authorisations."}
  </div>
</body>
</html>`;
}

export async function exportWorkerProfilePdf(
  worker: Worker,
  assessment: WorkerCompetencyAssessment | null,
  specialties: SpecialtyTree | null,
  compliance: ComplianceTree | null,
  language: LanguageCode,
) {
  const html = buildHtml(worker, assessment, specialties, compliance, language);
  const result = await Print.printToFileAsync({ html });

  if (Platform.OS !== "web" && result.uri && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      UTI: ".pdf",
      dialogTitle: language === "pt" ? "Partilhar perfil WORKLY" : "Share WORKLY profile",
    });
  }
  return result;
}
