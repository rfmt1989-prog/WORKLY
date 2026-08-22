import type { LanguageCode } from "@/src/demo/types";

export type PremiumCopy = {
  companyHome: string;
  workerHome: string;
  more: string;
  moreTools: string;
  moreToolsSubtitle: string;
  currentArea: string;
  open: string;
  commandCenter: string;
  attentionTitle: string;
  prioritiesNow: string;
  stableOperation: string;
  onSite: string;
  activeSites: string;
  fit: string;
  priorities: string;
  decisionsOnly: string;
  allClear: string;
  noUrgent: string;
  quickActions: string;
  rightModule: string;
  operations: string;
  workers: string;
  projects: string;
  compliance: string;
  blockedWorkers: string;
  resolveBeforeCheckin: string;
  requirementsAttention: string;
  upcomingExpiries: string;
  teamsWithoutSite: string;
  assignTeam: string;
  pausedSites: string;
  reviewPlanning: string;
  today: string;
  activeWorkSession: string;
  readyNextStep: string;
  noAssignedSite: string;
  checkinBlocked: string;
  nextAction: string;
  resolveCompliance: string;
  checkoutWhenFinish: string;
  validateLocation: string;
  checkOut: string;
  checkIn: string;
  yourWorkspace: string;
  noDuplicateInfo: string;
  attendance: string;
  documents: string;
  profile: string;
};

export const premiumCopy: Record<LanguageCode, PremiumCopy> = {
  pt: {
    companyHome: "Centro", workerHome: "Hoje", more: "Mais", moreTools: "Mais ferramentas", moreToolsSubtitle: "Funções menos frequentes, sem poluir a navegação principal.", currentArea: "Área atual", open: "Abrir", commandCenter: "CENTRO DE COMANDO", attentionTitle: "O que precisa da tua atenção", prioritiesNow: "{count} prioridade(s) operacional(is) agora.", stableOperation: "Sem bloqueios críticos. Operação estável.", onSite: "em obra", activeSites: "Obras ativas", fit: "Aptos", priorities: "Prioridades", decisionsOnly: "Só aparece o que exige decisão.", allClear: "Tudo sob controlo", noUrgent: "Não existem ações urgentes neste momento.", quickActions: "Ações rápidas", rightModule: "Vai diretamente ao módulo certo.", operations: "Operações", workers: "Trabalhadores", projects: "Obras", compliance: "Conformidade", blockedWorkers: "{count} trabalhador(es) bloqueado(s)", resolveBeforeCheckin: "Resolver requisitos antes do próximo check-in.", requirementsAttention: "{count} requisito(s) a acompanhar", upcomingExpiries: "Validades próximas ou pendências não críticas.", teamsWithoutSite: "{count} equipa(s) sem obra", assignTeam: "Atribuir equipa a uma frente de trabalho.", pausedSites: "{count} obra(s) pausada(s)", reviewPlanning: "Rever estado e planeamento.", today: "HOJE", activeWorkSession: "Sessão de trabalho ativa", readyNextStep: "Pronto para o próximo passo", noAssignedSite: "Sem obra atribuída", checkinBlocked: "Check-in bloqueado", nextAction: "Próxima ação", resolveCompliance: "Resolve a conformidade antes de entrar em obra.", checkoutWhenFinish: "Quando terminares, regista a saída.", validateLocation: "Valida a localização e regista a entrada.", checkOut: "Registar saída", checkIn: "Registar entrada", yourWorkspace: "O teu espaço", noDuplicateInfo: "Sem duplicar informação entre áreas.", attendance: "Presenças", documents: "Documentos", profile: "Perfil",
  },
  en: {
    companyHome: "Center", workerHome: "Today", more: "More", moreTools: "More tools", moreToolsSubtitle: "Less frequent tools without cluttering primary navigation.", currentArea: "Current area", open: "Open", commandCenter: "COMMAND CENTER", attentionTitle: "What needs your attention", prioritiesNow: "{count} operational priority item(s) now.", stableOperation: "No critical blockers. Operations are stable.", onSite: "on site", activeSites: "Active sites", fit: "Fit", priorities: "Priorities", decisionsOnly: "Only items requiring a decision appear here.", allClear: "All clear", noUrgent: "There are no urgent actions right now.", quickActions: "Quick actions", rightModule: "Go directly to the right module.", operations: "Operations", workers: "Workers", projects: "Projects", compliance: "Compliance", blockedWorkers: "{count} blocked worker(s)", resolveBeforeCheckin: "Resolve requirements before the next check-in.", requirementsAttention: "{count} requirement(s) need attention", upcomingExpiries: "Upcoming expiries or non-critical issues.", teamsWithoutSite: "{count} team(s) without a site", assignTeam: "Assign the team to a work front.", pausedSites: "{count} paused site(s)", reviewPlanning: "Review status and planning.", today: "TODAY", activeWorkSession: "Work session active", readyNextStep: "Ready for the next step", noAssignedSite: "No assigned site", checkinBlocked: "Check-in blocked", nextAction: "Next action", resolveCompliance: "Resolve compliance before entering the site.", checkoutWhenFinish: "When you finish, check out.", validateLocation: "Validate location and check in.", checkOut: "Check out", checkIn: "Check in", yourWorkspace: "Your workspace", noDuplicateInfo: "No duplicated information between areas.", attendance: "Attendance", documents: "Documents", profile: "Profile",
  },
  fr: {
    companyHome: "Centre", workerHome: "Aujourd’hui", more: "Plus", moreTools: "Plus d’outils", moreToolsSubtitle: "Outils moins fréquents sans encombrer la navigation principale.", currentArea: "Zone actuelle", open: "Ouvrir", commandCenter: "CENTRE DE COMMANDE", attentionTitle: "Ce qui demande votre attention", prioritiesNow: "{count} priorité(s) opérationnelle(s) maintenant.", stableOperation: "Aucun blocage critique. Opération stable.", onSite: "sur chantier", activeSites: "Chantiers actifs", fit: "Aptes", priorities: "Priorités", decisionsOnly: "Seuls les éléments nécessitant une décision apparaissent ici.", allClear: "Tout est sous contrôle", noUrgent: "Aucune action urgente pour le moment.", quickActions: "Actions rapides", rightModule: "Accédez directement au bon module.", operations: "Opérations", workers: "Travailleurs", projects: "Chantiers", compliance: "Conformité", blockedWorkers: "{count} travailleur(s) bloqué(s)", resolveBeforeCheckin: "Régulariser les exigences avant le prochain pointage.", requirementsAttention: "{count} exigence(s) à suivre", upcomingExpiries: "Échéances proches ou écarts non critiques.", teamsWithoutSite: "{count} équipe(s) sans chantier", assignTeam: "Affecter l’équipe à une zone de travail.", pausedSites: "{count} chantier(s) en pause", reviewPlanning: "Revoir l’état et la planification.", today: "AUJOURD’HUI", activeWorkSession: "Session de travail active", readyNextStep: "Prêt pour la prochaine étape", noAssignedSite: "Aucun chantier attribué", checkinBlocked: "Pointage bloqué", nextAction: "Prochaine action", resolveCompliance: "Régularisez la conformité avant d’entrer sur le chantier.", checkoutWhenFinish: "À la fin, enregistrez votre sortie.", validateLocation: "Validez la localisation et enregistrez votre entrée.", checkOut: "Enregistrer la sortie", checkIn: "Enregistrer l’entrée", yourWorkspace: "Votre espace", noDuplicateInfo: "Aucune information dupliquée entre les zones.", attendance: "Présences", documents: "Documents", profile: "Profil",
  },
  es: {
    companyHome: "Centro", workerHome: "Hoy", more: "Más", moreTools: "Más herramientas", moreToolsSubtitle: "Funciones menos frecuentes sin saturar la navegación principal.", currentArea: "Área actual", open: "Abrir", commandCenter: "CENTRO DE MANDO", attentionTitle: "Lo que necesita tu atención", prioritiesNow: "{count} prioridad(es) operativa(s) ahora.", stableOperation: "Sin bloqueos críticos. Operación estable.", onSite: "en obra", activeSites: "Obras activas", fit: "Aptos", priorities: "Prioridades", decisionsOnly: "Aquí solo aparece lo que requiere una decisión.", allClear: "Todo bajo control", noUrgent: "No hay acciones urgentes en este momento.", quickActions: "Acciones rápidas", rightModule: "Ve directamente al módulo correcto.", operations: "Operaciones", workers: "Trabajadores", projects: "Obras", compliance: "Cumplimiento", blockedWorkers: "{count} trabajador(es) bloqueado(s)", resolveBeforeCheckin: "Resolver requisitos antes del próximo check-in.", requirementsAttention: "{count} requisito(s) requieren atención", upcomingExpiries: "Próximos vencimientos o incidencias no críticas.", teamsWithoutSite: "{count} equipo(s) sin obra", assignTeam: "Asignar el equipo a un frente de trabajo.", pausedSites: "{count} obra(s) pausada(s)", reviewPlanning: "Revisar estado y planificación.", today: "HOY", activeWorkSession: "Sesión de trabajo activa", readyNextStep: "Listo para el siguiente paso", noAssignedSite: "Sin obra asignada", checkinBlocked: "Check-in bloqueado", nextAction: "Siguiente acción", resolveCompliance: "Resuelve el cumplimiento antes de entrar en obra.", checkoutWhenFinish: "Cuando termines, registra la salida.", validateLocation: "Valida la ubicación y registra la entrada.", checkOut: "Registrar salida", checkIn: "Registrar entrada", yourWorkspace: "Tu espacio", noDuplicateInfo: "Sin información duplicada entre áreas.", attendance: "Presencias", documents: "Documentos", profile: "Perfil",
  },
  ro: {
    companyHome: "Centru", workerHome: "Astăzi", more: "Mai mult", moreTools: "Mai multe instrumente", moreToolsSubtitle: "Funcții mai rar folosite, fără aglomerarea navigării principale.", currentArea: "Zona curentă", open: "Deschide", commandCenter: "CENTRU DE COMANDĂ", attentionTitle: "Ce necesită atenția ta", prioritiesNow: "{count} prioritate/priorități operaționale acum.", stableOperation: "Fără blocaje critice. Operațiune stabilă.", onSite: "pe șantier", activeSites: "Șantiere active", fit: "Apți", priorities: "Priorități", decisionsOnly: "Aici apar doar elementele care necesită o decizie.", allClear: "Totul sub control", noUrgent: "Nu există acțiuni urgente în acest moment.", quickActions: "Acțiuni rapide", rightModule: "Mergi direct la modulul potrivit.", operations: "Operațiuni", workers: "Lucrători", projects: "Șantiere", compliance: "Conformitate", blockedWorkers: "{count} lucrător(i) blocat(ți)", resolveBeforeCheckin: "Rezolvă cerințele înainte de următorul check-in.", requirementsAttention: "{count} cerință/cerințe necesită atenție", upcomingExpiries: "Expirări apropiate sau probleme necritice.", teamsWithoutSite: "{count} echipă/echipe fără șantier", assignTeam: "Alocă echipa unui front de lucru.", pausedSites: "{count} șantier(e) în pauză", reviewPlanning: "Revizuiește starea și planificarea.", today: "ASTĂZI", activeWorkSession: "Sesiune de lucru activă", readyNextStep: "Pregătit pentru pasul următor", noAssignedSite: "Niciun șantier alocat", checkinBlocked: "Check-in blocat", nextAction: "Acțiunea următoare", resolveCompliance: "Rezolvă conformitatea înainte de intrarea pe șantier.", checkoutWhenFinish: "La final, înregistrează ieșirea.", validateLocation: "Validează locația și înregistrează intrarea.", checkOut: "Înregistrează ieșirea", checkIn: "Înregistrează intrarea", yourWorkspace: "Spațiul tău", noDuplicateInfo: "Fără informații duplicate între zone.", attendance: "Prezență", documents: "Documente", profile: "Profil",
  },
  de: {
    companyHome: "Zentrale", workerHome: "Heute", more: "Mehr", moreTools: "Weitere Werkzeuge", moreToolsSubtitle: "Seltener genutzte Funktionen, ohne die Hauptnavigation zu überladen.", currentArea: "Aktueller Bereich", open: "Öffnen", commandCenter: "EINSATZZENTRALE", attentionTitle: "Was Ihre Aufmerksamkeit braucht", prioritiesNow: "{count} operative Priorität(en) aktuell.", stableOperation: "Keine kritischen Blockaden. Betrieb stabil.", onSite: "auf Baustelle", activeSites: "Aktive Baustellen", fit: "Geeignet", priorities: "Prioritäten", decisionsOnly: "Hier erscheint nur, was eine Entscheidung erfordert.", allClear: "Alles unter Kontrolle", noUrgent: "Derzeit gibt es keine dringenden Maßnahmen.", quickActions: "Schnellaktionen", rightModule: "Direkt zum richtigen Modul.", operations: "Betrieb", workers: "Mitarbeiter", projects: "Baustellen", compliance: "Compliance", blockedWorkers: "{count} gesperrte(r) Mitarbeiter", resolveBeforeCheckin: "Anforderungen vor dem nächsten Check-in klären.", requirementsAttention: "{count} Anforderung(en) beachten", upcomingExpiries: "Bevorstehende Abläufe oder nicht kritische Punkte.", teamsWithoutSite: "{count} Team(s) ohne Baustelle", assignTeam: "Team einem Arbeitsbereich zuweisen.", pausedSites: "{count} pausierte Baustelle(n)", reviewPlanning: "Status und Planung prüfen.", today: "HEUTE", activeWorkSession: "Arbeitssitzung aktiv", readyNextStep: "Bereit für den nächsten Schritt", noAssignedSite: "Keine Baustelle zugewiesen", checkinBlocked: "Check-in gesperrt", nextAction: "Nächste Aktion", resolveCompliance: "Compliance vor dem Betreten der Baustelle klären.", checkoutWhenFinish: "Nach Abschluss auschecken.", validateLocation: "Standort prüfen und einchecken.", checkOut: "Auschecken", checkIn: "Einchecken", yourWorkspace: "Ihr Bereich", noDuplicateInfo: "Keine doppelten Informationen zwischen Bereichen.", attendance: "Anwesenheit", documents: "Dokumente", profile: "Profil",
  },
  nl: {
    companyHome: "Centrum", workerHome: "Vandaag", more: "Meer", moreTools: "Meer tools", moreToolsSubtitle: "Minder vaak gebruikte functies zonder de hoofdnavigatie te belasten.", currentArea: "Huidig onderdeel", open: "Openen", commandCenter: "OPERATIECENTRUM", attentionTitle: "Wat jouw aandacht nodig heeft", prioritiesNow: "{count} operationele prioriteit(en) nu.", stableOperation: "Geen kritieke blokkades. Operatie stabiel.", onSite: "op locatie", activeSites: "Actieve projecten", fit: "Geschikt", priorities: "Prioriteiten", decisionsOnly: "Hier verschijnt alleen wat een beslissing vereist.", allClear: "Alles onder controle", noUrgent: "Er zijn momenteel geen urgente acties.", quickActions: "Snelle acties", rightModule: "Ga rechtstreeks naar de juiste module.", operations: "Operaties", workers: "Werknemers", projects: "Projecten", compliance: "Compliance", blockedWorkers: "{count} geblokkeerde werknemer(s)", resolveBeforeCheckin: "Los vereisten op vóór de volgende check-in.", requirementsAttention: "{count} vereiste(n) vragen aandacht", upcomingExpiries: "Naderende vervaldatums of niet-kritieke punten.", teamsWithoutSite: "{count} team(s) zonder project", assignTeam: "Wijs het team toe aan een werkfront.", pausedSites: "{count} gepauzeerd(e) project(en)", reviewPlanning: "Controleer status en planning.", today: "VANDAAG", activeWorkSession: "Werksessie actief", readyNextStep: "Klaar voor de volgende stap", noAssignedSite: "Geen project toegewezen", checkinBlocked: "Check-in geblokkeerd", nextAction: "Volgende actie", resolveCompliance: "Los compliance op voordat je de locatie betreedt.", checkoutWhenFinish: "Registreer je vertrek wanneer je klaar bent.", validateLocation: "Controleer de locatie en check in.", checkOut: "Uitchecken", checkIn: "Inchecken", yourWorkspace: "Jouw werkruimte", noDuplicateInfo: "Geen dubbele informatie tussen onderdelen.", attendance: "Aanwezigheid", documents: "Documenten", profile: "Profiel",
  },
};

export function premiumFormat(template: string, variables: Record<string, string | number>) {
  return Object.entries(variables).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
