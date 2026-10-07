import type Ionicons from "@expo/vector-icons/Ionicons";
import type React from "react";

export type CatalogStage =
  | "foundation"
  | "base"
  | "industrial-access"
  | "technical"
  | "responsibility"
  | "master";

export type CatalogNodeSpec = {
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  stage: CatalogStage;
  family: string;
  scope: string;
  dependsOn?: string[];
};

export type ProfessionCatalogEntry = {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  matches: string[];
  nodes: CatalogNodeSpec[];
};

const common = {
  foundation: (family: string): CatalogNodeSpec => ({
    id: `${family}-foundation`,
    title: "Fundamentos da profissão",
    titleEn: "Trade foundations",
    subtitle: "Formação base e leitura técnica",
    subtitleEn: "Core training and technical reading",
    icon: "school-outline",
    stage: "foundation",
    family,
    scope: "Base profissional",
  }),
};

export const professionCatalog: ProfessionCatalogEntry[] = [
  {
    id: "electromechanics",
    title: "Eletromecânica Industrial",
    titleEn: "Industrial Electromechanics",
    description: "Manutenção, motores, transmissão, diagnóstico e automação industrial",
    descriptionEn: "Maintenance, motors, transmission, diagnostics and industrial automation",
    icon: "hardware-chip-outline",
    matches: ["eletromec", "electromech", "manutencao industrial", "maintenance technician"],
    nodes: [
      common.foundation("electromechanics"),
      { id: "em-mechanical", title: "Mecânica e transmissão", titleEn: "Mechanical & drive systems", subtitle: "Rolamentos, acoplamentos, alinhamento e transmissão", subtitleEn: "Bearings, couplings, alignment and drives", icon: "cog-outline", stage: "base", family: "electromechanics", scope: "Competência profissional", dependsOn: ["electromechanics-foundation"] },
      { id: "em-motors", title: "Motores e acionamentos", titleEn: "Motors & drives", subtitle: "Motores elétricos, variadores e arranque", subtitleEn: "Electric motors, drives and starting", icon: "flash-outline", stage: "technical", family: "electromechanics", scope: "Competência profissional", dependsOn: ["em-mechanical"] },
      { id: "em-diagnostics", title: "Diagnóstico de avarias", titleEn: "Fault diagnostics", subtitle: "Medição, análise e resolução de falhas", subtitleEn: "Measurement, analysis and troubleshooting", icon: "pulse-outline", stage: "technical", family: "electromechanics", scope: "Competência profissional", dependsOn: ["em-motors"] },
      { id: "em-automation", title: "Automação industrial", titleEn: "Industrial automation", subtitle: "Sensores, atuadores, PLC e controlo", subtitleEn: "Sensors, actuators, PLC and control", icon: "git-network-outline", stage: "responsibility", family: "electromechanics", scope: "Especialização técnica", dependsOn: ["em-diagnostics"] },
      { id: "em-lead", title: "Responsabilidade técnica", titleEn: "Technical responsibility", subtitle: "Planeamento, supervisão e melhoria de manutenção", subtitleEn: "Planning, supervision and maintenance improvement", icon: "diamond-outline", stage: "master", family: "electromechanics", scope: "Progressão WORKLY", dependsOn: ["em-automation"] },
    ],
  },
  {
    id: "electrical",
    title: "Eletricidade",
    titleEn: "Electrical",
    description: "Instalações, quadros, medição, manutenção e diagnóstico elétrico",
    descriptionEn: "Installations, panels, measurement, maintenance and electrical diagnostics",
    icon: "flash-outline",
    matches: ["eletric", "electrician", "electrical"],
    nodes: [
      common.foundation("electrical"),
      { id: "el-installation", title: "Instalações elétricas", titleEn: "Electrical installations", subtitle: "Circuitos, proteção, cablagem e quadros", subtitleEn: "Circuits, protection, wiring and panels", icon: "flash-outline", stage: "base", family: "electrical", scope: "Competência profissional", dependsOn: ["electrical-foundation"] },
      { id: "el-testing", title: "Medição e ensaios", titleEn: "Testing & measurement", subtitle: "Continuidade, isolamento, proteção e diagnóstico", subtitleEn: "Continuity, insulation, protection and diagnostics", icon: "speedometer-outline", stage: "technical", family: "electrical", scope: "Competência profissional", dependsOn: ["el-installation"] },
      { id: "el-maintenance", title: "Manutenção elétrica", titleEn: "Electrical maintenance", subtitle: "Avarias, manutenção preventiva e corretiva", subtitleEn: "Faults, preventive and corrective maintenance", icon: "construct-outline", stage: "technical", family: "electrical", scope: "Competência profissional", dependsOn: ["el-testing"] },
      { id: "el-supervision", title: "Supervisão elétrica", titleEn: "Electrical supervision", subtitle: "Planeamento, consignação e responsabilidade", subtitleEn: "Planning, isolation and responsibility", icon: "shield-checkmark-outline", stage: "responsibility", family: "electrical", scope: "Progressão WORKLY", dependsOn: ["el-maintenance"] },
      { id: "el-master", title: "Especialista elétrico", titleEn: "Electrical specialist", subtitle: "Sistemas avançados e coordenação técnica", subtitleEn: "Advanced systems and technical coordination", icon: "diamond-outline", stage: "master", family: "electrical", scope: "Progressão WORKLY", dependsOn: ["el-supervision"] },
    ],
  },
  {
    id: "hvac",
    title: "AVAC e Refrigeração",
    titleEn: "HVAC & Refrigeration",
    description: "Climatização, refrigeração, bombas de calor e diagnóstico",
    descriptionEn: "Air conditioning, refrigeration, heat pumps and diagnostics",
    icon: "snow-outline",
    matches: ["hvac", "avac", "climat", "refrig", "frigor"],
    nodes: [
      common.foundation("hvac"),
      { id: "hvac-installation", title: "Instalação AVAC", titleEn: "HVAC installation", subtitle: "Tubagem, unidades, drenagem e ligações", subtitleEn: "Pipework, units, drainage and connections", icon: "snow-outline", stage: "base", family: "hvac", scope: "Competência profissional", dependsOn: ["hvac-foundation"] },
      { id: "hvac-refrigeration", title: "Circuito frigorífico", titleEn: "Refrigeration circuit", subtitle: "Vácuo, carga, pressões e controlo", subtitleEn: "Vacuum, charging, pressures and control", icon: "thermometer-outline", stage: "technical", family: "hvac", scope: "Competência profissional", dependsOn: ["hvac-installation"] },
      { id: "hvac-diagnostics", title: "Diagnóstico AVAC", titleEn: "HVAC diagnostics", subtitle: "Falhas elétricas, frigoríficas e de controlo", subtitleEn: "Electrical, refrigeration and control faults", icon: "pulse-outline", stage: "technical", family: "hvac", scope: "Competência profissional", dependsOn: ["hvac-refrigeration"] },
      { id: "hvac-efficiency", title: "Eficiência e comissionamento", titleEn: "Efficiency & commissioning", subtitle: "Regulação, desempenho e entrega técnica", subtitleEn: "Balancing, performance and technical handover", icon: "leaf-outline", stage: "responsibility", family: "hvac", scope: "Especialização técnica", dependsOn: ["hvac-diagnostics"] },
      { id: "hvac-master", title: "Especialista AVAC", titleEn: "HVAC specialist", subtitle: "Sistemas complexos e responsabilidade técnica", subtitleEn: "Complex systems and technical responsibility", icon: "diamond-outline", stage: "master", family: "hvac", scope: "Progressão WORKLY", dependsOn: ["hvac-efficiency"] },
    ],
  },
  {
    id: "plumbing",
    title: "Canalização",
    titleEn: "Plumbing",
    description: "Redes de água, saneamento, tubagem e ensaios",
    descriptionEn: "Water networks, drainage, pipework and testing",
    icon: "water-outline",
    matches: ["canal", "plumb", "hidraul"],
    nodes: [
      common.foundation("plumbing"),
      { id: "pl-water", title: "Redes de água", titleEn: "Water networks", subtitle: "Distribuição, válvulas e equipamentos", subtitleEn: "Distribution, valves and equipment", icon: "water-outline", stage: "base", family: "plumbing", scope: "Competência profissional", dependsOn: ["plumbing-foundation"] },
      { id: "pl-drainage", title: "Saneamento e drenagem", titleEn: "Drainage & sanitation", subtitle: "Redes residuais e pluviais", subtitleEn: "Wastewater and rainwater networks", icon: "git-merge-outline", stage: "technical", family: "plumbing", scope: "Competência profissional", dependsOn: ["pl-water"] },
      { id: "pl-testing", title: "Ensaios e estanquidade", titleEn: "Testing & tightness", subtitle: "Pressão, estanquidade e diagnóstico", subtitleEn: "Pressure, tightness and diagnostics", icon: "speedometer-outline", stage: "technical", family: "plumbing", scope: "Competência profissional", dependsOn: ["pl-drainage"] },
      { id: "pl-systems", title: "Sistemas técnicos", titleEn: "Technical systems", subtitle: "Bombagem, AQS e redes técnicas", subtitleEn: "Pumping, hot water and technical networks", icon: "options-outline", stage: "responsibility", family: "plumbing", scope: "Especialização técnica", dependsOn: ["pl-testing"] },
      { id: "pl-master", title: "Especialista de redes", titleEn: "Pipe systems specialist", subtitle: "Coordenação e diagnóstico avançado", subtitleEn: "Coordination and advanced diagnostics", icon: "diamond-outline", stage: "master", family: "plumbing", scope: "Progressão WORKLY", dependsOn: ["pl-systems"] },
    ],
  },
  {
    id: "solar",
    title: "Solar Fotovoltaico",
    titleEn: "Solar Photovoltaics",
    description: "Montagem, ligação, comissionamento e manutenção fotovoltaica",
    descriptionEn: "Installation, connection, commissioning and PV maintenance",
    icon: "sunny-outline",
    matches: ["solar", "fotovolt", "photovolta"],
    nodes: [
      common.foundation("solar"),
      { id: "pv-mounting", title: "Montagem fotovoltaica", titleEn: "PV mounting", subtitle: "Estruturas, módulos e segurança de instalação", subtitleEn: "Structures, modules and installation safety", icon: "grid-outline", stage: "base", family: "solar", scope: "Competência profissional", dependsOn: ["solar-foundation"] },
      { id: "pv-dc-ac", title: "Circuitos DC/AC", titleEn: "DC/AC circuits", subtitle: "Strings, inversores, proteção e ligação", subtitleEn: "Strings, inverters, protection and connection", icon: "flash-outline", stage: "technical", family: "solar", scope: "Competência profissional", dependsOn: ["pv-mounting"] },
      { id: "pv-commissioning", title: "Comissionamento", titleEn: "Commissioning", subtitle: "Ensaios, parametrização e entrega", subtitleEn: "Testing, setup and handover", icon: "checkmark-done-outline", stage: "technical", family: "solar", scope: "Competência profissional", dependsOn: ["pv-dc-ac"] },
      { id: "pv-maintenance", title: "Diagnóstico e manutenção", titleEn: "Diagnostics & maintenance", subtitle: "Monitorização, avarias e desempenho", subtitleEn: "Monitoring, faults and performance", icon: "pulse-outline", stage: "responsibility", family: "solar", scope: "Especialização técnica", dependsOn: ["pv-commissioning"] },
      { id: "pv-master", title: "Especialista fotovoltaico", titleEn: "PV specialist", subtitle: "Sistemas complexos, armazenamento e coordenação", subtitleEn: "Complex systems, storage and coordination", icon: "diamond-outline", stage: "master", family: "solar", scope: "Progressão WORKLY", dependsOn: ["pv-maintenance"] },
    ],
  },
  {
    id: "welding",
    title: "Soldadura e Estruturas Metálicas",
    titleEn: "Welding & Metal Structures",
    description: "Preparação, processos de soldadura, montagem e controlo visual",
    descriptionEn: "Preparation, welding processes, assembly and visual control",
    icon: "flame-outline",
    matches: ["soldad", "weld", "metal", "serralh"],
    nodes: [
      common.foundation("welding"),
      { id: "wel-prep", title: "Preparação e montagem", titleEn: "Preparation & fit-up", subtitle: "Leitura, preparação de junta e montagem", subtitleEn: "Drawing, joint preparation and fit-up", icon: "cut-outline", stage: "base", family: "welding", scope: "Competência profissional", dependsOn: ["welding-foundation"] },
      { id: "wel-process", title: "Processo de soldadura", titleEn: "Welding process", subtitle: "Execução conforme processo e procedimento", subtitleEn: "Execution to process and procedure", icon: "flame-outline", stage: "technical", family: "welding", scope: "Qualificação específica por processo/material", dependsOn: ["wel-prep"] },
      { id: "wel-quality", title: "Qualidade visual", titleEn: "Visual quality", subtitle: "Defeitos, acabamento e controlo dimensional", subtitleEn: "Defects, finishing and dimensional control", icon: "eye-outline", stage: "technical", family: "welding", scope: "Competência profissional", dependsOn: ["wel-process"] },
      { id: "wel-assembly", title: "Estruturas e montagem", titleEn: "Structures & assembly", subtitle: "Montagem estrutural e sequência de trabalho", subtitleEn: "Structural assembly and work sequence", icon: "construct-outline", stage: "responsibility", family: "welding", scope: "Especialização técnica", dependsOn: ["wel-quality"] },
      { id: "wel-master", title: "Especialista de soldadura", titleEn: "Welding specialist", subtitle: "Processos avançados e coordenação", subtitleEn: "Advanced processes and coordination", icon: "diamond-outline", stage: "master", family: "welding", scope: "Progressão WORKLY", dependsOn: ["wel-assembly"] },
    ],
  },
  {
    id: "fire",
    title: "Sistemas de Segurança Contra Incêndio",
    titleEn: "Fire Protection Systems",
    description: "Deteção, extinção, redes, ensaios e manutenção",
    descriptionEn: "Detection, suppression, networks, testing and maintenance",
    icon: "shield-outline",
    matches: ["incend", "fire", "sprinkler", "detec"],
    nodes: [
      common.foundation("fire"),
      { id: "fire-install", title: "Instalação de sistemas", titleEn: "System installation", subtitle: "Tubagem, suportes, dispositivos e cablagem", subtitleEn: "Pipework, supports, devices and wiring", icon: "construct-outline", stage: "base", family: "fire", scope: "Competência profissional", dependsOn: ["fire-foundation"] },
      { id: "fire-detection", title: "Deteção e alarme", titleEn: "Detection & alarm", subtitle: "Detetores, centrais, loops e ensaios", subtitleEn: "Detectors, panels, loops and testing", icon: "radio-outline", stage: "technical", family: "fire", scope: "Especialização técnica", dependsOn: ["fire-install"] },
      { id: "fire-suppression", title: "Extinção e redes", titleEn: "Suppression & networks", subtitle: "Redes de água, sprinklers e equipamentos", subtitleEn: "Water networks, sprinklers and equipment", icon: "water-outline", stage: "technical", family: "fire", scope: "Especialização técnica", dependsOn: ["fire-install"] },
      { id: "fire-maintenance", title: "Ensaios e manutenção", titleEn: "Testing & maintenance", subtitle: "Inspeção, manutenção e registo", subtitleEn: "Inspection, maintenance and records", icon: "clipboard-outline", stage: "responsibility", family: "fire", scope: "Competência profissional", dependsOn: ["fire-detection", "fire-suppression"] },
      { id: "fire-master", title: "Especialista SCI", titleEn: "Fire systems specialist", subtitle: "Comissionamento e coordenação técnica", subtitleEn: "Commissioning and technical coordination", icon: "diamond-outline", stage: "master", family: "fire", scope: "Progressão WORKLY", dependsOn: ["fire-maintenance"] },
    ],
  },
  {
    id: "industrial",
    title: "Montagem Industrial",
    titleEn: "Industrial Assembly",
    description: "Montagem mecânica, alinhamento, aperto e equipamentos industriais",
    descriptionEn: "Mechanical assembly, alignment, bolting and industrial equipment",
    icon: "construct-outline",
    matches: ["montag", "industrial assembly", "mechanical fitter", "mecanico montador", "equipament"],
    nodes: [
      common.foundation("industrial"),
      { id: "ind-drawings", title: "Leitura e preparação", titleEn: "Drawings & preparation", subtitle: "Desenho técnico, implantação e preparação", subtitleEn: "Technical drawings, layout and preparation", icon: "map-outline", stage: "base", family: "industrial", scope: "Competência profissional", dependsOn: ["industrial-foundation"] },
      { id: "ind-assembly", title: "Montagem mecânica", titleEn: "Mechanical assembly", subtitle: "Equipamentos, estruturas e componentes", subtitleEn: "Equipment, structures and components", icon: "construct-outline", stage: "technical", family: "industrial", scope: "Competência profissional", dependsOn: ["ind-drawings"] },
      { id: "ind-alignment", title: "Alinhamento e aperto", titleEn: "Alignment & bolting", subtitle: "Alinhamento, torque e controlo de montagem", subtitleEn: "Alignment, torque and assembly control", icon: "git-compare-outline", stage: "technical", family: "industrial", scope: "Competência profissional", dependsOn: ["ind-assembly"] },
      { id: "ind-commission", title: "Preparação para comissionamento", titleEn: "Commissioning preparation", subtitle: "Verificação, punch list e entrega", subtitleEn: "Verification, punch list and handover", icon: "checkmark-done-outline", stage: "responsibility", family: "industrial", scope: "Especialização técnica", dependsOn: ["ind-alignment"] },
      { id: "ind-master", title: "Supervisor de montagem", titleEn: "Assembly supervisor", subtitle: "Coordenação de equipas e sequência de montagem", subtitleEn: "Team coordination and assembly sequence", icon: "diamond-outline", stage: "master", family: "industrial", scope: "Progressão WORKLY", dependsOn: ["ind-commission"] },
    ],
  },
];

export type SpecialtyCatalogEntry = {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  minScore: number;
  recommendedProfessions?: string[];
  certificateAliases: string[];
};

export const specialtyCatalog: SpecialtyCatalogEntry[] = [
  { id: "work-height", title: "Trabalho em altura", titleEn: "Work at height", description: "Acesso e prevenção de queda", descriptionEn: "Access and fall prevention", icon: "body-outline", minScore: 5, certificateAliases: ["altura", "height"] },
  { id: "ipaf-3ab", title: "Plataformas elevatórias", titleEn: "Powered access", description: "Operação de plataformas móveis", descriptionEn: "Mobile elevated work platforms", icon: "arrow-up-circle-outline", minScore: 10, certificateAliases: ["ipaf", "3a", "3b"] },
  { id: "confined-space", title: "Espaços confinados", titleEn: "Confined spaces", description: "Acesso, vigilância e resgate", descriptionEn: "Access, standby and rescue", icon: "contract-outline", minScore: 10, certificateAliases: ["confinado", "confined"] },
  { id: "loto", title: "LOTO / Consignação", titleEn: "LOTO / Isolation", description: "Isolamento seguro de energias", descriptionEn: "Safe energy isolation", icon: "lock-closed-outline", minScore: 10, certificateAliases: ["loto", "lockout", "consign"] },
  { id: "first-aid", title: "Primeiros socorros", titleEn: "First aid", description: "Resposta inicial em emergência", descriptionEn: "Initial emergency response", icon: "medkit-outline", minScore: 5, certificateAliases: ["socorros", "first aid", "sst"] },
  { id: "rigging", title: "Rigging / Slinging", titleEn: "Rigging / Slinging", description: "Preparação e orientação de cargas", descriptionEn: "Load preparation and guidance", icon: "git-compare-outline", minScore: 15, recommendedProfessions: ["industrial", "welding", "electromechanics"], certificateAliases: ["rigging", "sling"] },
  { id: "overhead-crane", title: "Ponte rolante", titleEn: "Overhead crane", description: "Operação de equipamento de elevação", descriptionEn: "Lifting equipment operation", icon: "git-network-outline", minScore: 15, certificateAliases: ["ponte rolante", "overhead crane", "r484"] },
  { id: "forklift", title: "Empilhador", titleEn: "Forklift", description: "Movimentação industrial de cargas", descriptionEn: "Industrial load handling", icon: "cube-outline", minScore: 10, certificateAliases: ["empilhador", "forklift", "r489"] },
  { id: "atex", title: "ATEX", titleEn: "ATEX", description: "Trabalho em atmosferas potencialmente explosivas", descriptionEn: "Work in potentially explosive atmospheres", icon: "warning-outline", minScore: 20, recommendedProfessions: ["electrical", "electromechanics", "industrial"], certificateAliases: ["atex", "iecex"] },
  { id: "fgas", title: "F-Gas", titleEn: "F-Gas", description: "Especialização regulamentada em gases fluorados", descriptionEn: "Regulated fluorinated-gas specialization", icon: "snow-outline", minScore: 15, recommendedProfessions: ["hvac"], certificateAliases: ["f-gas", "fgas", "fluor"] },
  { id: "solar-extra", title: "Fotovoltaico", titleEn: "Photovoltaics", description: "Especialidade adicional em sistemas solares", descriptionEn: "Additional specialty in solar systems", icon: "sunny-outline", minScore: 20, recommendedProfessions: ["electrical", "electromechanics"], certificateAliases: ["fotovolta", "photovolta", "solar"] },
  { id: "fire-extra", title: "Sistemas de incêndio", titleEn: "Fire systems", description: "Especialidade adicional em proteção contra incêndio", descriptionEn: "Additional specialty in fire protection", icon: "shield-outline", minScore: 20, recommendedProfessions: ["electrical", "plumbing", "industrial"], certificateAliases: ["incend", "fire", "sprinkler"] },
];

export function normalizeProfession(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function findProfessionDefinition(value: string) {
  const normalized = normalizeProfession(value);
  return professionCatalog.find((item) =>
    item.matches.some((match) => normalized.includes(normalizeProfession(match))),
  );
}
