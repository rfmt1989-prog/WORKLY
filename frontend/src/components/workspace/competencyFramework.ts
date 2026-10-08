import type Ionicons from "@expo/vector-icons/Ionicons";
import type React from "react";

export type CompetencyRelation = "essential" | "optional";
export type CompetencyDimension =
  | "knowledge"
  | "practical"
  | "diagnostic"
  | "responsibility";

export type CompetencySpec = {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  relation: CompetencyRelation;
  dimension: CompetencyDimension;
  critical?: boolean;
  aliases: string[];
};

export type RegulatorySpec = {
  id: string;
  title: string;
  titleEn: string;
  scope: "international" | "eu" | "national" | "employer" | "site";
  note: string;
  noteEn: string;
  aliases: string[];
};

export type CompetencyProfile = {
  professionId: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  frameworkNote: string;
  frameworkNoteEn: string;
  competencies: CompetencySpec[];
  regulatory: RegulatorySpec[];
};

const c = (
  id: string,
  title: string,
  titleEn: string,
  description: string,
  descriptionEn: string,
  icon: CompetencySpec["icon"],
  relation: CompetencyRelation,
  dimension: CompetencyDimension,
  aliases: string[],
  critical = false,
): CompetencySpec => ({
  id,
  title,
  titleEn,
  description,
  descriptionEn,
  icon,
  relation,
  dimension,
  aliases,
  critical,
});

export const competencyProfiles: CompetencyProfile[] = [
  {
    professionId: "electromechanics",
    title: "Eletromecânica Industrial",
    titleEn: "Industrial Electromechanics",
    description: "Competências nucleares para manutenção e diagnóstico eletromecânico.",
    descriptionEn: "Core competences for electromechanical maintenance and diagnostics.",
    frameworkNote: "Estrutura WORKLY alinhada com a lógica ESCO: competências essenciais e opcionais, separadas de qualificações e autorizações.",
    frameworkNoteEn: "WORKLY structure aligned with ESCO logic: essential and optional competences, separate from qualifications and authorisations.",
    competencies: [
      c("em-technical-reading","Leitura e interpretação técnica","Technical interpretation","Interpretar esquemas elétricos, mecânicos, manuais e documentação de manutenção.","Interpret electrical/mechanical diagrams, manuals and maintenance documentation.","document-text-outline","essential","knowledge",["course","desenho","schema","diagram","manual"],true),
      c("em-mechanical-systems","Sistemas mecânicos e transmissão","Mechanical drive systems","Montar, inspecionar e manter rolamentos, acoplamentos, transmissões e elementos mecânicos.","Assemble, inspect and maintain bearings, couplings, transmissions and mechanical elements.","cog-outline","essential","practical",["em-mechanical","mecan","bearing","rolamento","acoplamento"],true),
      c("em-electrical-systems","Motores e sistemas elétricos","Motors and electrical systems","Trabalhar com motores, proteção, comando, medição e acionamentos no âmbito permitido.","Work with motors, protection, control, measurement and drives within authorised scope.","flash-outline","essential","practical",["em-motors","motor","variador","drive","electrical"],true),
      c("em-maintenance","Manutenção preventiva e corretiva","Preventive & corrective maintenance","Executar inspeção, manutenção planeada, substituição e reposição de serviço.","Perform inspection, planned maintenance, replacement and return to service.","construct-outline","essential","practical",["maintenance","manutencao","preventiva","corretiva"],true),
      c("em-fault-diagnosis","Diagnóstico de avarias","Fault diagnosis","Medir, isolar causas e resolver falhas eletromecânicas com método e segurança.","Measure, isolate causes and solve electromechanical faults methodically and safely.","pulse-outline","essential","diagnostic",["em-diagnostics","diagnost","fault","avaria"],true),
      c("em-safe-isolation","Preparação e isolamento seguro","Safe preparation & isolation","Preparar intervenções, identificar energias e aplicar procedimentos de isolamento aplicáveis.","Prepare interventions, identify energies and apply applicable isolation procedures.","lock-closed-outline","essential","responsibility",["loto","consign","isolation","isolamento"]),
      c("em-automation","Automação e controlo","Automation & control","Diagnosticar sensores, atuadores, sinais, PLC e sistemas de controlo.","Diagnose sensors, actuators, signals, PLC and control systems.","git-network-outline","optional","diagnostic",["em-automation","automacao","automation","plc","sensor"]),
      c("em-supervision","Coordenação técnica","Technical coordination","Planear trabalhos, validar sequência, coordenar recursos e acompanhar qualidade.","Plan work, validate sequence, coordinate resources and monitor quality.","people-outline","optional","responsibility",["supervisor","lead","coordena","encarregado"]),
    ],
    regulatory: [
      { id:"em-electrical-authorisation", title:"Autorização/habilitação elétrica aplicável", titleEn:"Applicable electrical authorisation", scope:"national", note:"Depende do país, atividade e entidade responsável.", noteEn:"Depends on country, activity and responsible entity.", aliases:["h0b0","b1v","b2v","br","bc","habilit"] },
      { id:"em-loto", title:"LOTO / consignação de energias", titleEn:"LOTO / energy isolation", scope:"employer", note:"Normalmente ligado ao procedimento da empresa ou do site.", noteEn:"Usually linked to employer or site procedure.", aliases:["loto","lockout","tagout","consign"] },
      { id:"em-site", title:"Requisitos de acesso industrial", titleEn:"Industrial site access requirements", scope:"site", note:"Podem incluir VCA/SCC, induções, ATEX ou requisitos do cliente.", noteEn:"May include VCA/SCC, inductions, ATEX or client requirements.", aliases:["vca","scc","site induction","atex","risco quim"] },
    ],
  },
  {
    professionId: "electrical",
    title: "Eletricidade",
    titleEn: "Electrical",
    description: "Instalação, ensaio, manutenção e diagnóstico de sistemas elétricos.",
    descriptionEn: "Installation, testing, maintenance and diagnostics of electrical systems.",
    frameworkNote: "A senioridade técnica é separada das habilitações legais ou empresariais.",
    frameworkNoteEn: "Technical seniority is kept separate from legal or employer authorisations.",
    competencies: [
      c("el-technical-reading","Esquemas e documentação elétrica","Electrical drawings & documentation","Interpretar esquemas, proteções, circuitos e documentação técnica.","Interpret diagrams, protection, circuits and technical documentation.","document-text-outline","essential","knowledge",["schema","diagram","electrical drawing"],true),
      c("el-installation","Instalação elétrica","Electrical installation","Executar cablagem, terminações, quadros e equipamentos conforme especificação.","Install wiring, terminations, panels and equipment to specification.","flash-outline","essential","practical",["el-installation","instalacao eletrica","wiring","cablagem"],true),
      c("el-testing","Medição e ensaios","Testing & measurement","Usar instrumentos e realizar ensaios adequados ao âmbito de trabalho.","Use instruments and perform tests appropriate to the work scope.","speedometer-outline","essential","practical",["el-testing","multimeter","isolamento","continuity"],true),
      c("el-maintenance","Manutenção elétrica","Electrical maintenance","Executar manutenção preventiva e corretiva em circuitos e equipamentos.","Perform preventive and corrective maintenance on circuits and equipment.","construct-outline","essential","practical",["el-maintenance","manutencao eletrica"],true),
      c("el-diagnostics","Diagnóstico elétrico","Electrical diagnostics","Localizar avarias, analisar causas e repor sistemas em serviço.","Locate faults, analyse causes and restore systems to service.","pulse-outline","essential","diagnostic",["diagnost","fault","avaria eletrica"],true),
      c("el-isolation","Consignação e preparação segura","Isolation & safe preparation","Preparar trabalhos, isolar energias e confirmar condições seguras.","Prepare work, isolate energy and confirm safe conditions.","lock-closed-outline","essential","responsibility",["loto","consign","isolation"]),
      c("el-controls","Comando e automação","Control & automation","Trabalhar com comando, sensores, contactores, variadores ou PLC.","Work with controls, sensors, contactors, drives or PLC.","git-network-outline","optional","diagnostic",["plc","automation","variador","contactor"]),
      c("el-supervision","Supervisão de trabalhos","Work supervision","Organizar sequência, recursos, controlo de qualidade e responsabilidade da equipa.","Organise sequence, resources, quality control and team responsibility.","people-outline","optional","responsibility",["supervisor","b2","lead","encarregado"]),
    ],
    regulatory: [
      { id:"el-authorisation", title:"Habilitação/autorização elétrica", titleEn:"Electrical authorisation", scope:"national", note:"O âmbito varia por país, tensão, atividade e função.", noteEn:"Scope varies by country, voltage, activity and role.", aliases:["h0b0","b0","b1","b2","br","bc","habilit"] },
      { id:"el-loto", title:"LOTO / consignação", titleEn:"LOTO / isolation", scope:"employer", note:"Pode ser requisito de empresa ou site e não mede senioridade.", noteEn:"May be an employer/site requirement and does not measure seniority.", aliases:["loto","lockout","tagout","consign"] },
    ],
  },
  {
    professionId: "hvac",
    title: "AVAC e Refrigeração",
    titleEn: "HVAC & Refrigeration",
    description: "Instalação, circuito frigorífico, manutenção, diagnóstico e comissionamento.",
    descriptionEn: "Installation, refrigeration circuit, maintenance, diagnostics and commissioning.",
    frameworkNote: "F-Gas e outras certificações são evidência regulatória/qualificativa; não substituem competência prática comprovada.",
    frameworkNoteEn: "F-Gas and other certificates are regulatory/qualification evidence; they do not replace demonstrated practical competence.",
    competencies: [
      c("hvac-principles","Princípios AVAC e refrigeração","HVAC & refrigeration principles","Compreender ciclo frigorífico, transferência térmica, pressões, temperaturas e controlo.","Understand refrigeration cycle, heat transfer, pressures, temperatures and control.","thermometer-outline","essential","knowledge",["course","refrigeracao","thermodynamic"],true),
      c("hvac-installation","Instalação de sistemas","System installation","Instalar unidades, tubagem, suportes, drenagem e componentes associados.","Install units, pipework, supports, drainage and associated components.","construct-outline","essential","practical",["hvac-installation","instalacao avac"],true),
      c("hvac-refrigeration","Circuito frigorífico","Refrigeration circuit","Executar preparação, vácuo, carga, controlo de pressões e operações permitidas.","Perform preparation, vacuum, charging, pressure checks and permitted operations.","snow-outline","essential","practical",["hvac-refrigeration","fgas","f-gas","vacu"],true),
      c("hvac-electrical","Elétrica e controlo AVAC","HVAC electrical & controls","Diagnosticar alimentação, proteção, sensores, atuadores e lógica de controlo.","Diagnose supply, protection, sensors, actuators and control logic.","flash-outline","essential","diagnostic",["hvac electrical","sensor","control","inverter"]),
      c("hvac-diagnostics","Diagnóstico de desempenho e avarias","Performance & fault diagnostics","Interpretar medições e sintomas para identificar causas frigoríficas, elétricas ou de controlo.","Interpret measurements and symptoms to identify refrigeration, electrical or control causes.","pulse-outline","essential","diagnostic",["hvac-diagnostics","diagnost","avaria"],true),
      c("hvac-commissioning","Comissionamento e entrega","Commissioning & handover","Verificar funcionamento, parametrizar, medir desempenho e documentar entrega.","Verify operation, configure, measure performance and document handover.","checkmark-done-outline","essential","responsibility",["hvac-efficiency","commissioning","comissionamento"]),
      c("hvac-heat-pumps","Bombas de calor","Heat pumps","Instalar, ajustar e diagnosticar sistemas de bomba de calor.","Install, adjust and diagnose heat pump systems.","leaf-outline","optional","diagnostic",["heat pump","bomba de calor"]),
      c("hvac-industrial","Refrigeração industrial","Industrial refrigeration","Trabalhar em sistemas industriais de maior complexidade no âmbito adequado.","Work on more complex industrial refrigeration systems within appropriate scope.","business-outline","optional","responsibility",["co2","nh3","industrial refrigeration"]),
    ],
    regulatory: [
      { id:"hvac-fgas", title:"Certificação F-Gas aplicável", titleEn:"Applicable F-Gas certification", scope:"eu", note:"O âmbito depende da categoria/certificado e da atividade executada.", noteEn:"Scope depends on certificate category and activity performed.", aliases:["fgas","f-gas","fluor"] },
      { id:"hvac-refrigerant-specialism", title:"Âmbito de refrigerante específico", titleEn:"Specific refrigerant scope", scope:"eu", note:"CO₂, NH₃ ou hidrocarbonetos podem exigir competência/formação específica.", noteEn:"CO2, NH3 or hydrocarbons may require specific competence/training.", aliases:["co2","nh3","amoniaco","hydrocarbon"] },
    ],
  },
  {
    professionId: "plumbing",
    title: "Canalização",
    titleEn: "Plumbing",
    description: "Redes de água, saneamento, montagem, ensaio e diagnóstico.",
    descriptionEn: "Water networks, drainage, assembly, testing and diagnostics.",
    frameworkNote: "A árvore mede competência técnica; licenças e requisitos locais são mostrados à parte.",
    frameworkNoteEn: "The tree measures technical competence; licences and local requirements are shown separately.",
    competencies: [
      c("pl-reading","Leitura de redes e projeto","Network & drawing interpretation","Interpretar traçados, detalhes, materiais e especificações.","Interpret layouts, details, materials and specifications.","map-outline","essential","knowledge",["drawing","desenho","isometrico"],true),
      c("pl-water","Redes de água","Water networks","Instalar tubagem, válvulas, acessórios e equipamentos de distribuição.","Install pipework, valves, fittings and distribution equipment.","water-outline","essential","practical",["pl-water","water network","rede agua"],true),
      c("pl-drainage","Saneamento e drenagem","Drainage & sanitation","Instalar e manter redes residuais, pluviais e ventilação associada.","Install and maintain wastewater, rainwater and associated venting.","git-merge-outline","essential","practical",["pl-drainage","saneamento","drainage"],true),
      c("pl-joints","Uniões e montagem de tubagem","Pipe joining & assembly","Selecionar e executar métodos de união adequados ao material e serviço.","Select and execute joining methods appropriate to material and service.","link-outline","essential","practical",["pipe","tubagem","press","weld","braz"]),
      c("pl-testing","Ensaios e estanquidade","Testing & tightness","Realizar ensaios, identificar perdas e confirmar condições de serviço.","Perform tests, identify leaks and confirm service conditions.","speedometer-outline","essential","diagnostic",["pl-testing","estanquidade","pressure test"],true),
      c("pl-diagnostics","Diagnóstico de redes","Network diagnostics","Localizar falhas, restrições, fugas e problemas de funcionamento.","Locate faults, restrictions, leaks and operating problems.","pulse-outline","essential","diagnostic",["leak","fuga","diagnost"]),
      c("pl-pumping","Bombagem e sistemas técnicos","Pumping & technical systems","Instalar ou manter bombagem, AQS e equipamentos técnicos.","Install or maintain pumping, hot water and technical equipment.","options-outline","optional","diagnostic",["pump","bombagem","aqs"]),
      c("pl-supervision","Coordenação de instalação","Installation coordination","Planear sequência, interfaces, ensaios e entrega de redes.","Plan sequence, interfaces, tests and network handover.","people-outline","optional","responsibility",["supervisor","lead","encarregado"]),
    ],
    regulatory: [],
  },
  {
    professionId: "solar",
    title: "Solar Fotovoltaico",
    titleEn: "Solar Photovoltaics",
    description: "Montagem, DC/AC, ensaios, comissionamento e manutenção.",
    descriptionEn: "Mounting, DC/AC, testing, commissioning and maintenance.",
    frameworkNote: "Competência fotovoltaica e autorização elétrica são avaliadas separadamente.",
    frameworkNoteEn: "PV competence and electrical authorisation are assessed separately.",
    competencies: [
      c("pv-principles","Fundamentos fotovoltaicos","PV principles","Compreender módulos, strings, inversores, proteção e produção.","Understand modules, strings, inverters, protection and generation.","sunny-outline","essential","knowledge",["photovolta","fotovolt","solar"],true),
      c("pv-mounting","Montagem mecânica","Mechanical mounting","Montar estruturas, módulos e elementos de fixação de forma segura.","Install structures, modules and fixing elements safely.","grid-outline","essential","practical",["pv-mounting","mounting","estrutura"],true),
      c("pv-dc","Circuitos DC","DC circuits","Executar strings, conectores, proteção e verificações DC no âmbito autorizado.","Build strings, connectors, protection and DC checks within authorised scope.","flash-outline","essential","practical",["pv-dc-ac","string","dc"],true),
      c("pv-ac","Ligação AC e inversores","AC connection & inverters","Configurar inversores e apoiar ligações AC no âmbito permitido.","Configure inverters and support AC connections within permitted scope.","hardware-chip-outline","essential","practical",["inverter","ac"],true),
      c("pv-testing","Ensaios e comissionamento","Testing & commissioning","Realizar verificações, medições, parametrização e documentação de entrega.","Perform checks, measurements, configuration and handover documentation.","checkmark-done-outline","essential","diagnostic",["pv-commissioning","commissioning","test"],true),
      c("pv-maintenance","Monitorização e diagnóstico","Monitoring & diagnostics","Interpretar produção, alarmes e medições para localizar perdas e avarias.","Interpret production, alarms and measurements to locate losses and faults.","pulse-outline","essential","diagnostic",["pv-maintenance","monitoring","fault"]),
      c("pv-storage","Armazenamento","Energy storage","Trabalhar com armazenamento e integração conforme fabricante e âmbito autorizado.","Work with storage and integration per manufacturer and authorised scope.","battery-charging-outline","optional","technical",["battery","storage","bateria"]),
      c("pv-lead","Coordenação técnica","Technical coordination","Coordenar instalação, segurança, ensaios e documentação.","Coordinate installation, safety, testing and documentation.","people-outline","optional","responsibility",["supervisor","lead","coordena"]),
    ],
    regulatory: [
      { id:"pv-electrical", title:"Autorização elétrica aplicável", titleEn:"Applicable electrical authorisation", scope:"national", note:"A ligação e intervenção elétrica dependem das regras do país e do âmbito da atividade.", noteEn:"Electrical connection/work depends on national rules and activity scope.", aliases:["electric","habilit","b1","b2","br"] },
      { id:"pv-height", title:"Trabalho em altura quando aplicável", titleEn:"Work at height when applicable", scope:"site", note:"Requisito operacional dependente do local e método de instalação.", noteEn:"Operational requirement depends on site and installation method.", aliases:["altura","height"] },
    ],
  },
  {
    professionId: "welding",
    title: "Soldadura e Estruturas Metálicas",
    titleEn: "Welding & Metal Structures",
    description: "Preparação, execução, inspeção e montagem estrutural.",
    descriptionEn: "Preparation, execution, inspection and structural assembly.",
    frameworkNote: "Qualificações de soldador são tratadas como evidência de processo/material, não como senioridade automática.",
    frameworkNoteEn: "Welder qualifications are treated as process/material evidence, not automatic seniority.",
    competencies: [
      c("wel-drawings","Leitura e preparação","Drawings & preparation","Interpretar desenhos, símbolos, materiais e preparação de junta.","Interpret drawings, symbols, materials and joint preparation.","document-text-outline","essential","knowledge",["wel-prep","drawing","weld symbol"],true),
      c("wel-fitup","Fit-up e montagem","Fit-up & assembly","Preparar, alinhar, ponteiar e controlar montagem antes da soldadura.","Prepare, align, tack and control assembly before welding.","construct-outline","essential","practical",["fit-up","fitup","montagem"],true),
      c("wel-process","Execução do processo","Process execution","Executar o processo qualificado respeitando parâmetros, consumíveis e procedimento.","Execute qualified process respecting parameters, consumables and procedure.","flame-outline","essential","practical",["wel-process","tig","mig","mag","mma","eletrodo"],true),
      c("wel-quality","Controlo visual e dimensional","Visual & dimensional control","Identificar defeitos visuais, controlar dimensão e preparar correções.","Identify visual defects, control dimensions and prepare corrections.","eye-outline","essential","diagnostic",["wel-quality","visual","dimensional"],true),
      c("wel-distortion","Sequência e controlo de deformação","Sequence & distortion control","Escolher sequência e práticas para limitar deformação e retrabalho.","Choose sequence and practices to limit distortion and rework.","git-compare-outline","essential","diagnostic",["distortion","deformacao","sequencia"]),
      c("wel-safety","Preparação segura do trabalho","Safe work preparation","Controlar riscos, preparação da área, gases e equipamentos aplicáveis.","Control hazards, work area preparation, gases and applicable equipment.","shield-outline","essential","responsibility",["hot work","gas","safety"]),
      c("wel-advanced","Processos/materiais avançados","Advanced processes/materials","Especialização adicional por processo, posição ou material.","Additional specialism by process, position or material.","diamond-outline","optional","practical",["inox","alumin","pipe","orbital"]),
      c("wel-lead","Coordenação de montagem/soldadura","Welding/assembly coordination","Coordenar sequência, qualidade e equipas dentro do âmbito profissional.","Coordinate sequence, quality and teams within professional scope.","people-outline","optional","responsibility",["lead","supervisor","coordena"]),
    ],
    regulatory: [],
  },
  {
    professionId: "fire",
    title: "Sistemas de Segurança Contra Incêndio",
    titleEn: "Fire Protection Systems",
    description: "Instalação, deteção, redes, ensaios, manutenção e entrega.",
    descriptionEn: "Installation, detection, networks, testing, maintenance and handover.",
    frameworkNote: "Requisitos legais variam por país e tipo de sistema; a conformidade aparece separada do nível técnico.",
    frameworkNoteEn: "Legal requirements vary by country and system type; compliance is separate from technical level.",
    competencies: [
      c("fire-reading","Projeto e documentação SCI","Fire-system documentation","Interpretar projeto, zonas, dispositivos, redes e especificações.","Interpret design, zones, devices, networks and specifications.","document-text-outline","essential","knowledge",["fire drawing","project","projeto"],true),
      c("fire-install","Instalação","Installation","Instalar suportes, tubagem, cablagem, dispositivos e equipamentos conforme sistema.","Install supports, pipework, wiring, devices and equipment to system requirements.","construct-outline","essential","practical",["fire-install","instalacao"],true),
      c("fire-detection","Deteção e alarme","Detection & alarm","Montar, ligar, testar e diagnosticar elementos de deteção e alarme.","Install, connect, test and diagnose detection and alarm elements.","radio-outline","essential","practical",["fire-detection","detec","alarm"],true),
      c("fire-suppression","Extinção e redes","Suppression & networks","Montar e testar redes e equipamentos de extinção dentro do âmbito técnico.","Install and test suppression networks and equipment within technical scope.","water-outline","essential","practical",["fire-suppression","sprinkler","extinc"],true),
      c("fire-testing","Ensaios e manutenção","Testing & maintenance","Inspecionar, testar, registar e localizar falhas de funcionamento.","Inspect, test, record and locate operating faults.","clipboard-outline","essential","diagnostic",["fire-maintenance","test","maintenance"],true),
      c("fire-handover","Comissionamento e entrega","Commissioning & handover","Verificar interfaces, documentação, resultados de ensaio e entrega do sistema.","Verify interfaces, documentation, test results and system handover.","checkmark-done-outline","essential","responsibility",["commissioning","comissionamento"],true),
      c("fire-integration","Integração de sistemas","System integration","Trabalhar com interfaces entre deteção, extinção, HVAC, BMS ou outros sistemas.","Work with interfaces between detection, suppression, HVAC, BMS or other systems.","git-network-outline","optional","diagnostic",["bms","interface","integration"]),
      c("fire-lead","Coordenação técnica","Technical coordination","Coordenar instalação, ensaios, pendências e equipa técnica.","Coordinate installation, tests, punch items and technical team.","people-outline","optional","responsibility",["supervisor","lead","coordena"]),
    ],
    regulatory: [],
  },
  {
    professionId: "industrial",
    title: "Montagem Industrial",
    titleEn: "Industrial Assembly",
    description: "Preparação, montagem, alinhamento, aperto, controlo e entrega mecânica.",
    descriptionEn: "Preparation, assembly, alignment, bolting, control and mechanical handover.",
    frameworkNote: "Cartões de segurança e acesso ao site são conformidade operacional, não nível técnico.",
    frameworkNoteEn: "Safety and site-access cards are operational compliance, not technical seniority.",
    competencies: [
      c("ind-drawings","Leitura e preparação de montagem","Assembly drawings & preparation","Interpretar desenhos, listas, implantação, tolerâncias e sequência.","Interpret drawings, lists, layout, tolerances and sequence.","map-outline","essential","knowledge",["ind-drawings","drawing","desenho"],true),
      c("ind-assembly","Montagem mecânica","Mechanical assembly","Montar equipamentos, componentes, suportes e estruturas conforme documentação.","Assemble equipment, components, supports and structures to documentation.","construct-outline","essential","practical",["ind-assembly","montagem"],true),
      c("ind-alignment","Alinhamento","Alignment","Executar e verificar alinhamento, nivelamento e posicionamento.","Perform and verify alignment, levelling and positioning.","git-compare-outline","essential","practical",["ind-alignment","alignment","alinhamento"],true),
      c("ind-bolting","Aperto controlado","Controlled bolting","Aplicar sequência, torque/tensionamento e rastreabilidade quando exigida.","Apply sequence, torque/tensioning and traceability where required.","settings-outline","essential","practical",["torque","bolting","aperto"],true),
      c("ind-quality","Controlo de montagem","Assembly quality control","Verificar tolerâncias, interfaces, punch list e condições de entrega.","Verify tolerances, interfaces, punch list and handover conditions.","checkmark-done-outline","essential","diagnostic",["ind-commission","punch","quality"],true),
      c("ind-safe-work","Preparação segura da intervenção","Safe work preparation","Confirmar condições, energia, elevação, ferramentas e interfaces do trabalho.","Confirm conditions, energy, lifting, tools and work interfaces.","shield-outline","essential","responsibility",["loto","permit","lift plan"]),
      c("ind-rigging","Rigging e movimentação","Rigging & handling","Apoiar ou executar movimentação de cargas dentro do âmbito autorizado.","Support or execute load handling within authorised scope.","git-network-outline","optional","practical",["rigging","sling","crane"]),
      c("ind-supervision","Supervisão de montagem","Assembly supervision","Coordenar equipas, sequência, recursos, qualidade e pendências.","Coordinate teams, sequence, resources, quality and punch items.","people-outline","optional","responsibility",["supervisor","lead","encarregado"]),
    ],
    regulatory: [
      { id:"ind-height", title:"Trabalho em altura", titleEn:"Work at height", scope:"site", note:"Quando aplicável à tarefa e ao local.", noteEn:"When applicable to task and site.", aliases:["altura","height"] },
      { id:"ind-powered-access", title:"Plataformas elevatórias", titleEn:"Powered access", scope:"international", note:"A categoria do equipamento deve corresponder à formação/autorização.", noteEn:"Equipment category must match training/authorisation.", aliases:["ipaf","3a","3b","mewp"] },
      { id:"ind-site-access", title:"Acesso e segurança industrial", titleEn:"Industrial access & safety", scope:"site", note:"Pode depender do país, cliente e indústria.", noteEn:"May depend on country, client and industry.", aliases:["vca","scc","atex","france n","site induction"] },
    ],
  },
];

export const worklyLevelGates = [
  { id:"apprentice", label:"Aprendiz", labelEn:"Apprentice", minimum:0, coreCoverage:0, verifiedProjects:0, responsibilityEvidence:0 },
  { id:"junior", label:"Júnior", labelEn:"Junior", minimum:20, coreCoverage:25, verifiedProjects:0, responsibilityEvidence:0 },
  { id:"professional", label:"Profissional", labelEn:"Professional", minimum:45, coreCoverage:60, verifiedProjects:2, responsibilityEvidence:0 },
  { id:"specialist", label:"Especialista", labelEn:"Specialist", minimum:70, coreCoverage:75, verifiedProjects:5, responsibilityEvidence:1 },
  { id:"master", label:"Master", labelEn:"Master", minimum:85, coreCoverage:90, verifiedProjects:8, responsibilityEvidence:2 },
] as const;

export function competencyProfileFor(professionId: string) {
  return competencyProfiles.find((item) => item.professionId === professionId);
}
