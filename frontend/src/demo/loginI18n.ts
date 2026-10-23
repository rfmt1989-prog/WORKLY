import type { LanguageCode } from "./types";

type LoginCopy = {
  eyebrow: string;
  title: string;
  description: string;
  secure: string;
  responsive: string;
  gps: string;
  login: string;
  register: string;
  worker: string;
  workerDescription: string;
  company: string;
  companyDescription: string;
  name: string;
  companyName: string;
  email: string;
  password: string;
  submitLogin: string;
  submitRegister: string;
  divider: string;
  workerDemo: string;
  companyDemo: string;
  demoPassword: string;
  required: string;
  genericError: string;
  incorrect: string;
  exists: string;
  demoBadge: string;
  loading: string;
  identifier: string;
  identifierPlaceholder: string;
  unifiedHint: string;
  emailHint: string;
  selectRole: string;
  hasAccount: string;
  noAccount: string;
  tryDemo: string;
  showPassword: string;
  hidePassword: string;
  accountIdHint: string;
};

export const loginCopy: Record<LanguageCode, LoginCopy> = {
  pt: {
    identifier: "ID Worker ou Company",
    identifierPlaceholder: "O seu ID WORKLY",
    unifiedHint: "Um só acesso para Worker e Company.",
    emailHint: "Também pode entrar com o seu e-mail.",
    selectRole: "Escolha o perfil que pretende criar.",
    hasAccount: "Já tem conta?",
    noAccount: "Ainda não tem conta?",
    tryDemo: "Experimentar demonstração",
    showPassword: "Mostrar palavra-passe",
    hidePassword: "Ocultar palavra-passe",
    accountIdHint: "Utilize este ID para entrar na Workly.",
    eyebrow: "OPERAÇÃO CONECTADA", title: "Pessoas certas.\nObras sob controlo.", description: "Uma visão única para trabalhadores, equipas, horários, documentos e execução no terreno.", secure: "Sessão recuperável", responsive: "Web e mobile", gps: "Presença com GPS", login: "Entrar", register: "Criar conta", worker: "Worker", workerDescription: "Perfil, obras e presenças", company: "Company", companyDescription: "Equipas e operação", name: "Nome completo", companyName: "Nome da empresa", email: "Email", password: "Palavra-passe", submitLogin: "Entrar na WORKLY", submitRegister: "Criar conta", divider: "ou usa uma conta preparada", workerDemo: "Entrar como Worker Demo", companyDemo: "Entrar como Company Demo", demoPassword: "Password única de demonstração", required: "Preenche todos os campos.", genericError: "Não foi possível autenticar. Confirma os dados e tenta novamente.", incorrect: "ID, e-mail ou palavra-passe incorretos.", exists: "Já existe uma conta com este email.", demoBadge: "DEMO WEB", loading: "A recuperar a sessão…",
  },
  en: {
    identifier: "Worker or Company ID",
    identifierPlaceholder: "Your WORKLY ID",
    unifiedHint: "One sign-in for Worker and Company.",
    emailHint: "You can also sign in with your email.",
    selectRole: "Choose the profile you want to create.",
    hasAccount: "Already have an account?",
    noAccount: "New to Workly?",
    tryDemo: "Try the demo",
    showPassword: "Show password",
    hidePassword: "Hide password",
    accountIdHint: "Use this ID to sign in to Workly.",
    eyebrow: "CONNECTED OPERATIONS", title: "The right people.\nEvery site under control.", description: "One view for workers, teams, schedules, documents and field execution.", secure: "Persistent session", responsive: "Web and mobile", gps: "GPS attendance", login: "Sign in", register: "Create account", worker: "Worker", workerDescription: "Profile, jobs and attendance", company: "Company", companyDescription: "Teams and operations", name: "Full name", companyName: "Company name", email: "Email", password: "Password", submitLogin: "Sign in to WORKLY", submitRegister: "Create account", divider: "or use a ready-made account", workerDemo: "Enter as Worker Demo", companyDemo: "Enter as Company Demo", demoPassword: "Single demonstration password", required: "Complete all fields.", genericError: "Authentication failed. Check the details and try again.", incorrect: "Incorrect ID, email or password.", exists: "An account already exists for this email.", demoBadge: "WEB DEMO", loading: "Restoring your session…",
  },
  fr: {
    identifier: "ID Worker ou Company",
    identifierPlaceholder: "Votre ID WORKLY",
    unifiedHint: "Un accès unique pour Worker et Company.",
    emailHint: "Vous pouvez aussi utiliser votre e-mail.",
    selectRole: "Choisissez le profil à créer.",
    hasAccount: "Vous avez déjà un compte ?",
    noAccount: "Pas encore de compte ?",
    tryDemo: "Essayer la démonstration",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    accountIdHint: "Utilisez cet ID pour vous connecter à Workly.",
    eyebrow: "OPÉRATIONS CONNECTÉES", title: "Les bonnes personnes.\nChaque chantier sous contrôle.", description: "Une vue unique pour les travailleurs, les équipes, les horaires, les documents et l’exécution sur le terrain.", secure: "Session persistante", responsive: "Web et mobile", gps: "Présence avec GPS", login: "Se connecter", register: "Créer un compte", worker: "Travailleur", workerDescription: "Profil, chantiers et présences", company: "Entreprise", companyDescription: "Équipes et opérations", name: "Nom complet", companyName: "Nom de l’entreprise", email: "E-mail", password: "Mot de passe", submitLogin: "Se connecter à WORKLY", submitRegister: "Créer un compte", divider: "ou utiliser un compte préparé", workerDemo: "Entrer comme Travailleur Demo", companyDemo: "Entrer comme Entreprise Demo", demoPassword: "Mot de passe unique de démonstration", required: "Remplissez tous les champs.", genericError: "Authentification impossible. Vérifiez les informations et réessayez.", incorrect: "ID, e-mail ou mot de passe incorrect.", exists: "Un compte existe déjà avec cet e-mail.", demoBadge: "DÉMO WEB", loading: "Restauration de la session…",
  },
  es: {
    identifier: "ID Worker o Company",
    identifierPlaceholder: "Tu ID WORKLY",
    unifiedHint: "Un único acceso para Worker y Company.",
    emailHint: "También puedes entrar con tu email.",
    selectRole: "Elige el perfil que quieres crear.",
    hasAccount: "¿Ya tienes una cuenta?",
    noAccount: "¿Aún no tienes cuenta?",
    tryDemo: "Probar la demostración",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    accountIdHint: "Utiliza este ID para entrar en Workly.",
    eyebrow: "OPERACIÓN CONECTADA", title: "Las personas adecuadas.\nCada obra bajo control.", description: "Una única vista para trabajadores, equipos, horarios, documentos y ejecución en obra.", secure: "Sesión persistente", responsive: "Web y móvil", gps: "Asistencia con GPS", login: "Iniciar sesión", register: "Crear cuenta", worker: "Trabajador", workerDescription: "Perfil, obras y asistencia", company: "Empresa", companyDescription: "Equipos y operaciones", name: "Nombre completo", companyName: "Nombre de la empresa", email: "Email", password: "Contraseña", submitLogin: "Entrar en WORKLY", submitRegister: "Crear cuenta", divider: "o usa una cuenta preparada", workerDemo: "Entrar como Trabajador Demo", companyDemo: "Entrar como Empresa Demo", demoPassword: "Contraseña única de demostración", required: "Completa todos los campos.", genericError: "No se pudo autenticar. Comprueba los datos e inténtalo de nuevo.", incorrect: "ID, email o contraseña incorrectos.", exists: "Ya existe una cuenta con este email.", demoBadge: "DEMO WEB", loading: "Restaurando la sesión…",
  },
  ro: {
    identifier: "ID Worker sau Company",
    identifierPlaceholder: "ID-ul tău WORKLY",
    unifiedHint: "Un singur acces pentru Worker și Company.",
    emailHint: "Te poți autentifica și cu emailul.",
    selectRole: "Alege profilul pe care vrei să îl creezi.",
    hasAccount: "Ai deja cont?",
    noAccount: "Nu ai încă un cont?",
    tryDemo: "Încearcă demonstrația",
    showPassword: "Arată parola",
    hidePassword: "Ascunde parola",
    accountIdHint: "Folosește acest ID pentru a intra în Workly.",
    eyebrow: "OPERAȚIUNI CONECTATE", title: "Oamenii potriviți.\nFiecare șantier sub control.", description: "O singură imagine pentru lucrători, echipe, programe, documente și execuția din teren.", secure: "Sesiune persistentă", responsive: "Web și mobil", gps: "Prezență cu GPS", login: "Autentificare", register: "Creează cont", worker: "Lucrător", workerDescription: "Profil, șantiere și prezență", company: "Companie", companyDescription: "Echipe și operațiuni", name: "Nume complet", companyName: "Numele companiei", email: "Email", password: "Parolă", submitLogin: "Intră în WORKLY", submitRegister: "Creează cont", divider: "sau folosește un cont pregătit", workerDemo: "Intră ca Lucrător Demo", companyDemo: "Intră ca Companie Demo", demoPassword: "Parolă unică pentru demonstrație", required: "Completează toate câmpurile.", genericError: "Autentificarea a eșuat. Verifică datele și încearcă din nou.", incorrect: "ID-ul, emailul sau parola sunt incorecte.", exists: "Există deja un cont cu acest email.", demoBadge: "DEMO WEB", loading: "Restabilim sesiunea…",
  },
  de: {
    identifier: "Worker- oder Company-ID",
    identifierPlaceholder: "Deine WORKLY-ID",
    unifiedHint: "Ein Zugang für Worker und Company.",
    emailHint: "Du kannst auch deine E-Mail verwenden.",
    selectRole: "Wähle das Profil, das du erstellen möchtest.",
    hasAccount: "Bereits ein Konto?",
    noAccount: "Noch kein Konto?",
    tryDemo: "Demo ausprobieren",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort verbergen",
    accountIdHint: "Melde dich mit dieser ID bei Workly an.",
    eyebrow: "VERNETZTER BETRIEB", title: "Die richtigen Menschen.\nJede Baustelle unter Kontrolle.", description: "Eine zentrale Ansicht für Mitarbeiter, Teams, Zeitpläne, Dokumente und die Ausführung vor Ort.", secure: "Persistente Sitzung", responsive: "Web und Mobil", gps: "GPS-Anwesenheit", login: "Anmelden", register: "Konto erstellen", worker: "Mitarbeiter", workerDescription: "Profil, Baustellen und Anwesenheit", company: "Unternehmen", companyDescription: "Teams und Betrieb", name: "Vollständiger Name", companyName: "Unternehmensname", email: "E-Mail", password: "Passwort", submitLogin: "Bei WORKLY anmelden", submitRegister: "Konto erstellen", divider: "oder ein vorbereitetes Konto verwenden", workerDemo: "Als Mitarbeiter Demo anmelden", companyDemo: "Als Unternehmen Demo anmelden", demoPassword: "Einheitliches Demo-Passwort", required: "Füllen Sie alle Felder aus.", genericError: "Anmeldung fehlgeschlagen. Prüfen Sie die Angaben und versuchen Sie es erneut.", incorrect: "ID, E-Mail oder Passwort sind falsch.", exists: "Für diese E-Mail existiert bereits ein Konto.", demoBadge: "WEB-DEMO", loading: "Sitzung wird wiederhergestellt…",
  },
  nl: {
    identifier: "Worker- of Company-ID",
    identifierPlaceholder: "Je WORKLY-ID",
    unifiedHint: "Eén toegang voor Worker en Company.",
    emailHint: "Je kunt ook inloggen met je e-mailadres.",
    selectRole: "Kies het profiel dat je wilt maken.",
    hasAccount: "Heb je al een account?",
    noAccount: "Nog geen account?",
    tryDemo: "Probeer de demo",
    showPassword: "Wachtwoord tonen",
    hidePassword: "Wachtwoord verbergen",
    accountIdHint: "Gebruik deze ID om in te loggen bij Workly.",
    eyebrow: "VERBONDEN OPERATIES", title: "De juiste mensen.\nElke bouwplaats onder controle.", description: "Eén overzicht voor werknemers, teams, roosters, documenten en uitvoering op locatie.", secure: "Blijvende sessie", responsive: "Web en mobiel", gps: "GPS-aanwezigheid", login: "Inloggen", register: "Account maken", worker: "Werknemer", workerDescription: "Profiel, bouwplaatsen en aanwezigheid", company: "Bedrijf", companyDescription: "Teams en operaties", name: "Volledige naam", companyName: "Bedrijfsnaam", email: "E-mail", password: "Wachtwoord", submitLogin: "Inloggen bij WORKLY", submitRegister: "Account maken", divider: "of gebruik een voorbereid account", workerDemo: "Inloggen als Werknemer Demo", companyDemo: "Inloggen als Bedrijf Demo", demoPassword: "Uniek demonstratiewachtwoord", required: "Vul alle velden in.", genericError: "Aanmelden is mislukt. Controleer de gegevens en probeer opnieuw.", incorrect: "ID, e-mail of wachtwoord is onjuist.", exists: "Er bestaat al een account met dit e-mailadres.", demoBadge: "WEBDEMO", loading: "Sessie wordt hersteld…",
  },
};

export function readableAuthError(message: string, language: LanguageCode): string {
  if (message.includes("401") || message.includes("403") || message.toLowerCase().includes("invalid")) return loginCopy[language].incorrect;
  if (message.includes("409") || message.toLowerCase().includes("exists")) return loginCopy[language].exists;
  return loginCopy[language].genericError;
}
