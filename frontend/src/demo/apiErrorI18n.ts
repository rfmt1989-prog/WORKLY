import type { LanguageCode } from "./types";

type Row = Record<LanguageCode, string>;

const rows: Record<string, Row> = {
  "Sessão inválida ou expirada.": {
    pt: "Sessão inválida ou expirada.", en: "Invalid or expired session.", fr: "Session invalide ou expirée.", es: "Sesión no válida o caducada.", ro: "Sesiune invalidă sau expirată.", de: "Ungültige oder abgelaufene Sitzung.", nl: "Ongeldige of verlopen sessie."
  },
  "Escolha Worker ou Company.": {
    pt: "Escolha Worker ou Company.", en: "Choose Worker or Company.", fr: "Choisissez Travailleur ou Entreprise.", es: "Elige Trabajador o Empresa.", ro: "Alege Lucrător sau Companie.", de: "Wähle Mitarbeiter oder Unternehmen.", nl: "Kies Medewerker of Bedrijf."
  },
  "Só pode editar a sua empresa.": {
    pt: "Só pode editar a sua empresa.", en: "You can only edit your own company.", fr: "Vous ne pouvez modifier que votre propre entreprise.", es: "Solo puedes editar tu propia empresa.", ro: "Poți edita doar propria companie.", de: "Du kannst nur dein eigenes Unternehmen bearbeiten.", nl: "Je kunt alleen je eigen bedrijf bewerken."
  },
  "Equipa de outra empresa.": {
    pt: "Equipa de outra empresa.", en: "This team belongs to another company.", fr: "Cette équipe appartient à une autre entreprise.", es: "Este equipo pertenece a otra empresa.", ro: "Această echipă aparține altei companii.", de: "Dieses Team gehört zu einem anderen Unternehmen.", nl: "Dit team hoort bij een ander bedrijf."
  },
  "Escolha um trabalhador.": {
    pt: "Escolha um trabalhador.", en: "Choose a worker.", fr: "Choisissez un travailleur.", es: "Elige un trabajador.", ro: "Alege un lucrător.", de: "Wähle einen Mitarbeiter.", nl: "Kies een medewerker."
  },
  "Escolha um líder.": {
    pt: "Escolha um líder.", en: "Choose a leader.", fr: "Choisissez un responsable.", es: "Elige un responsable.", ro: "Alege un lider.", de: "Wähle einen Leiter.", nl: "Kies een leider."
  },
  "Raio GPS inválido.": {
    pt: "Raio GPS inválido.", en: "Invalid GPS radius.", fr: "Rayon GPS invalide.", es: "Radio GPS no válido.", ro: "Rază GPS invalidă.", de: "Ungültiger GPS-Radius.", nl: "Ongeldige GPS-straal."
  },
  "O raio GPS deve ficar entre 50 e 2000 m.": {
    pt: "O raio GPS deve ficar entre 50 e 2000 m.", en: "The GPS radius must be between 50 and 2000 m.", fr: "Le rayon GPS doit être compris entre 50 et 2000 m.", es: "El radio GPS debe estar entre 50 y 2000 m.", ro: "Raza GPS trebuie să fie între 50 și 2000 m.", de: "Der GPS-Radius muss zwischen 50 und 2000 m liegen.", nl: "De GPS-straal moet tussen 50 en 2000 m liggen."
  },
  "Obra de outra empresa.": {
    pt: "Obra de outra empresa.", en: "This project belongs to another company.", fr: "Ce chantier appartient à une autre entreprise.", es: "Esta obra pertenece a otra empresa.", ro: "Acest șantier aparține altei companii.", de: "Diese Baustelle gehört zu einem anderen Unternehmen.", nl: "Deze bouwplaats hoort bij een ander bedrijf."
  },
  "Escolha uma equipa ou trabalhador.": {
    pt: "Escolha uma equipa ou trabalhador.", en: "Choose a team or worker.", fr: "Choisissez une équipe ou un travailleur.", es: "Elige un equipo o trabajador.", ro: "Alege o echipă sau un lucrător.", de: "Wähle ein Team oder einen Mitarbeiter.", nl: "Kies een team of medewerker."
  },
  "Já existe uma entrada ativa.": {
    pt: "Já existe uma entrada ativa.", en: "There is already an active check-in.", fr: "Une arrivée active existe déjà.", es: "Ya existe una entrada activa.", ro: "Există deja o intrare activă.", de: "Es gibt bereits einen aktiven Check-in.", nl: "Er is al een actieve check-in."
  },
  "Não existe obra atribuída.": {
    pt: "Não existe obra atribuída.", en: "No project is assigned.", fr: "Aucun chantier n’est attribué.", es: "No hay ninguna obra asignada.", ro: "Nu este atribuit niciun șantier.", de: "Keine Baustelle ist zugewiesen.", nl: "Er is geen bouwplaats toegewezen."
  },
  "Localização GPS incompleta para validar a entrada.": {
    pt: "Localização GPS incompleta para validar a entrada.", en: "Incomplete GPS location for check-in validation.", fr: "Localisation GPS incomplète pour valider l’arrivée.", es: "Ubicación GPS incompleta para validar la entrada.", ro: "Locație GPS incompletă pentru validarea intrării.", de: "Unvollständiger GPS-Standort zur Check-in-Prüfung.", nl: "Onvolledige GPS-locatie voor validatie van de check-in."
  },
  "A obra ainda não tem coordenadas GPS configuradas.": {
    pt: "A obra ainda não tem coordenadas GPS configuradas.", en: "The project does not yet have GPS coordinates configured.", fr: "Le chantier n’a pas encore de coordonnées GPS configurées.", es: "La obra aún no tiene coordenadas GPS configuradas.", ro: "Șantierul nu are încă coordonate GPS configurate.", de: "Für die Baustelle sind noch keine GPS-Koordinaten konfiguriert.", nl: "Voor de bouwplaats zijn nog geen GPS-coördinaten ingesteld."
  },
  "Não existe entrada ativa.": {
    pt: "Não existe entrada ativa.", en: "There is no active check-in.", fr: "Aucune arrivée active.", es: "No existe ninguna entrada activa.", ro: "Nu există nicio intrare activă.", de: "Es gibt keinen aktiven Check-in.", nl: "Er is geen actieve check-in."
  },
  "Contrato não autorizado.": {
    pt: "Contrato não autorizado.", en: "Contract access is not authorised.", fr: "L’accès au contrat n’est pas autorisé.", es: "El acceso al contrato no está autorizado.", ro: "Accesul la contract nu este autorizat.", de: "Der Zugriff auf den Vertrag ist nicht autorisiert.", nl: "Toegang tot het contract is niet toegestaan."
  }
};

const outsidePattern = /^Check-in fora da zona autorizada da obra \((\d+) m; máximo (\d+) m\)\.$/;

export function localizeApiError(language: LanguageCode, message: string) {
  const direct = rows[message];
  if (direct) return direct[language];
  const outside = outsidePattern.exec(message);
  if (!outside) return message;
  const [, distance, radius] = outside;
  const templates: Row = {
    pt: `Check-in fora da zona autorizada da obra (${distance} m; máximo ${radius} m).`,
    en: `Check-in outside the authorised site zone (${distance} m; maximum ${radius} m).`,
    fr: `Arrivée hors de la zone autorisée du chantier (${distance} m ; maximum ${radius} m).`,
    es: `Entrada fuera de la zona autorizada de la obra (${distance} m; máximo ${radius} m).`,
    ro: `Intrare în afara zonei autorizate a șantierului (${distance} m; maximum ${radius} m).`,
    de: `Check-in außerhalb der zulässigen Baustellenzone (${distance} m; maximal ${radius} m).`,
    nl: `Check-in buiten de toegestane bouwplaatszone (${distance} m; maximaal ${radius} m).`,
  };
  return templates[language];
}
