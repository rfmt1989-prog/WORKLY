import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { CompanyAccessRole, CompanyPermission, LanguageCode } from "@/src/demo/types";

import { roleAccent, workspaceColors } from "./primitives";

type AccessMember = {
  id: string;
  company_id: string;
  user_id: string;
  email: string;
  name: string;
  access_role: CompanyAccessRole;
  status: string;
};

type AccessInvitation = {
  token: string;
  company_id: string;
  email: string;
  name: string;
  access_role: CompanyAccessRole;
  status: string;
  expires_at: string;
};

type AccessPayload = {
  current_role: CompanyAccessRole;
  permissions: CompanyPermission[];
  members: AccessMember[];
  invitations: AccessInvitation[];
  role_catalog: Record<CompanyAccessRole, CompanyPermission[]>;
};

type AccessCopy = {
  title: string;
  subtitle: string;
  yourRole: string;
  members: string;
  invitations: string;
  invite: string;
  inviteTitle: string;
  name: string;
  email: string;
  role: string;
  sendInvite: string;
  inviteCreated: string;
  inviteCode: string;
  expires: string;
  noInvites: string;
  noMembers: string;
  readOnly: string;
  permissions: string;
  active: string;
  changeRole: string;
  remove: string;
  loading: string;
  retry: string;
  required: string;
  admin: string;
  manager: string;
  hr: string;
  supervisor: string;
};

const accessCopy: Record<LanguageCode, AccessCopy> = {
  pt: {
    title: "Centro de Acessos",
    subtitle: "Utilizadores, funções e permissões da empresa.",
    yourRole: "O teu acesso",
    members: "Membros",
    invitations: "Convites pendentes",
    invite: "Novo acesso",
    inviteTitle: "Convidar utilizador",
    name: "Nome",
    email: "Email",
    role: "Função",
    sendInvite: "Criar convite",
    inviteCreated: "Convite criado. Partilha este código com o utilizador.",
    inviteCode: "Código de convite",
    expires: "Expira",
    noInvites: "Sem convites pendentes.",
    noMembers: "Sem membros registados.",
    readOnly: "Apenas o Admin pode gerir acessos.",
    permissions: "Permissões ativas",
    active: "Ativo",
    changeRole: "Alterar função",
    remove: "Remover",
    loading: "A carregar acessos...",
    retry: "Tentar novamente",
    required: "Preenche nome e email.",
    admin: "Admin",
    manager: "Gestor",
    hr: "RH",
    supervisor: "Encarregado",
  },
  en: {
    title: "Access Center",
    subtitle: "Company users, roles and permissions.",
    yourRole: "Your access",
    members: "Members",
    invitations: "Pending invitations",
    invite: "New access",
    inviteTitle: "Invite user",
    name: "Name",
    email: "Email",
    role: "Role",
    sendInvite: "Create invitation",
    inviteCreated: "Invitation created. Share this code with the user.",
    inviteCode: "Invitation code",
    expires: "Expires",
    noInvites: "No pending invitations.",
    noMembers: "No registered members.",
    readOnly: "Only an Admin can manage access.",
    permissions: "Active permissions",
    active: "Active",
    changeRole: "Change role",
    remove: "Remove",
    loading: "Loading access...",
    retry: "Try again",
    required: "Enter a name and email.",
    admin: "Admin",
    manager: "Manager",
    hr: "HR",
    supervisor: "Supervisor",
  },
  fr: {
    title: "Centre d’accès",
    subtitle: "Utilisateurs, rôles et autorisations de l’entreprise.",
    yourRole: "Votre accès",
    members: "Membres",
    invitations: "Invitations en attente",
    invite: "Nouvel accès",
    inviteTitle: "Inviter un utilisateur",
    name: "Nom",
    email: "E-mail",
    role: "Rôle",
    sendInvite: "Créer l’invitation",
    inviteCreated: "Invitation créée. Partagez ce code avec l’utilisateur.",
    inviteCode: "Code d’invitation",
    expires: "Expire",
    noInvites: "Aucune invitation en attente.",
    noMembers: "Aucun membre enregistré.",
    readOnly: "Seul un Admin peut gérer les accès.",
    permissions: "Autorisations actives",
    active: "Actif",
    changeRole: "Changer le rôle",
    remove: "Supprimer",
    loading: "Chargement des accès...",
    retry: "Réessayer",
    required: "Saisissez le nom et l’e-mail.",
    admin: "Admin",
    manager: "Gestionnaire",
    hr: "RH",
    supervisor: "Chef d’équipe",
  },
  es: {
    title: "Centro de Accesos",
    subtitle: "Usuarios, roles y permisos de la empresa.",
    yourRole: "Tu acceso",
    members: "Miembros",
    invitations: "Invitaciones pendientes",
    invite: "Nuevo acceso",
    inviteTitle: "Invitar usuario",
    name: "Nombre",
    email: "Email",
    role: "Rol",
    sendInvite: "Crear invitación",
    inviteCreated: "Invitación creada. Comparte este código con el usuario.",
    inviteCode: "Código de invitación",
    expires: "Caduca",
    noInvites: "No hay invitaciones pendientes.",
    noMembers: "No hay miembros registrados.",
    readOnly: "Solo un Admin puede gestionar accesos.",
    permissions: "Permisos activos",
    active: "Activo",
    changeRole: "Cambiar rol",
    remove: "Eliminar",
    loading: "Cargando accesos...",
    retry: "Intentar de nuevo",
    required: "Introduce nombre y email.",
    admin: "Admin",
    manager: "Gestor",
    hr: "RR. HH.",
    supervisor: "Encargado",
  },
  ro: {
    title: "Centru de Acces",
    subtitle: "Utilizatori, roluri și permisiuni ale companiei.",
    yourRole: "Accesul tău",
    members: "Membri",
    invitations: "Invitații în așteptare",
    invite: "Acces nou",
    inviteTitle: "Invită utilizator",
    name: "Nume",
    email: "E-mail",
    role: "Rol",
    sendInvite: "Creează invitația",
    inviteCreated: "Invitația a fost creată. Distribuie acest cod utilizatorului.",
    inviteCode: "Cod de invitație",
    expires: "Expiră",
    noInvites: "Nu există invitații în așteptare.",
    noMembers: "Nu există membri înregistrați.",
    readOnly: "Doar un Admin poate gestiona accesul.",
    permissions: "Permisiuni active",
    active: "Activ",
    changeRole: "Schimbă rolul",
    remove: "Elimină",
    loading: "Se încarcă accesul...",
    retry: "Încearcă din nou",
    required: "Completează numele și e-mailul.",
    admin: "Admin",
    manager: "Manager",
    hr: "HR",
    supervisor: "Șef de echipă",
  },
  de: {
    title: "Zugriffszentrale",
    subtitle: "Benutzer, Rollen und Berechtigungen des Unternehmens.",
    yourRole: "Dein Zugriff",
    members: "Mitglieder",
    invitations: "Offene Einladungen",
    invite: "Neuer Zugriff",
    inviteTitle: "Benutzer einladen",
    name: "Name",
    email: "E-Mail",
    role: "Rolle",
    sendInvite: "Einladung erstellen",
    inviteCreated: "Einladung erstellt. Teile diesen Code mit dem Benutzer.",
    inviteCode: "Einladungscode",
    expires: "Läuft ab",
    noInvites: "Keine offenen Einladungen.",
    noMembers: "Keine registrierten Mitglieder.",
    readOnly: "Nur ein Admin kann Zugriffe verwalten.",
    permissions: "Aktive Berechtigungen",
    active: "Aktiv",
    changeRole: "Rolle ändern",
    remove: "Entfernen",
    loading: "Zugriffe werden geladen...",
    retry: "Erneut versuchen",
    required: "Name und E-Mail eingeben.",
    admin: "Admin",
    manager: "Manager",
    hr: "Personal",
    supervisor: "Vorarbeiter",
  },
  nl: {
    title: "Toegangscentrum",
    subtitle: "Gebruikers, rollen en rechten van het bedrijf.",
    yourRole: "Jouw toegang",
    members: "Leden",
    invitations: "Openstaande uitnodigingen",
    invite: "Nieuwe toegang",
    inviteTitle: "Gebruiker uitnodigen",
    name: "Naam",
    email: "E-mail",
    role: "Rol",
    sendInvite: "Uitnodiging maken",
    inviteCreated: "Uitnodiging aangemaakt. Deel deze code met de gebruiker.",
    inviteCode: "Uitnodigingscode",
    expires: "Verloopt",
    noInvites: "Geen openstaande uitnodigingen.",
    noMembers: "Geen geregistreerde leden.",
    readOnly: "Alleen een Admin kan toegang beheren.",
    permissions: "Actieve rechten",
    active: "Actief",
    changeRole: "Rol wijzigen",
    remove: "Verwijderen",
    loading: "Toegang laden...",
    retry: "Opnieuw proberen",
    required: "Vul naam en e-mail in.",
    admin: "Admin",
    manager: "Manager",
    hr: "HR",
    supervisor: "Voorman",
  },
};

const permissionCopy: Record<LanguageCode, Record<CompanyPermission, string>> = {
  pt: {
    "access.manage": "Gerir acessos",
    "company.manage": "Gerir empresa",
    "workers.read": "Ver trabalhadores",
    "workers.manage": "Gerir trabalhadores",
    "teams.read": "Ver equipas",
    "teams.manage": "Gerir equipas",
    "projects.read": "Ver obras",
    "projects.manage": "Gerir obras",
    "attendance.read": "Ver presenças",
    "documents.read": "Ver documentos",
    "documents.manage": "Gerir documentos",
    "operations.read": "Ver operações",
  },
  en: {
    "access.manage": "Manage access",
    "company.manage": "Manage company",
    "workers.read": "View workers",
    "workers.manage": "Manage workers",
    "teams.read": "View teams",
    "teams.manage": "Manage teams",
    "projects.read": "View projects",
    "projects.manage": "Manage projects",
    "attendance.read": "View attendance",
    "documents.read": "View documents",
    "documents.manage": "Manage documents",
    "operations.read": "View operations",
  },
  fr: {
    "access.manage": "Gérer les accès",
    "company.manage": "Gérer l’entreprise",
    "workers.read": "Voir les travailleurs",
    "workers.manage": "Gérer les travailleurs",
    "teams.read": "Voir les équipes",
    "teams.manage": "Gérer les équipes",
    "projects.read": "Voir les chantiers",
    "projects.manage": "Gérer les chantiers",
    "attendance.read": "Voir les présences",
    "documents.read": "Voir les documents",
    "documents.manage": "Gérer les documents",
    "operations.read": "Voir les opérations",
  },
  es: {
    "access.manage": "Gestionar accesos",
    "company.manage": "Gestionar empresa",
    "workers.read": "Ver trabajadores",
    "workers.manage": "Gestionar trabajadores",
    "teams.read": "Ver equipos",
    "teams.manage": "Gestionar equipos",
    "projects.read": "Ver obras",
    "projects.manage": "Gestionar obras",
    "attendance.read": "Ver asistencia",
    "documents.read": "Ver documentos",
    "documents.manage": "Gestionar documentos",
    "operations.read": "Ver operaciones",
  },
  ro: {
    "access.manage": "Gestionează accesul",
    "company.manage": "Gestionează compania",
    "workers.read": "Vezi lucrătorii",
    "workers.manage": "Gestionează lucrătorii",
    "teams.read": "Vezi echipele",
    "teams.manage": "Gestionează echipele",
    "projects.read": "Vezi șantierele",
    "projects.manage": "Gestionează șantierele",
    "attendance.read": "Vezi prezența",
    "documents.read": "Vezi documentele",
    "documents.manage": "Gestionează documentele",
    "operations.read": "Vezi operațiunile",
  },
  de: {
    "access.manage": "Zugriffe verwalten",
    "company.manage": "Unternehmen verwalten",
    "workers.read": "Mitarbeiter ansehen",
    "workers.manage": "Mitarbeiter verwalten",
    "teams.read": "Teams ansehen",
    "teams.manage": "Teams verwalten",
    "projects.read": "Baustellen ansehen",
    "projects.manage": "Baustellen verwalten",
    "attendance.read": "Anwesenheit ansehen",
    "documents.read": "Dokumente ansehen",
    "documents.manage": "Dokumente verwalten",
    "operations.read": "Betrieb ansehen",
  },
  nl: {
    "access.manage": "Toegang beheren",
    "company.manage": "Bedrijf beheren",
    "workers.read": "Werknemers bekijken",
    "workers.manage": "Werknemers beheren",
    "teams.read": "Teams bekijken",
    "teams.manage": "Teams beheren",
    "projects.read": "Projecten bekijken",
    "projects.manage": "Projecten beheren",
    "attendance.read": "Aanwezigheid bekijken",
    "documents.read": "Documenten bekijken",
    "documents.manage": "Documenten beheren",
    "operations.read": "Operaties bekijken",
  },
};

const dateLocale: Record<LanguageCode, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  es: "es-ES",
  ro: "ro-RO",
  de: "de-DE",
  nl: "nl-NL",
};

const roleOrder: CompanyAccessRole[] = ["admin", "manager", "hr", "supervisor"];

export function accessNavLabel(language: LanguageCode): string {
  return accessCopy[language].title;
}

export function AccessView() {
  const { user, refresh } = useAuth();
  const { language, notify } = useWorklyData();
  const text = accessCopy[language];
  const accent = roleAccent("company");
  const [payload, setPayload] = useState<AccessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CompanyAccessRole>("manager");
  const [busy, setBusy] = useState(false);
  const [newInviteToken, setNewInviteToken] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await api.get<AccessPayload>("/company/access");
      setPayload(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "WORKLY");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canManage = payload?.permissions.includes("access.manage") ?? false;
  const currentRole = payload?.current_role ?? user?.company_role ?? "admin";
  const roleLabel = useCallback(
    (role: CompanyAccessRole) => text[role],
    [text],
  );

  const permissionLabels = useMemo(
    () => (payload?.permissions ?? []).map((item) => permissionCopy[language][item]),
    [language, payload?.permissions],
  );

  const createInvitation = async () => {
    if (!name.trim() || !email.trim()) {
      notify(text.required, "error");
      return;
    }
    setBusy(true);
    try {
      const invitation = await api.post<AccessInvitation>("/company/invitations", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        access_role: inviteRole,
      });
      setNewInviteToken(invitation.token);
      setName("");
      setEmail("");
      notify(text.inviteCreated, "success");
      await load();
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "WORKLY", "error");
    } finally {
      setBusy(false);
    }
  };

  const changeMemberRole = async (member: AccessMember, accessRole: CompanyAccessRole) => {
    if (member.access_role === accessRole) return;
    setBusy(true);
    try {
      await api.patch(`/company/members/${member.user_id}`, {
        access_role: accessRole,
      });
      await Promise.all([load(), refresh()]);
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "WORKLY", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (member: AccessMember) => {
    setBusy(true);
    try {
      await api.delete(`/company/members/${member.user_id}`);
      await load();
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "WORKLY", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !payload) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accent} size="large" />
        <Text style={styles.muted}>{text.loading}</Text>
      </View>
    );
  }

  if (error && !payload) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" color={workspaceColors.redSoft} size={30} />
        <Text style={styles.muted}>{error}</Text>
        <Pressable onPress={() => void load()} style={[styles.primaryButton, { backgroundColor: accent }]}>
          <Text style={styles.primaryButtonText}>{text.retry}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{`WORKLY · ${text.title.toUpperCase()}`}</Text>
          <Text style={styles.title}>{text.title}</Text>
          <Text style={styles.subtitle}>{text.subtitle}</Text>
        </View>
        <View style={[styles.roleBadge, { borderColor: `${accent}70` }]}>
          <Ionicons name="shield-checkmark-outline" color={accent} size={18} />
          <View>
            <Text style={styles.roleBadgeLabel}>{text.yourRole}</Text>
            <Text style={[styles.roleBadgeValue, { color: accent }]}>{roleLabel(currentRole)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{text.permissions}</Text>
        <View style={styles.chips}>
          {permissionLabels.map((permission) => (
            <View key={permission} style={styles.chip}>
              <Text style={styles.chipText}>{permission}</Text>
            </View>
          ))}
        </View>
      </View>

      {canManage ? (
        <View style={styles.panel}>
          <View style={styles.panelHeadingRow}>
            <View>
              <Text style={styles.panelTitle}>{text.inviteTitle}</Text>
              <Text style={styles.panelHint}>{text.invite}</Text>
            </View>
            <Ionicons name="person-add-outline" color={accent} size={22} />
          </View>
          <View style={styles.formRow}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={text.name}
              placeholderTextColor={workspaceColors.muted}
              style={styles.input}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={text.email}
              placeholderTextColor={workspaceColors.muted}
              style={styles.input}
            />
          </View>
          <Text style={styles.fieldLabel}>{text.role}</Text>
          <View style={styles.rolePicker}>
            {roleOrder.filter((item) => item !== "admin").map((item) => (
              <Pressable
                key={item}
                onPress={() => setInviteRole(item)}
                style={[
                  styles.roleOption,
                  inviteRole === item ? { borderColor: accent, backgroundColor: `${accent}12` } : null,
                ]}
              >
                <Text style={inviteRole === item ? [styles.roleOptionText, { color: accent }] : styles.roleOptionText}>
                  {roleLabel(item)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            disabled={busy}
            onPress={() => void createInvitation()}
            style={[styles.primaryButton, { backgroundColor: accent }, busy ? styles.disabled : null]}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="send-outline" color="#FFFFFF" size={17} />}
            <Text style={styles.primaryButtonText}>{text.sendInvite}</Text>
          </Pressable>
          {newInviteToken ? (
            <View style={styles.inviteTokenBox}>
              <Text style={styles.fieldLabel}>{text.inviteCode}</Text>
              <Text selectable style={[styles.inviteToken, { color: accent }]}>{newInviteToken}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.readOnlyBox}>
          <Ionicons name="lock-closed-outline" color={workspaceColors.textSoft} size={18} />
          <Text style={styles.muted}>{text.readOnly}</Text>
        </View>
      )}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{text.members}</Text>
        {(payload?.members ?? []).length === 0 ? <Text style={styles.muted}>{text.noMembers}</Text> : null}
        {(payload?.members ?? []).map((member) => (
          <View key={member.user_id} style={styles.memberRow}>
            <View style={styles.memberIdentity}>
              <View style={[styles.avatar, { borderColor: `${accent}55` }]}>
                <Text style={styles.avatarText}>{member.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.memberCopy}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            </View>
            <View style={styles.memberActions}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{text.active}</Text>
              </View>
              {canManage && member.user_id !== user?.id ? (
                <>
                  <View style={styles.rolePickerCompact}>
                    {roleOrder.map((item) => (
                      <Pressable
                        key={item}
                        disabled={busy}
                        onPress={() => void changeMemberRole(member, item)}
                        style={[
                          styles.compactRole,
                          member.access_role === item ? { borderColor: accent, backgroundColor: `${accent}12` } : null,
                        ]}
                      >
                        <Text style={member.access_role === item ? [styles.compactRoleText, { color: accent }] : styles.compactRoleText}>
                          {roleLabel(item)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable disabled={busy} onPress={() => void removeMember(member)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" color={workspaceColors.redSoft} size={17} />
                    <Text style={styles.removeText}>{text.remove}</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={[styles.currentRole, { color: accent }]}>{roleLabel(member.access_role)}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{text.invitations}</Text>
        {(payload?.invitations ?? []).length === 0 ? <Text style={styles.muted}>{text.noInvites}</Text> : null}
        {(payload?.invitations ?? []).map((invitation) => (
          <View key={invitation.token} style={styles.invitationRow}>
            <View>
              <Text style={styles.memberName}>{invitation.name}</Text>
              <Text style={styles.memberEmail}>{invitation.email}</Text>
            </View>
            <View style={styles.invitationMeta}>
              <Text style={[styles.currentRole, { color: accent }]}>{roleLabel(invitation.access_role)}</Text>
              <Text style={styles.memberEmail}>{text.expires}: {new Date(invitation.expires_at).toLocaleDateString(dateLocale[language])}</Text>
              <Text selectable style={styles.codeSmall}>{invitation.token}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 22, paddingBottom: 120, gap: 16 },
  center: { flex: 1, minHeight: 420, alignItems: "center", justifyContent: "center", gap: 12 },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
  eyebrow: { color: workspaceColors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: workspaceColors.text, fontSize: 28, fontWeight: "900", marginTop: 5 },
  subtitle: { color: workspaceColors.textSoft, fontSize: 13, marginTop: 5 },
  roleBadge: { minWidth: 170, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#0B0E14" },
  roleBadgeLabel: { color: workspaceColors.muted, fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  roleBadgeValue: { fontSize: 14, fontWeight: "900", marginTop: 2 },
  panel: { borderWidth: 1, borderColor: "#1A2230", borderRadius: 17, backgroundColor: "#0A0D13", padding: 16, gap: 12 },
  panelHeadingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  panelTitle: { color: workspaceColors.text, fontSize: 15, fontWeight: "900" },
  panelHint: { color: workspaceColors.muted, fontSize: 11, marginTop: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: "#253044", paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#0E131C" },
  chipText: { color: workspaceColors.textSoft, fontSize: 10, fontWeight: "700" },
  formRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  input: { flexGrow: 1, flexBasis: 220, color: workspaceColors.text, borderWidth: 1, borderColor: "#232D3D", borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: "#080B10" },
  fieldLabel: { color: workspaceColors.textSoft, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  rolePicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleOption: { borderWidth: 1, borderColor: "#253044", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  roleOptionText: { color: workspaceColors.textSoft, fontSize: 11, fontWeight: "800" },
  primaryButton: { alignSelf: "flex-start", minHeight: 40, borderRadius: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  inviteTokenBox: { borderTopWidth: 1, borderTopColor: "#1A2230", paddingTop: 12, gap: 5 },
  inviteToken: { fontSize: 16, fontWeight: "900", letterSpacing: 0.8 },
  readOnlyBox: { borderWidth: 1, borderColor: "#1A2230", borderRadius: 14, padding: 14, flexDirection: "row", gap: 9, alignItems: "center", backgroundColor: "#0A0D13" },
  memberRow: { borderTopWidth: 1, borderTopColor: "#161D28", paddingTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" },
  memberIdentity: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 220 },
  avatar: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#10151E" },
  avatarText: { color: workspaceColors.text, fontSize: 11, fontWeight: "900" },
  memberCopy: { minWidth: 0 },
  memberName: { color: workspaceColors.text, fontSize: 13, fontWeight: "800" },
  memberEmail: { color: workspaceColors.muted, fontSize: 10, marginTop: 2 },
  memberActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: 8, flex: 1 },
  statusPill: { borderWidth: 1, borderColor: "#183729", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#39D98A" },
  statusText: { color: "#8FE3B8", fontSize: 9, fontWeight: "800" },
  rolePickerCompact: { flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "flex-end" },
  compactRole: { borderWidth: 1, borderColor: "#202A39", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5 },
  compactRoleText: { color: workspaceColors.muted, fontSize: 9, fontWeight: "800" },
  removeButton: { flexDirection: "row", gap: 5, alignItems: "center", padding: 5 },
  removeText: { color: workspaceColors.redSoft, fontSize: 10, fontWeight: "800" },
  currentRole: { fontSize: 10, fontWeight: "900" },
  invitationRow: { borderTopWidth: 1, borderTopColor: "#161D28", paddingTop: 12, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  invitationMeta: { alignItems: "flex-end", gap: 2 },
  codeSmall: { color: workspaceColors.textSoft, fontSize: 9, marginTop: 3 },
  muted: { color: workspaceColors.textSoft, fontSize: 12 },
});
