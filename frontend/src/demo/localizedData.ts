import type { LanguageCode } from "./types";

type Values = [string, string, string, string, string, string];

const index: Record<Exclude<LanguageCode, "pt">, number> = {
  en: 0,
  fr: 1,
  es: 2,
  ro: 3,
  de: 4,
  nl: 5,
};

const terms: Record<string, Values> = {
  "Nacellista / Operador IPAF 3a/3b": ["MEWP / IPAF 3a/3b Operator", "Opérateur PEMP / IPAF 3a/3b", "Operador PEMP / IPAF 3a/3b", "Operator PEMP / IPAF 3a/3b", "Hubarbeitsbühnen-/IPAF-3a/3b-Bediener", "Hoogwerker-/IPAF 3a/3b-operator"],
  Eletricista: ["Electrician", "Électricien", "Electricista", "Electrician", "Elektriker", "Elektricien"],
  Canalizador: ["Plumber", "Plombier", "Fontanero", "Instalator sanitar", "Installateur", "Loodgieter"],
  Soldador: ["Welder", "Soudeur", "Soldador", "Sudor", "Schweißer", "Lasser"],
  "Técnica AVAC": ["HVAC Technician", "Technicienne CVC", "Técnica de climatización", "Tehniciană HVAC", "HLK-Technikerin", "HVAC-technicus"],
  "Montador de estruturas": ["Structural Assembler", "Monteur de structures", "Montador de estructuras", "Montator structuri", "Strukturmonteur", "Constructiemonteur"],
  "Operador de máquinas": ["Machine Operator", "Conducteur d’engins", "Operador de maquinaria", "Operator utilaje", "Maschinenführer", "Machineoperator"],
  "Encarregado de obra": ["Site Supervisor", "Chef de chantier", "Encargado de obra", "Șef de șantier", "Bauleiter", "Uitvoerder"],

  "Plataformas elevatórias": ["Aerial work platforms", "Plates-formes élévatrices", "Plataformas elevadoras", "Platforme elevatoare", "Hubarbeitsbühnen", "Hoogwerkers"],
  "Montagem industrial": ["Industrial assembly", "Montage industriel", "Montaje industrial", "Montaj industrial", "Industriemontage", "Industriële montage"],
  "Segurança em altura": ["Working-at-height safety", "Sécurité en hauteur", "Seguridad en altura", "Siguranță la înălțime", "Höhensicherheit", "Veiligheid op hoogte"],
  "Eletricidade industrial": ["Industrial electricity", "Électricité industrielle", "Electricidad industrial", "Electricitate industrială", "Industrieelektrik", "Industriële elektrotechniek"],
  "Quadros elétricos": ["Electrical panels", "Tableaux électriques", "Cuadros eléctricos", "Tablouri electrice", "Schaltschränke", "Schakelkasten"],
  "Baixa tensão": ["Low voltage", "Basse tension", "Baja tensión", "Joasă tensiune", "Niederspannung", "Laagspanning"],
  Solar: ["Solar", "Solaire", "Solar", "Solar", "Solar", "Zonne-energie"],
  "Redes de água": ["Water networks", "Réseaux d’eau", "Redes de agua", "Rețele de apă", "Wassernetze", "Waternetwerken"],
  "AVAC hidráulico": ["Hydronic HVAC", "CVC hydraulique", "Climatización hidráulica", "HVAC hidraulic", "Hydronische HLK", "Hydronische HVAC"],
  "Leitura de projeto": ["Technical drawing reading", "Lecture de plans", "Lectura de planos", "Citirea proiectelor", "Planlesen", "Technische tekeningen lezen"],
  "Estruturas metálicas": ["Steel structures", "Structures métalliques", "Estructuras metálicas", "Structuri metalice", "Stahlbau", "Staalconstructies"],
  Climatização: ["Air conditioning", "Climatisation", "Climatización", "Climatizare", "Klimatechnik", "Klimaattechniek"],
  Refrigeração: ["Refrigeration", "Réfrigération", "Refrigeración", "Refrigerare", "Kältetechnik", "Koeltechniek"],
  "Eficiência energética": ["Energy efficiency", "Efficacité énergétique", "Eficiencia energética", "Eficiență energetică", "Energieeffizienz", "Energie-efficiëntie"],
  "Estrutura metálica": ["Steel structure", "Structure métallique", "Estructura metálica", "Structură metalică", "Stahlkonstruktion", "Staalconstructie"],
  "Leitura de desenho": ["Drawing reading", "Lecture de dessins", "Lectura de planos", "Citirea desenelor", "Zeichnungslesen", "Tekening lezen"],
  Escavadora: ["Excavator", "Pelle mécanique", "Excavadora", "Excavator", "Bagger", "Graafmachine"],
  Empilhador: ["Forklift", "Chariot élévateur", "Carretilla elevadora", "Stivuitor", "Gabelstapler", "Heftruck"],
  "Movimentação de terras": ["Earthmoving", "Terrassement", "Movimiento de tierras", "Terasamente", "Erdbewegung", "Grondverzet"],
  Coordenação: ["Coordination", "Coordination", "Coordinación", "Coordonare", "Koordination", "Coördinatie"],
  Planeamento: ["Planning", "Planification", "Planificación", "Planificare", "Planung", "Planning"],
  Segurança: ["Safety", "Sécurité", "Seguridad", "Siguranță", "Sicherheit", "Veiligheid"],

  "IPAF 3a e 3b": ["IPAF 3a and 3b", "IPAF 3a et 3b", "IPAF 3a y 3b", "IPAF 3a și 3b", "IPAF 3a und 3b", "IPAF 3a en 3b"],
  "Habilitação elétrica H0B0": ["H0B0 Electrical Authorisation", "Habilitation électrique H0B0", "Habilitación eléctrica H0B0", "Autorizare electrică H0B0", "Elektrotechnische Befähigung H0B0", "Elektrische bevoegdheid H0B0"],
  "Trabalho em altura": ["Working at Height", "Travail en hauteur", "Trabajo en altura", "Lucru la înălțime", "Arbeiten in der Höhe", "Werken op hoogte"],
  "Técnico de instalações elétricas": ["Electrical Installations Technician", "Technicien des installations électriques", "Técnico de instalaciones eléctricas", "Tehnician instalații electrice", "Elektroinstallationstechniker", "Technicus elektrische installaties"],
  "Primeiros socorros": ["First Aid", "Premiers secours", "Primeros auxilios", "Prim ajutor", "Erste Hilfe", "Eerste hulp"],
  "Instalador de redes prediais": ["Building Services Network Installer", "Installateur de réseaux du bâtiment", "Instalador de redes de edificios", "Instalator rețele clădiri", "Gebäudenetzinstallateur", "Installateur gebouwleidingen"],
  "Hot Work Safety": ["Hot Work Safety", "Sécurité des travaux à chaud", "Seguridad en trabajos en caliente", "Siguranța lucrărilor la cald", "Heißarbeitssicherheit", "Veiligheid bij heet werk"],
  "Técnica de AVAC": ["HVAC Technician", "Technicienne CVC", "Técnica de climatización", "Tehniciană HVAC", "HLK-Technikerin", "HVAC-technicus"],
  "Gases fluorados": ["Fluorinated Gases", "Gaz fluorés", "Gases fluorados", "Gaze fluorurate", "Fluorierte Gase", "Gefluoreerde gassen"],
  "Montagem de estruturas": ["Structural Assembly", "Montage de structures", "Montaje de estructuras", "Montaj structuri", "Strukturmontage", "Constructiemontage"],
  "Heavy Equipment Operator": ["Heavy Equipment Operator", "Conducteur d’engins lourds", "Operador de maquinaria pesada", "Operator utilaje grele", "Baumaschinenführer", "Operator zwaar materieel"],
  "SST Construção": ["Construction OHS", "SST Construction", "PRL Construcción", "SSM Construcții", "Arbeitsschutz Bau", "Arbo Bouw"],
  "Técnico de segurança": ["Safety Technician", "Technicien de sécurité", "Técnico de seguridad", "Tehnician SSM", "Sicherheitstechniker", "Veiligheidskundige"],
  "Gestão de equipas": ["Team Management", "Gestion d’équipes", "Gestión de equipos", "Managementul echipelor", "Teammanagement", "Teammanagement"],

  "Identificação profissional": ["Professional identification", "Identification professionnelle", "Identificación profesional", "Identificare profesională", "Beruflicher Ausweis", "Professionele identificatie"],
  "Seguro de acidentes de trabalho": ["Work accident insurance", "Assurance accidents du travail", "Seguro de accidentes laborales", "Asigurare pentru accidente de muncă", "Arbeitsunfallversicherung", "Arbeidsongevallenverzekering"],
  "Ficha de aptidão médica": ["Medical fitness certificate", "Fiche d’aptitude médicale", "Certificado de aptitud médica", "Fișă de aptitudine medicală", "Arbeitsmedizinische Eignungsbescheinigung", "Medische geschiktheidsverklaring"],
  "Plano de Segurança e Saúde": ["Safety and Health Plan", "Plan de sécurité et de santé", "Plan de Seguridad y Salud", "Plan de securitate și sănătate", "Sicherheits- und Gesundheitsschutzplan", "Veiligheids- en gezondheidsplan"],
  "Desenhos e peças de montagem": ["Assembly drawings and parts", "Plans et pièces de montage", "Planos y piezas de montaje", "Desene și piese de montaj", "Montagezeichnungen und Bauteile", "Montagetekeningen en onderdelen"],
  "Planeamento e cronograma": ["Planning and schedule", "Planification et calendrier", "Planificación y cronograma", "Planificare și grafic", "Planung und Terminplan", "Planning en tijdschema"],
  "Registo diário de obra": ["Daily site log", "Journal quotidien de chantier", "Registro diario de obra", "Jurnal zilnic de șantier", "Bautagesbericht", "Dagelijks bouwplaatslogboek"],
  "Projeto de execução": ["Execution design", "Projet d’exécution", "Proyecto de ejecución", "Proiect de execuție", "Ausführungsplanung", "Uitvoeringsontwerp"],
  "Projeto AVAC e redes técnicas": ["HVAC and technical networks design", "Projet CVC et réseaux techniques", "Proyecto de climatización y redes técnicas", "Proiect HVAC și rețele tehnice", "HLK- und Techniknetzplanung", "HVAC- en technische-netwerkenontwerp"],
  "Esquemas de quadros elétricos": ["Electrical panel diagrams", "Schémas de tableaux électriques", "Esquemas de cuadros eléctricos", "Scheme tablouri electrice", "Schaltschrankpläne", "Schema’s van schakelkasten"],
  "Seguro de responsabilidade civil": ["Liability insurance", "Assurance responsabilité civile", "Seguro de responsabilidad civil", "Asigurare de răspundere civilă", "Haftpflichtversicherung", "Aansprakelijkheidsverzekering"],
  "Certidão permanente": ["Permanent commercial certificate", "Extrait permanent du registre", "Certificado permanente del registro", "Certificat permanent de registru", "Dauerhafter Handelsregisterauszug", "Permanent handelsregisteruittreksel"],
  "Alvará de instalações técnicas": ["Technical installations licence", "Licence d’installations techniques", "Licencia de instalaciones técnicas", "Autorizație instalații tehnice", "Genehmigung für technische Anlagen", "Vergunning technische installaties"],

  "Construção e estruturas metálicas": ["Construction and steel structures", "Construction et structures métalliques", "Construcción y estructuras metálicas", "Construcții și structuri metalice", "Bau und Stahlkonstruktionen", "Bouw en staalconstructies"],
  "Eletricidade, AVAC e redes técnicas": ["Electrical, HVAC and technical networks", "Électricité, CVC et réseaux techniques", "Electricidad, climatización y redes técnicas", "Electricitate, HVAC și rețele tehnice", "Elektro, HLK und technische Netze", "Elektrotechniek, HVAC en technische netwerken"],
  "Execução e coordenação de estruturas metálicas, montagem industrial e construção modular em Portugal e na Europa.": ["Execution and coordination of steel structures, industrial assembly and modular construction in Portugal and across Europe.", "Exécution et coordination de structures métalliques, montage industriel et construction modulaire au Portugal et en Europe.", "Ejecución y coordinación de estructuras metálicas, montaje industrial y construcción modular en Portugal y Europa.", "Execuție și coordonare de structuri metalice, montaj industrial și construcții modulare în Portugal și în Europa.", "Ausführung und Koordination von Stahlkonstruktionen, Industriemontage und Modulbau in Portugal und Europa.", "Uitvoering en coördinatie van staalconstructies, industriële montage en modulaire bouw in Portugal en Europa."],
  "Instalações elétricas e mecânicas, AVAC, manutenção e eficiência energética para edifícios técnicos.": ["Electrical and mechanical installations, HVAC, maintenance and energy efficiency for technical buildings.", "Installations électriques et mécaniques, CVC, maintenance et efficacité énergétique pour bâtiments techniques.", "Instalaciones eléctricas y mecánicas, climatización, mantenimiento y eficiencia energética para edificios técnicos.", "Instalații electrice și mecanice, HVAC, mentenanță și eficiență energetică pentru clădiri tehnice.", "Elektro- und Mechanikinstallationen, HLK, Wartung und Energieeffizienz für technische Gebäude.", "Elektrische en mechanische installaties, HVAC, onderhoud en energie-efficiëntie voor technische gebouwen."],

  "Montagem de nave metálica e plataformas técnicas.": ["Assembly of a steel industrial building and technical platforms.", "Montage d’un bâtiment industriel métallique et de plates-formes techniques.", "Montaje de nave metálica y plataformas técnicas.", "Montaj hală metalică și platforme tehnice.", "Montage einer Stahlhalle und technischer Plattformen.", "Montage van een staalhal en technische platforms."],
  "Reforço e ampliação de estrutura logística.": ["Reinforcement and extension of a logistics structure.", "Renforcement et extension d’une structure logistique.", "Refuerzo y ampliación de una estructura logística.", "Consolidarea și extinderea unei structuri logistice.", "Verstärkung und Erweiterung einer Logistikstruktur.", "Versterking en uitbreiding van een logistieke constructie."],
  "Renovação de AVAC, quadros e redes técnicas.": ["Renovation of HVAC, electrical panels and technical networks.", "Rénovation CVC, tableaux électriques et réseaux techniques.", "Renovación de climatización, cuadros y redes técnicas.", "Renovare HVAC, tablouri și rețele tehnice.", "Sanierung von HLK, Schaltschränken und technischen Netzen.", "Renovatie van HVAC, schakelkasten en technische netwerken."],

  "Montagem e coordenação": ["Assembly and coordination", "Montage et coordination", "Montaje y coordinación", "Montaj și coordonare", "Montage und Koordination", "Montage en coördinatie"],
  "Soldadura e máquinas": ["Welding and machinery", "Soudage et engins", "Soldadura y maquinaria", "Sudură și utilaje", "Schweißen und Maschinen", "Lassen en machines"],
  "Montagem principal do Parque Industrial Mondego.": ["Main assembly works at Parque Industrial Mondego.", "Montage principal du Parque Industrial Mondego.", "Montaje principal del Parque Industrial Mondego.", "Lucrări principale de montaj la Parque Industrial Mondego.", "Hauptmontage am Parque Industrial Mondego.", "Hoofdmontage op Parque Industrial Mondego."],
  "Preparação da obra logística do Porto.": ["Preparation of the logistics site in Porto.", "Préparation du chantier logistique de Porto.", "Preparación de la obra logística de Porto.", "Pregătirea șantierului logistic din Porto.", "Vorbereitung der Logistikbaustelle in Porto.", "Voorbereiding van de logistieke bouwplaats in Porto."],

  "Contrato de montagem industrial": ["Industrial assembly contract", "Contrat de montage industriel", "Contrato de montaje industrial", "Contract de montaj industrial", "Industriemontagevertrag", "Contract industriële montage"],
  "Proposta de operação de máquinas": ["Machine operation proposal", "Proposition de conduite d’engins", "Propuesta de operación de maquinaria", "Propunere operare utilaje", "Angebot für Maschinenbetrieb", "Voorstel machinebediening"],
  "Projeto concluído com segurança, qualidade e cumprimento do prazo.": ["Project completed safely, to quality standards and on schedule.", "Projet achevé en sécurité, avec qualité et dans les délais.", "Proyecto completado con seguridad, calidad y dentro del plazo.", "Proiect finalizat în siguranță, cu calitate și la termen.", "Projekt sicher, qualitativ und termingerecht abgeschlossen.", "Project veilig, kwalitatief en op tijd afgerond."],
  "Entrada dentro da zona da obra.": ["Check-in within the site zone.", "Entrée dans la zone du chantier.", "Entrada dentro de la zona de la obra.", "Intrare în zona șantierului.", "Check-in innerhalb der Baustellenzone.", "Check-in binnen de bouwplaatszone."],
  "Registo de demonstração.": ["Demonstration record.", "Enregistrement de démonstration.", "Registro de demostración.", "Înregistrare demonstrativă.", "Demo-Eintrag.", "Demo-registratie."],
  "Turno concluído.": ["Shift completed.", "Poste terminé.", "Turno completado.", "Tură finalizată.", "Schicht abgeschlossen.", "Dienst afgerond."],
  "Horário confirmado": ["Schedule confirmed", "Horaire confirmé", "Horario confirmado", "Program confirmat", "Arbeitszeit bestätigt", "Werktijd bevestigd"],
  "O turno de amanhã começa às 08:00.": ["Tomorrow’s shift starts at 08:00.", "Le poste de demain commence à 08:00.", "El turno de mañana empieza a las 08:00.", "Tura de mâine începe la 08:00.", "Die morgige Schicht beginnt um 08:00 Uhr.", "De dienst van morgen begint om 08:00."],
  "Documento a expirar": ["Document expiring", "Document bientôt expiré", "Documento próximo a caducar", "Document care expiră", "Dokument läuft ab", "Document verloopt"],
  "Um certificado da equipa expira nos próximos 60 dias.": ["A team certificate expires within the next 60 days.", "Un certificat de l’équipe expire dans les 60 prochains jours.", "Un certificado del equipo caduca en los próximos 60 días.", "Un certificat al echipei expiră în următoarele 60 de zile.", "Ein Teamzertifikat läuft in den nächsten 60 Tagen ab.", "Een teamcertificaat verloopt binnen 60 dagen."],
};

function exact(language: LanguageCode, value: string) {
  let source = value;
  let translated = terms[source];
  if (!translated) {
    for (const [candidate, values] of Object.entries(terms)) {
      if (values.includes(value)) {
        source = candidate;
        translated = values;
        break;
      }
    }
  }
  if (language === "pt") return source;
  return translated ? translated[index[language]] : value;
}

const bioTemplate: Record<LanguageCode, (profession: string, years: string) => string> = {
  pt: (profession, years) => `Profissional de ${profession.toLowerCase()} com ${years} anos de experiência em projetos europeus.`,
  en: (profession, years) => `${profession} professional with ${years} years of experience on European projects.`,
  fr: (profession, years) => `Professionnel en ${profession.toLowerCase()} avec ${years} ans d’expérience sur des projets européens.`,
  es: (profession, years) => `Profesional de ${profession.toLowerCase()} con ${years} años de experiencia en proyectos europeos.`,
  ro: (profession, years) => `Profesionist în ${profession.toLowerCase()} cu ${years} ani de experiență în proiecte europene.`,
  de: (profession, years) => `${profession} mit ${years} Jahren Erfahrung in europäischen Projekten.`,
  nl: (profession, years) => `${profession} met ${years} jaar ervaring in Europese projecten.`,
};

const docTemplate: Record<LanguageCode, (title: string) => string> = {
  pt: (title) => `Documento de demonstração WORKLY — ${title}. Não possui validade legal.`,
  en: (title) => `WORKLY demonstration document — ${title}. Not legally valid.`,
  fr: (title) => `Document de démonstration WORKLY — ${title}. Sans valeur juridique.`,
  es: (title) => `Documento de demostración WORKLY — ${title}. Sin validez legal.`,
  ro: (title) => `Document demonstrativ WORKLY — ${title}. Fără valabilitate juridică.`,
  de: (title) => `WORKLY-Demodokument — ${title}. Nicht rechtsgültig.`,
  nl: (title) => `WORKLY-demodocument — ${title}. Niet rechtsgeldig.`,
};

const projectDocTemplate: Record<LanguageCode, (title: string) => string> = {
  pt: (title) => `Documento de obra de demonstração WORKLY — ${title}. Organizado no arquivo técnico da obra e sem validade legal.`,
  en: (title) => `WORKLY demonstration site document — ${title}. Filed in the project technical archive and not legally valid.`,
  fr: (title) => `Document de chantier de démonstration WORKLY — ${title}. Classé dans l’archive technique du chantier et sans valeur juridique.`,
  es: (title) => `Documento de obra de demostración WORKLY — ${title}. Archivado en el archivo técnico de la obra y sin validez legal.`,
  ro: (title) => `Document demonstrativ de șantier WORKLY — ${title}. Organizat în arhiva tehnică a șantierului și fără valabilitate juridică.`,
  de: (title) => `WORKLY-Demobaustellendokument — ${title}. Im technischen Baustellenarchiv abgelegt und nicht rechtsgültig.`,
  nl: (title) => `WORKLY-demobouwplaatsdocument — ${title}. Opgenomen in het technische bouwplaatsarchief en niet rechtsgeldig.`,
};

export function localizeDemoText(language: LanguageCode, value?: string | null): string {
  if (!value) return value ?? "";
  const direct = exact(language, value);
  if (direct !== value || language === "pt") return direct;

  const bio = /^Profissional de (.+) com (\d+) anos de experiência em projetos europeus\.$/.exec(value);
  if (bio) return bioTemplate[language](exact(language, bio[1]), bio[2]);

  const doc = /^Documento de demonstração WORKLY — (.+)\. Não possui validade legal\.$/.exec(value);
  if (doc) return docTemplate[language](exact(language, doc[1]));

  const projectDoc = /^Documento de obra de demonstração WORKLY — (.+)\. Organizado no arquivo técnico da obra e sem validade legal\.$/.exec(value);
  if (projectDoc) return projectDocTemplate[language](exact(language, projectDoc[1]));

  if (value.startsWith("Contrato de cedência — ")) {
    const name = value.slice("Contrato de cedência — ".length);
    const prefix: Record<LanguageCode, string> = { pt: "Contrato de cedência", en: "Assignment contract", fr: "Contrat de mise à disposition", es: "Contrato de cesión", ro: "Contract de detașare", de: "Überlassungsvertrag", nl: "Overeenkomst van terbeschikkingstelling" };
    return `${prefix[language]} — ${name}`;
  }

  const namedContract = /^Contrato fictício de demonstração entre (.+) e (.+)\. Sem validade legal\.$/.exec(value);
  if (namedContract) {
    const [a, b] = [namedContract[1], namedContract[2]];
    const templates: Record<LanguageCode, string> = {
      pt: `Contrato fictício de demonstração entre ${a} e ${b}. Sem validade legal.`,
      en: `Fictitious demonstration contract between ${a} and ${b}. Not legally valid.`,
      fr: `Contrat fictif de démonstration entre ${a} et ${b}. Sans valeur juridique.`,
      es: `Contrato ficticio de demostración entre ${a} y ${b}. Sin validez legal.`,
      ro: `Contract demonstrativ fictiv între ${a} și ${b}. Fără valabilitate juridică.`,
      de: `Fiktiver Demovertrag zwischen ${a} und ${b}. Nicht rechtsgültig.`,
      nl: `Fictief democontract tussen ${a} en ${b}. Niet rechtsgeldig.`,
    };
    return templates[language];
  }

  const generic: Record<string, Values> = {
    "Apólice fictícia para demonstração da plataforma.": ["Fictitious policy for platform demonstration.", "Police fictive pour la démonstration de la plateforme.", "Póliza ficticia para la demostración de la plataforma.", "Poliță fictivă pentru demonstrarea platformei.", "Fiktive Police zur Demonstration der Plattform.", "Fictieve polis voor demonstratie van het platform."],
    "Certidão fictícia para demonstração da plataforma.": ["Fictitious certificate for platform demonstration.", "Extrait fictif pour la démonstration de la plateforme.", "Certificado ficticio para la demostración de la plataforma.", "Certificat fictiv pentru demonstrarea platformei.", "Fiktiver Registerauszug zur Demonstration der Plattform.", "Fictief uittreksel voor demonstratie van het platform."],
    "Alvará fictício para demonstração da plataforma.": ["Fictitious licence for platform demonstration.", "Licence fictive pour la démonstration de la plateforme.", "Licencia ficticia para la demostración de la plataforma.", "Autorizație fictivă pentru demonstrarea platformei.", "Fiktive Genehmigung zur Demonstration der Plattform.", "Fictieve vergunning voor demonstratie van het platform."],
    "Contrato fictício para demonstração da plataforma.": ["Fictitious contract for platform demonstration.", "Contrat fictif pour la démonstration de la plateforme.", "Contrato ficticio para la demostración de la plataforma.", "Contract fictiv pentru demonstrarea platformei.", "Fiktiver Vertrag zur Demonstration der Plattform.", "Fictief contract voor demonstratie van het platform."],
    "Proposta fictícia para demonstração da plataforma.": ["Fictitious proposal for platform demonstration.", "Proposition fictive pour la démonstration de la plateforme.", "Propuesta ficticia para la demostración de la plataforma.", "Propunere fictivă pentru demonstrarea platformei.", "Fiktives Angebot zur Demonstration der Plattform.", "Fictief voorstel voor demonstratie van het platform."],
  };
  const item = generic[value];
  return item ? item[index[language]] : value;
}

export function localizeSkillsText(language: LanguageCode, value: string) {
  return value
    .split("\n")
    .map((line) => {
      const separator = line.lastIndexOf(":");
      if (separator < 0) return localizeDemoText(language, line);
      const name = line.slice(0, separator);
      const level = line.slice(separator + 1);
      return `${localizeDemoText(language, name)}:${level}`;
    })
    .join("\n");
}
