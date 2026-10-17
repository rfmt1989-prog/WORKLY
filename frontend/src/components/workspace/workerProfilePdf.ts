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


function verificationUrl(worklyId: string) {
  const configured = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (Platform.OS === "web" && typeof globalThis !== "undefined") {
    const origin = (globalThis as typeof globalThis & {
      location?: { origin?: string };
    }).location?.origin;
    if (origin) return `${origin}/verify?worklyId=${encodeURIComponent(worklyId)}`;
  }
  const base = configured || "https://workly-demo.vercel.app";
  return `${base}/verify?worklyId=${encodeURIComponent(worklyId)}`;
}

function qrImageUrl(target: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=png&qzone=4&data=${encodeURIComponent(target)}`;
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
  const avatar = worker.avatar?.trim() || "";
  // Only embed data images or HTTPS URLs; never embed arbitrary worker input as HTML.
  const avatarUrl = /^(data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s"'<>]+)$/i.test(avatar) ? avatar : "";
  const issueDate = new Date().toLocaleDateString(language === "pt" ? "pt-PT" : "en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const verifyUrl = verificationUrl(worklyId);
  const qrUrl = qrImageUrl(verifyUrl);
  const eligibilityStatus =
    worker.work_eligibility_status ||
    "pending";
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

  const proofRows =
    assessment?.competencies
      .flatMap((item) =>
        item.evidence
          .filter((evidence) => Boolean(evidence.project_id))
          .map((evidence) => ({ item, evidence })),
      )
      .filter(
        (entry, index, all) =>
          all.findIndex((candidate) => candidate.evidence.id === entry.evidence.id) === index,
      )
      .map(({ item, evidence }) => {
        const project = projects.find((candidate) => candidate.id === evidence.project_id);
        const approvedHours = project
          ? verifiedAttendanceHours(worker.id, attendance, project.id)
          : 0;
        const competence = competencyTitle(
          language,
          item.competency.id,
          item.competency.title,
          item.competency.titleEn,
        );
        return `
        <tr>
          <td><strong>${esc(competence)}</strong></td>
          <td>${esc(project?.name || evidence.context || "—")}</td>
          <td class="right">${approvedHours} h</td>
          <td class="right">${esc(statusLabel(evidence.status, language))}</td>
        </tr>`;
      })
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
  h2 { font-size:12px; margin:20px 0 8px; padding-bottom:7px; border-bottom:1px solid #DDE7EA; break-after:avoid; letter-spacing:.2px; }
  .report-intro { margin-top:8px; display:flex; justify-content:space-between; color:#77909B; font-size:8px; letter-spacing:.6px; }
  .section-hint { font-size:8px; line-height:12px; color:#8799A2; margin-bottom:6px; }
  .brand { font-size:12px; font-weight:900; letter-spacing:3px; color:#4B7E91; }
  .header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding-bottom:17px; border-bottom:2px solid #4B7E91; }
  .identity-title { display:flex; align-items:center; gap:13px; min-width:0; }
  .avatar { height:76px; width:76px; border-radius:14px; border:1px solid #C6D9E1; object-fit:cover; background:#EAF2F4; }
  .avatar-empty { height:76px; width:76px; border-radius:14px; border:1px solid #C6D9E1; background:#EAF2F4; color:#8197A2; display:flex; flex-direction:column; justify-content:center; align-items:center; font-size:8px; text-align:center; }
  .avatar-mark { font-size:27px; font-weight:900; line-height:29px; }
  .document-caption { color:#6C8590; font-size:8px; text-transform:uppercase; letter-spacing:1.3px; margin:3px 0 5px; }
  .issued { margin-top:6px; color:#738891; font-size:8px; }
  .summary { margin-top:12px; padding:10px 12px; background:#F1F6F7; border-left:3px solid #4B7E91; border-radius:0 8px 8px 0; }
  .summary-label { font-size:7px; font-weight:800; letter-spacing:1px; color:#4B7E91; text-transform:uppercase; }
  .summary-copy { font-size:10px; line-height:1.5; color:#334C58; margin-top:3px; }
  .header-main { min-width:0; flex:1; }
  .profession { font-size:13px; font-weight:700; }
  .workly-id { margin-top:4px; color:#607080; font-size:9px; letter-spacing:.5px; }
  .hero { display:flex; align-items:center; justify-content:flex-end; gap:12px; min-width:230px; }
  .hero-copy { text-align:right; flex:1; }
  .qr-wrap { width:82px; text-align:center; }
  .qr { display:block; width:78px; height:78px; border:1px solid #d7e2ea; padding:3px; background:#fff; }
  .qr-label { margin-top:3px; font-size:6.5px; line-height:9px; color:#657787; text-transform:uppercase; letter-spacing:.45px; }
  .hero-level { font-size:24px; line-height:28px; color:#345F72; font-weight:850; }
  .hero-score { font-size:12px; font-weight:700; margin-top:2px; }
  .fit { display:inline-block; margin-top:6px; padding:4px 7px; border-radius:5px; border:1px solid #C6D9E1; background:#F3F7F8; color:#536E7B; font-size:8px; font-weight:700; }
  .identity-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px 14px; margin:12px 0 0; }
  .item { min-width:0; }
  .item-label { font-size:7.5px; text-transform:uppercase; letter-spacing:.7px; color:#748494; }
  .item-value { margin-top:2px; font-weight:700; }
  .snapshot { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; margin-top:10px; }
  .snapshot-card { border:1px solid #D6E5E9; border-radius:8px; padding:9px; background:#F0F6F7; }
  .snapshot-value { font-size:18px; color:#345F72; font-weight:900; }
  .snapshot-label { margin-top:2px; font-size:7.5px; color:#657787; text-transform:uppercase; letter-spacing:.4px; }
  .components { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; margin-top:8px; }
  .component { border:1px solid #DDE8EB; border-radius:7px; padding:7px; background:#FBFCFD; }
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
  .core { display:inline-block; margin-left:4px; padding:1px 4px; border-radius:4px; border:1px solid #B7D0D6; color:#4B7E91; font-size:6px; font-weight:800; vertical-align:middle; }
  .footer { margin-top:20px; padding-top:8px; border-top:1px solid #dbe3ea; color:#71808d; font-size:7.5px; }
</style>
</head>
<body>
  <div class="header">
    <div class="identity-title">
      ${avatarUrl
        ? `<img class="avatar" src="${esc(avatarUrl)}" alt="${esc(text("Fotografia profissional", "Professional photograph"))}" />`
        : `<div class="avatar-empty"><div class="avatar-mark">W</div>${esc(text("Sem fotografia", "No photo"))}</div>`}
      <div class="header-main">
        <div class="brand">WORKLY</div>
        <div class="document-caption">${esc(text("Passaporte profissional", "Professional passport"))}</div>
        <h1>${esc(worker.name || text("Perfil Worker", "Worker Profile"))}</h1>
        <div class="profession">${esc(professionLabel)}</div>
        <div class="workly-id">${esc(text("WORKLY ID", "WORKLY ID"))}: ${esc(worklyId)}</div>
        <div class="issued">${esc(text("Emitido em", "Issued on"))}: ${esc(issueDate)}</div>
      </div>
    </div>
    <div class="hero">
      <div class="hero-copy">
        <div class="item-label">${esc(text("Nível", "Level"))}</div>
        <div class="hero-level">${esc(levelLabel)}</div>
        <div class="hero-score">WORKLY VALUE · ${assessment?.score ?? 0}/100</div>
        <div class="fit">${esc(eligibilityLabel)}</div>
      </div>
      <div class="qr-wrap">
        <img class="qr" src="${esc(qrUrl)}" alt="WORKLY verification QR" />
        <div class="qr-label">${esc(text("Consultar WORKLY ID", "Look up WORKLY ID"))}</div>
      </div>
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
      <div class="item-label">${esc(text("Localização profissional", "Work location"))}</div>
      <div class="item-value">${esc(worker.location || "—")}</div>
    </div>
  </div>

  ${worker.bio?.trim()
    ? `<div class="summary"><div class="summary-label">${esc(text("Resumo profissional", "Professional summary"))}</div><div class="summary-copy">${esc(worker.bio.trim().slice(0, 460))}</div></div>`
    : ""}
  <div class="report-intro"><span>${esc(text("INDICADORES PROFISSIONAIS", "PROFESSIONAL INDICATORS"))}</span><span>${esc(text("Apenas evidências confirmadas contam para a progressão", "Only confirmed evidence counts toward progression"))}</span></div>
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

  <h2>PROOF OF WORK</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(text("Competência", "Competence"))}</th>
        <th>${esc(text("Obra", "Project"))}</th>
        <th class="right">${esc(text("Horas", "Hours"))}</th>
        <th class="right">${esc(text("Validação", "Validation"))}</th>
      </tr>
    </thead>
    <tbody>${
      proofRows ||
      `<tr><td colspan="4" class="muted">${esc(
        text(
          "Ainda não existem competências ligadas a Obras WORKLY.",
          "No competences are linked to WORKLY projects yet.",
        ),
      )}</td></tr>`
    }</tbody>
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
    <div><strong>${esc(text("WORKLY ID", "WORKLY ID"))}: ${esc(worklyId)}</strong></div>
    <div>${esc(text("Consulta do perfil", "Profile lookup"))}: ${esc(verifyUrl)}</div>
    <div style="margin-top:4px;">${esc(
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
