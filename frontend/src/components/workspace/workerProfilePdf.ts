import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { localeForLanguage } from "@/src/demo/fullUi";
import { levelText, professionTitle, professionalText } from "@/src/demo/professionalI18n";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { Attendance, LanguageCode, Project, Worker } from "@/src/demo/types";
import { findProfessionDefinition } from "./professionCatalog";
import { workerFormationNodes } from "./WorkerFormationPath";
import type { WorkerCompetencyAssessment } from "./workerCompetencyEngine";
import type { SpecialtyTree, ComplianceTree } from "./workerCertificateTree";
import { requirementStatus, requirementTitle, walletText } from "./walletI18n";

function esc(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildWorkerWalletHtml(worker: Worker, assessment: WorkerCompetencyAssessment | null, projects: Project[], attendance: Attendance[], language: LanguageCode) {
  const t = (key: Parameters<typeof walletText>[1]) => walletText(language, key);
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const locale = localeForLanguage(language);
  const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString(locale) : "—";
  const wallet = worker.professional_wallet;
  const profession = findProfessionDefinition(worker.profession);
  const professionLabel = profession ? professionTitle(language, profession.id, profession.title, profession.titleEn) : worker.profession || text("Profissão por definir", "Profession not set");
  const level = assessment ? levelText(language, assessment.levelId, assessment.levelLabel, assessment.levelLabelEn) : t("foundation");
  const enrolled = worker.registered_at ? Date.parse(worker.registered_at) : 0;
  const records = attendance.filter(item => item.worker_id === worker.id && Date.parse(item.check_in) >= enrolled);
  const hours = (projectId: string) => Math.round(records.filter(item => item.project_id === projectId && item.approval_status === "approved" && item.check_out).reduce((total, item) => total + Math.max(0, Math.min(16, (Date.parse(item.check_out!) - Date.parse(item.check_in)) / 3600000)), 0) * 10) / 10;
  const history = projects.filter(item => item.worker_ids.includes(worker.id)).sort((a, b) => b.start_date.localeCompare(a.start_date));
  const current = projects.find(item => item.id === wallet?.project_id);
  const formation = workerFormationNodes(worker, language).map((node, i) => `<tr><td>${esc(t(i === 0 ? "course" : "internship"))}</td><td>${esc(node.status === "verified" ? t("verified") : node.certificate ? t("review") : t("missing"))}</td></tr>`).join("");
  const projectRows = history.slice(0, 6).map(item => `<tr><td><strong>${esc(item.name)}</strong><div class="muted">${esc(item.location)}</div></td><td>${date(item.start_date)}</td><td>${hours(item.id)} h</td></tr>`).join("");
  const documentRows = wallet?.requirements.map(item => `<tr><td>${esc(requirementTitle(language, item))}</td><td>${esc(requirementStatus(language, item.status))}</td><td>${date(item.expires_at)}</td></tr>`).join("") || "";
  const session = wallet?.check_in_at ? `<p>${esc(t("session"))} ${esc(new Date(wallet.check_in_at).toLocaleString(locale))}</p>` : "";
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>WORKLY · ${esc(t("wallet"))}</title><style>
  @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#183047;font-size:10px;line-height:1.45;margin:0}.header{display:flex;justify-content:space-between;gap:22px;border-bottom:2px solid #326c9d;padding-bottom:16px}.brand{font-size:13px;font-weight:800;letter-spacing:3px;color:#286493}h1{font-size:25px;margin:8px 0 3px}h2{font-size:12px;margin:19px 0 7px;color:#286493}.muted{color:#678093;font-size:9px}.id{font-weight:700;letter-spacing:1px;margin-top:8px}.score{text-align:right;white-space:nowrap}.score strong{font-size:29px;color:#286493}.status{display:inline-block;border:1px solid #b9ccda;border-radius:6px;padding:6px 9px;font-size:10px;max-width:230px;white-space:normal;margin-top:8px}.details{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin:15px 0}.details span{display:block;color:#678093;font-size:8px;margin-bottom:3px}.metrics{display:flex;background:#f2f6f9;border-radius:7px;padding:11px;gap:20px}.metric{flex:1}.metric strong{font-size:17px;display:block}.metric small{color:#678093;font-size:9px}table{width:100%;border-collapse:collapse}th{text-align:left;color:#678093;font-size:8px;text-transform:uppercase;border-bottom:1px solid #c1d1dd;padding:6px 4px}td{border-bottom:1px solid #e1e9ef;padding:7px 4px;vertical-align:top}tr{break-inside:avoid}h2{break-after:avoid}.footer{margin-top:20px;border-top:1px solid #c8d6e1;padding-top:8px;font-size:8px;color:#678093}p{margin:7px 0}
  </style></head><body>
  <div class="header"><div><div class="brand">WORKLY</div><h1>${esc(worker.name || text("Nome por definir", "Name not set"))}</h1><div>${esc(professionLabel)}</div><div class="id">${esc(worker.workly_id || worker.id)}</div><div class="muted">${esc(t("wallet"))}</div></div><div class="score"><div class="muted">WORKLY VALUE</div><strong>${assessment?.score || 0}/100</strong><div>${esc(level)}</div><div class="status">${esc(t(wallet?.status || "pending"))}</div></div></div>
  <div class="details"><div><span>${esc(text("Nacionalidade", "Nationality"))}</span>${esc(localizeDemoText(language, worker.nationality || worker.country || "—"))}</div><div><span>${esc(text("Idiomas", "Languages"))}</span>${esc(worker.languages.map(item => localizeDemoText(language, item)).join(" · ") || "—")}</div><div><span>${esc(t("enrolled"))}</span>${date(worker.registered_at)}</div><div><span>${esc(t("activeSite"))}</span>${esc(current?.name || t("noSite"))}</div></div>
  <div class="metrics"><div class="metric"><strong>${wallet?.verified_hours || 0} h</strong><small>${esc(t("hours"))}</small></div><div class="metric"><strong>${wallet?.completed_projects || 0}</strong><small>${esc(t("works"))}</small></div><div class="metric"><strong>${wallet?.check_in_count || 0}</strong><small>${esc(t("checkins"))}</small></div></div>
  ${session}
  <h2>${esc(t("journey"))} · ${esc(t("foundation"))}</h2><table><tbody>${formation}</tbody></table><p class="muted">${esc(t("historyNote"))}</p>
  <h2>${esc(t("allWorks"))}</h2><table><thead><tr><th>${esc(text("Obra", "Project"))}</th><th>${esc(text("Início", "Start"))}</th><th>${esc(t("hours"))}</th></tr></thead><tbody>${projectRows || `<tr><td colspan="3">${esc(t("noSite"))}</td></tr>`}</tbody></table>
  <h2>${esc(t("documents"))} · ${wallet?.valid_count || 0}/${wallet?.total_count || 3}</h2><table><thead><tr><th>${esc(text("Documento", "Document"))}</th><th>${esc(text("Estado", "Status"))}</th><th>${esc(t("expiry"))}</th></tr></thead><tbody>${documentRows}</tbody></table>
  <div class="footer">${esc(t("contextNote"))}<br>${esc(text("Gerado em", "Generated on"))} ${esc(new Date().toLocaleString(locale))}</div></body></html>`;
}

export async function exportWorkerProfilePdf(worker: Worker, assessment: WorkerCompetencyAssessment | null, _specialties: SpecialtyTree | null, _compliance: ComplianceTree | null, projects: Project[], attendance: Attendance[], language: LanguageCode) {
  const html = buildWorkerWalletHtml(worker, assessment, projects, attendance, language);
  const result = await Print.printToFileAsync({ html });
  if (Platform.OS !== "web" && result.uri && await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", UTI: ".pdf", dialogTitle: walletText(language, "wallet") });
  }
  return result;
}
