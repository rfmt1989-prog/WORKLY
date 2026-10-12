import type { LanguageCode, WalletRequirement } from "@/src/demo/types";

const languages: LanguageCode[] = ["pt", "en", "fr", "es", "ro", "de", "nl"];
const rows = {
  wallet: ["Carteira profissional", "Professional wallet", "Carte professionnelle", "Cartera profesional", "Carte profesională", "Berufsausweis", "Professionele pas"],
  identity: ["Uma identidade. Todo o teu percurso.", "One identity. Your complete journey.", "Une identité. Tout votre parcours.", "Una identidad. Toda tu trayectoria.", "O identitate. Întregul tău parcurs.", "Eine Identität. Dein gesamter Werdegang.", "Eén identiteit. Je volledige loopbaan."],
  journey: ["Percurso Workly", "Workly journey", "Parcours Workly", "Trayectoria Workly", "Parcurs Workly", "Workly Laufbahn", "Workly loopbaan"],
  foundation: ["Aprendizagem", "Apprenticeship", "Apprentissage", "Aprendizaje", "Ucenicie", "Ausbildung", "Opleiding"],
  course: ["Curso profissional / tecnológico", "Professional / technological course", "Cours professionnel / technologique", "Curso profesional / tecnológico", "Curs profesional / tehnologic", "Beruflicher / technischer Kurs", "Beroepsgerichte / technische opleiding"],
  internship: ["Estágio", "Internship", "Stage", "Prácticas", "Stagiu", "Praktikum", "Stage"],
  level: ["Nível Workly", "Workly level", "Niveau Workly", "Nivel Workly", "Nivel Workly", "Workly Niveau", "Workly niveau"],
  hours: ["Horas aprovadas", "Approved hours", "Heures approuvées", "Horas aprobadas", "Ore aprobate", "Freigegebene Stunden", "Goedgekeurde uren"],
  works: ["Obras concluídas", "Completed projects", "Chantiers terminés", "Obras finalizadas", "Șantiere finalizate", "Abgeschlossene Projekte", "Afgeronde projecten"],
  checkins: ["Check-ins", "Check-ins", "Pointages", "Fichajes", "Pontaje", "Anmeldungen", "Registraties"],
  pendingHours: ["Horas a validar", "Hours awaiting approval", "Heures à valider", "Horas por validar", "Ore de validat", "Stunden zur Freigabe", "Uren ter goedkeuring"],
  historyNote: ["A experiência começa após a inscrição e cresce com horas aprovadas nas obras.", "Experience starts after registration and grows with approved project hours.", "L’expérience commence après l’inscription et progresse avec les heures approuvées sur les chantiers.", "La experiencia comienza tras el registro y crece con las horas aprobadas en las obras.", "Experiența începe după înscriere și crește prin orele aprobate pe șantiere.", "Die Erfahrung beginnt nach der Anmeldung und wächst mit freigegebenen Projektstunden.", "Ervaring begint na registratie en groeit met goedgekeurde projecturen."],
  activeSite: ["Obra e check-in", "Project and check-in", "Chantier et pointage", "Obra y fichaje", "Șantier și pontaj", "Projekt und Anmeldung", "Project en registratie"],
  noSite: ["Sem obra atribuída", "No assigned project", "Aucun chantier attribué", "Sin obra asignada", "Niciun șantier atribuit", "Kein Projekt zugewiesen", "Geen project toegewezen"],
  noSchedule: ["Horário por definir", "Schedule not set", "Horaires à définir", "Horario por definir", "Program de stabilit", "Zeitplan noch offen", "Rooster nog niet ingesteld"],
  assignedNote: ["A empresa atribui a obra. As presenças e as horas ficam ligadas a essa obra.", "The company assigns the project. Attendance and hours are linked to that project.", "L’entreprise attribue le chantier. Les présences et les heures y sont rattachées.", "La empresa asigna la obra. Las presencias y las horas quedan vinculadas a ella.", "Compania atribuie șantierul. Prezențele și orele sunt legate de acesta.", "Das Unternehmen weist das Projekt zu. Anwesenheit und Stunden werden dort erfasst.", "Het bedrijf wijst het project toe. Aanwezigheid en uren worden daaraan gekoppeld."],
  session: ["Em obra desde", "On site since", "Sur chantier depuis", "En obra desde", "Pe șantier din", "Vor Ort seit", "Op locatie sinds"],
  openCheckin: ["Abrir check-in", "Open check-in", "Ouvrir le pointage", "Abrir fichaje", "Deschide pontajul", "Anmeldung öffnen", "Registratie openen"],
  checkout: ["Ver sessão / check-out", "View session / check out", "Voir la session / sortie", "Ver sesión / salida", "Vezi sesiunea / ieșire", "Sitzung / Abmeldung", "Sessie / uitchecken"],
  documents: ["Documentos para trabalhar", "Documents for work", "Documents pour travailler", "Documentos para trabajar", "Documente pentru muncă", "Dokumente für die Arbeit", "Documenten voor werk"],
  confirmed: ["validados", "verified", "validés", "validados", "validate", "geprüft", "geverifieerd"],
  pending: ["Aptidão por validar", "Eligibility awaiting verification", "Aptitude à valider", "Aptitud por validar", "Aptitudine de validat", "Eignung noch zu prüfen", "Geschiktheid te controleren"],
  ready: ["Documentos base validados", "Base documents verified", "Documents de base validés", "Documentos básicos validados", "Documente de bază validate", "Grunddokumente geprüft", "Basisdocumenten geverifieerd"],
  fit: ["Apto para esta obra", "Eligible for this project", "Apte pour ce chantier", "Apto para esta obra", "Apt pentru acest șantier", "Für dieses Projekt geeignet", "Geschikt voor dit project"],
  blocked: ["Acesso à obra bloqueado", "Site access blocked", "Accès au chantier bloqué", "Acceso a obra bloqueado", "Accesul pe șantier blocat", "Zugang zur Baustelle gesperrt", "Toegang tot locatie geblokkeerd"],
  contextNote: ["Os requisitos dependem do país, da profissão e da obra. A empresa confirma os documentos e o acesso.", "Requirements depend on country, profession and project. The company verifies documents and access.", "Les exigences dépendent du pays, du métier et du chantier. L’entreprise valide les documents et l’accès.", "Los requisitos dependen del país, la profesión y la obra. La empresa valida los documentos y el acceso.", "Cerințele depind de țară, profesie și șantier. Compania validează documentele și accesul.", "Anforderungen hängen von Land, Beruf und Projekt ab. Das Unternehmen prüft Dokumente und Zugang.", "Eisen hangen af van land, beroep en project. Het bedrijf controleert documenten en toegang."],
  reviewNote: ["Carregar um ficheiro não confirma a aptidão. É necessária validação.", "Uploading a file does not confirm eligibility. Verification is required.", "Importer un fichier ne confirme pas l’aptitude. Une validation est nécessaire.", "Subir un archivo no confirma la aptitud. Se requiere validación.", "Încărcarea unui fișier nu confirmă aptitudinea. Este necesară validarea.", "Ein Upload bestätigt keine Eignung. Eine Prüfung ist erforderlich.", "Een upload bevestigt geen geschiktheid. Verificatie is vereist."],
  missing: ["Em falta", "Missing", "Manquant", "Falta", "Lipsește", "Fehlt", "Ontbreekt"],
  review: ["A validar", "Awaiting verification", "À valider", "Por validar", "De validat", "Zur Prüfung", "Te verifiëren"],
  verified: ["Validado", "Verified", "Validé", "Validado", "Validat", "Geprüft", "Geverifieerd"],
  expiring: ["A renovar em breve", "Renew soon", "À renouveler bientôt", "Renovar pronto", "De reînnoit curând", "Bald erneuern", "Binnenkort vernieuwen"],
  expired: ["Expirado", "Expired", "Expiré", "Caducado", "Expirat", "Abgelaufen", "Verlopen"],
  rejected: ["Rejeitado", "Rejected", "Rejeté", "Rechazado", "Respins", "Abgelehnt", "Afgewezen"],
  invalid: ["Inválido", "Invalid", "Invalide", "Inválido", "Invalid", "Ungültig", "Ongeldig"],
  conditional: ["Condições por confirmar", "Restrictions need review", "Restrictions à confirmer", "Condiciones por confirmar", "Condiții de confirmat", "Einschränkungen prüfen", "Beperkingen te controleren"],
  unfit: ["Inapto na ficha médica", "Medical report: unfit", "Fiche médicale : inapte", "Ficha médica: no apto", "Fișă medicală: inapt", "Ärztlicher Befund: ungeeignet", "Medisch rapport: ongeschikt"],
  base: ["Documento base", "Base document", "Document de base", "Documento básico", "Document de bază", "Grunddokument", "Basisdocument"],
  site: ["Requisito da obra", "Site requirement", "Exigence du chantier", "Requisito de obra", "Cerință de șantier", "Projektanforderung", "Projectvereiste"],
  identityDoc: ["Cartão de cidadão / passaporte", "Citizen card / passport", "Carte d’identité / passeport", "Documento de identidad / pasaporte", "Carte de identitate / pașaport", "Personalausweis / Reisepass", "Identiteitskaart / paspoort"],
  insuranceDoc: ["Seguro de acidentes de trabalho", "Work accident insurance", "Assurance accidents du travail", "Seguro de accidentes laborales", "Asigurare pentru accidente de muncă", "Arbeitsunfallversicherung", "Arbeidsongevallenverzekering"],
  medicalDoc: ["Ficha de aptidão médica", "Medical fitness report", "Fiche d’aptitude médicale", "Ficha de aptitud médica", "Fișă de aptitudine medicală", "Ärztlicher Eignungsnachweis", "Medische geschiktheidsverklaring"],
  safetyDoc: ["Formação / acolhimento de segurança", "Safety training / induction", "Formation / accueil sécurité", "Formación / acogida de seguridad", "Instruire / primire de siguranță", "Sicherheitsschulung / Einweisung", "Veiligheidstraining / introductie"],
  technicalDoc: ["Qualificação técnica", "Technical qualification", "Qualification technique", "Cualificación técnica", "Calificare tehnică", "Technische Qualifikation", "Technische kwalificatie"],
  permitDoc: ["Direito ao trabalho no país", "Right to work in the country", "Droit de travailler dans le pays", "Derecho a trabajar en el país", "Drept de muncă în țară", "Arbeitsberechtigung im Land", "Recht om in het land te werken"],
  employmentDoc: ["Vínculo laboral / atividade", "Employment / self-employment", "Emploi / activité indépendante", "Vínculo laboral / actividad", "Raport de muncă / activitate", "Arbeitsverhältnis / Tätigkeit", "Arbeidsrelatie / zelfstandige activiteit"],
  legalDoc: ["Documentação administrativa", "Administrative documents", "Documents administratifs", "Documentación administrativa", "Documente administrative", "Verwaltungsdokumente", "Administratieve documenten"],
  licenseDoc: ["Licença / autorização", "Licence / authorisation", "Licence / autorisation", "Licencia / autorización", "Licență / autorizație", "Lizenz / Genehmigung", "Licentie / toestemming"],
  openFile: ["Abrir documento", "Open document", "Ouvrir le document", "Abrir documento", "Deschide documentul", "Dokument öffnen", "Document openen"],
  addDocument: ["Carregar documento", "Upload document", "Importer un document", "Subir documento", "Încarcă documentul", "Dokument hochladen", "Document uploaden"],
  addCertificate: ["Adicionar no percurso", "Add to journey", "Ajouter au parcours", "Añadir a trayectoria", "Adaugă în parcurs", "Zur Laufbahn hinzufügen", "Aan loopbaan toevoegen"],
  allDocs: ["Ver todos os documentos", "View all documents", "Voir tous les documents", "Ver todos los documentos", "Vezi toate documentele", "Alle Dokumente anzeigen", "Alle documenten bekijken"],
  allWorks: ["Ver obras e histórico", "View projects and history", "Voir chantiers et historique", "Ver obras e historial", "Vezi șantiere și istoric", "Projekte und Verlauf anzeigen", "Projecten en historie bekijken"],
  expiry: ["Validade", "Expiry", "Validité", "Validez", "Valabilitate", "Gültigkeit", "Geldigheid"],
  enrolled: ["Na Workly desde", "On Workly since", "Sur Workly depuis", "En Workly desde", "În Workly din", "Bei Workly seit", "Op Workly sinds"],
  medicalNote: ["Ficha emitida pelo médico do trabalho. As condições de aptidão precisam de confirmação para a função.", "Report issued by the occupational physician. Fitness restrictions require review for the role.", "Fiche émise par le médecin du travail. Les restrictions d’aptitude doivent être examinées pour le poste.", "Ficha emitida por el médico del trabajo. Las condiciones de aptitud requieren revisión para el puesto.", "Fișă emisă de medicul de medicina muncii. Condițiile de aptitudine trebuie verificate pentru funcție.", "Nachweis vom Betriebsarzt. Einschränkungen müssen für die Tätigkeit geprüft werden.", "Verklaring van de bedrijfsarts. Beperkingen moeten voor de functie worden beoordeeld."],
  validateDoc: ["Validar documento", "Verify document", "Valider le document", "Validar documento", "Validează documentul", "Dokument prüfen", "Document verifiëren"],
  rejectDoc: ["Rejeitar documento", "Reject document", "Rejeter le document", "Rechazar documento", "Respinge documentul", "Dokument ablehnen", "Document afwijzen"],
  medicalResult: ["Resultado indicado na ficha médica", "Result stated in the medical report", "Résultat indiqué sur la fiche médicale", "Resultado indicado en la ficha médica", "Rezultatul indicat în fișa medicală", "Ergebnis im ärztlichen Nachweis", "Resultaat in de medische verklaring"],
  medicalFit: ["Apto", "Fit", "Apte", "Apto", "Apt", "Geeignet", "Geschikt"],
  medicalConditional: ["Apto condicionado", "Fit with restrictions", "Apte avec restrictions", "Apto con restricciones", "Apt condiționat", "Mit Einschränkungen geeignet", "Geschikt met beperkingen"],
  medicalUnfit: ["Inapto", "Unfit", "Inapte", "No apto", "Inapt", "Ungeeignet", "Ongeschikt"],
  saved: ["Validação guardada", "Verification saved", "Validation enregistrée", "Validación guardada", "Validare salvată", "Prüfung gespeichert", "Verificatie opgeslagen"],
  failed: ["Não foi possível guardar a validação.", "Could not save verification.", "Impossible d’enregistrer la validation.", "No se pudo guardar la validación.", "Validarea nu a putut fi salvată.", "Die Prüfung konnte nicht gespeichert werden.", "Verificatie kon niet worden opgeslagen."],
  fileFailed: ["Não foi possível abrir o documento.", "Could not open document.", "Impossible d’ouvrir le document.", "No se pudo abrir el documento.", "Documentul nu a putut fi deschis.", "Das Dokument konnte nicht geöffnet werden.", "Document kon niet worden geopend."],
  chooseProfession: ["Escolhe a tua profissão para iniciar o percurso.", "Choose your profession to start your journey.", "Choisissez votre métier pour commencer le parcours.", "Elige tu profesión para iniciar la trayectoria.", "Alege profesia pentru a începe parcursul.", "Wähle deinen Beruf, um die Laufbahn zu starten.", "Kies je beroep om je loopbaan te beginnen."],
  siteInactive: ["A obra ainda não está ativa.", "The project is not active yet.", "Le chantier n’est pas encore actif.", "La obra aún no está activa.", "Șantierul nu este încă activ.", "Das Projekt ist noch nicht aktiv.", "Het project is nog niet actief."],
} as const;

export type WalletTextKey = keyof typeof rows;
export function walletText(language: LanguageCode, key: WalletTextKey): string {
  return rows[key][languages.indexOf(language)];
}

export function requirementTitle(language: LanguageCode, item: Pick<WalletRequirement, "kind" | "requirement" | "label">): string {
  const keys: Record<string, WalletTextKey> = { identity: "identityDoc", insurance: "insuranceDoc", medical: "medicalDoc", safety: "safetyDoc", technical: "technicalDoc", work_permit: "permitDoc", employment: "employmentDoc", legal: "legalDoc", license: "licenseDoc" };
  return item.kind === "document" && keys[item.requirement] ? walletText(language, keys[item.requirement]) : item.requirement;
}

export function requirementStatus(language: LanguageCode, status: WalletRequirement["status"]): string {
  return walletText(language, status === "pending" ? "review" : status);
}
