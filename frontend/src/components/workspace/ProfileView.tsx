import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";
import type { Company, Worker, WorkerStatus } from "@/src/demo/types";

import {
  Avatar,
  Button,
  Card,
  Field,
  ProgressBar,
  Score,
  SectionTitle,
  StatusPill,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type WorkerForm = {
  name: string;
  profession: string;
  age: string;
  country: string;
  location: string;
  phone: string;
  bio: string;
  status: WorkerStatus;
  skills: string;
};

type CompanyForm = {
  name: string;
  industry: string;
  description: string;
  location: string;
  phone: string;
  website: string;
  tax_id: string;
};

export function ProfileView() {
  const { user } = useAuth();
  const { state, language, updateWorker, updateCompany } = useWorklyData();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [workerForm, setWorkerForm] = useState<WorkerForm | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyForm | null>(null);
  const role = user?.role ?? "worker";
  const accent = roleAccent(role);
  const compact = width < 790;
  const t = copy[language];

  const worker = useMemo(
    () => state?.workers.find((item) => item.id === user?.id),
    [state?.workers, user?.id],
  );
  const company = useMemo(
    () =>
      state?.companies.find(
        (item) => item.id === (user?.company_id ?? user?.id),
      ),
    [state?.companies, user?.company_id, user?.id],
  );

  useEffect(() => {
    if (worker) {
      setWorkerForm({
        name: worker.name,
        profession: worker.profession,
        age: String(worker.age),
        country: worker.country,
        location: worker.location,
        phone: worker.phone,
        bio: worker.bio,
        status: worker.status,
        skills: worker.skills.map((skill) => `${skill.name}:${skill.level}`).join("\n"),
      });
    }
  }, [worker]);

  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name,
        industry: company.industry,
        description: company.description,
        location: company.location,
        phone: company.phone,
        website: company.website,
        tax_id: company.tax_id,
      });
    }
  }, [company]);

  if (!state || !user) return null;

  const saveWorker = async () => {
    if (!worker || !workerForm || busy) return;
    setBusy(true);
    try {
      const skills = workerForm.skills
        .split("\n")
        .map((line) => {
          const [name, rawLevel] = line.split(":");
          return {
            name: name?.trim(),
            level: Math.max(0, Math.min(100, Number(rawLevel) || 70)),
          };
        })
        .filter((skill) => skill.name);
      await updateWorker(worker.id, {
        name: workerForm.name.trim(),
        profession: workerForm.profession.trim(),
        title: workerForm.profession.trim(),
        age: Math.max(18, Number(workerForm.age) || 18),
        country: workerForm.country.trim(),
        location: workerForm.location.trim(),
        phone: workerForm.phone.trim(),
        bio: workerForm.bio.trim(),
        status: workerForm.status,
        availability: workerForm.status === "available",
        skills,
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const saveCompany = async () => {
    if (!company || !companyForm || busy) return;
    setBusy(true);
    try {
      await updateCompany(company.id, {
        name: companyForm.name.trim(),
        industry: companyForm.industry.trim(),
        description: companyForm.description.trim(),
        location: companyForm.location.trim(),
        phone: companyForm.phone.trim(),
        website: companyForm.website.trim(),
        tax_id: companyForm.tax_id.trim(),
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const entityName = role === "worker" ? worker?.name : company?.name;
  const entitySubtitle =
    role === "worker" ? worker?.profession : company?.industry;
  const trust =
    role === "worker" ? worker?.trust_score : company?.trust_score;
  const productivity =
    role === "worker"
      ? worker?.productivity_score
      : company?.productivity_score;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        compact ? styles.contentCompact : null,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.hero, { borderColor: `${accent}55` }]}>
        <View style={[styles.heroGlow, { backgroundColor: `${accent}18` }]} />
        <View style={styles.heroContent}>
          <Avatar
            name={entityName ?? user.name}
            flag={worker?.flag}
            size={compact ? 68 : 82}
            accent={accent}
          />
          <View style={{ flex: 1, minWidth: 220, gap: 6 }}>
            <Text style={sharedStyles.label}>
              {role === "worker" ? "WORKLY WORKER" : "WORKLY COMPANY"}
            </Text>
            <Text style={styles.entityName}>{entityName ?? user.name}</Text>
            <Text style={styles.entitySubtitle}>{entitySubtitle}</Text>
            {worker ? (
              <StatusPill
                status={worker.status}
                label={
                  worker.status === "on_site"
                    ? t.onSite
                    : worker.status === "contracted"
                      ? t.contracted
                      : t.available
                }
              />
            ) : null}
          </View>
          <View style={styles.scores}>
            <Score
              value={trust ?? 5}
              label={t.trust}
              accent={accent}
              compact={compact}
            />
            <Score
              value={productivity ?? 5}
              label={t.productivity}
              accent={workspaceColors.green}
              compact={compact}
            />
          </View>
          <Button
            label={editing ? t.cancel : t.edit}
            icon={editing ? "close" : "create-outline"}
            variant={editing ? "secondary" : "primary"}
            accent={accent}
            onPress={() => setEditing((current) => !current)}
          />
        </View>
      </View>

      {role === "worker" && worker && workerForm ? (
        editing ? (
          <WorkerProfileEditor
            form={workerForm}
            setForm={setWorkerForm}
            language={language}
            accent={accent}
            busy={busy}
            onSave={saveWorker}
          />
        ) : (
          <WorkerProfileSummary worker={worker} language={language} accent={accent} />
        )
      ) : null}

      {role === "company" && company && companyForm ? (
        editing ? (
          <CompanyProfileEditor
            form={companyForm}
            setForm={setCompanyForm}
            language={language}
            accent={accent}
            busy={busy}
            onSave={saveCompany}
          />
        ) : (
          <CompanyProfileSummary
            company={company}
            language={language}
            accent={accent}
            projectsCount={
              state.projects.filter((item) => item.company_id === company.id).length
            }
            teamsCount={
              state.teams.filter((item) => item.company_id === company.id).length
            }
          />
        )
      ) : null}
    </ScrollView>
  );
}

function WorkerProfileSummary({
  worker,
  language,
  accent,
}: {
  worker: Worker;
  language: import("@/src/demo/types").LanguageCode;
  accent: string;
}) {
  const t = copy[language];
  return (
    <>
      <View style={styles.twoColumns}>
        <Card style={{ flex: 1.05, minWidth: 290 }}>
          <SectionTitle
            title={language === "pt" ? "Sobre" : "About"}
            subtitle={`${worker.experience_years} ${t.years} · ${worker.location}`}
          />
          <Text style={[sharedStyles.body, { marginTop: 14 }]}>{worker.bio}</Text>
          <View style={styles.infoGrid}>
            <Info icon="mail-outline" label="Email" value={worker.email} />
            <Info
              icon="call-outline"
              label={language === "pt" ? "Telefone" : "Phone"}
              value={worker.phone}
            />
            <Info
              icon="flag-outline"
              label={language === "pt" ? "País" : "Country"}
              value={`${worker.flag} ${worker.country}`}
            />
            <Info
              icon="calendar-outline"
              label={language === "pt" ? "Idade" : "Age"}
              value={String(worker.age)}
            />
          </View>
        </Card>

        <Card style={{ flex: 0.95, minWidth: 290 }}>
          <SectionTitle
            title={language === "pt" ? "Indicadores profissionais" : "Professional indicators"}
          />
          <View style={{ gap: 13, marginTop: 15 }}>
            <Indicator
              label={t.trust}
              value={worker.trust_score * 10}
              accent={accent}
            />
            <Indicator
              label={t.productivity}
              value={worker.productivity_score * 10}
              accent={workspaceColors.green}
            />
            <Indicator
              label={language === "pt" ? "Classificação geral" : "Overall rating"}
              value={worker.rating * 10}
              accent={workspaceColors.yellow}
            />
          </View>
        </Card>
      </View>

      <Card>
        <SectionTitle
          title={language === "pt" ? "Competências" : "Skills"}
          subtitle={
            language === "pt"
              ? "Níveis editáveis no perfil."
              : "Editable levels in your profile."
          }
        />
        <View style={styles.skills}>
          {worker.skills.map((skill) => (
            <View key={skill.name} style={styles.skill}>
              <View style={styles.indicatorHeader}>
                <Text style={styles.indicatorLabel}>{skill.name}</Text>
                <Text style={[styles.indicatorValue, { color: accent }]}>
                  {skill.level}%
                </Text>
              </View>
              <ProgressBar value={skill.level} accent={accent} />
            </View>
          ))}
        </View>
      </Card>
    </>
  );
}

function WorkerProfileEditor({
  form,
  setForm,
  language,
  accent,
  busy,
  onSave,
}: {
  form: WorkerForm;
  setForm: React.Dispatch<React.SetStateAction<WorkerForm | null>>;
  language: import("@/src/demo/types").LanguageCode;
  accent: string;
  busy: boolean;
  onSave: () => void;
}) {
  const t = copy[language];
  const setValue = <K extends keyof WorkerForm>(key: K, value: WorkerForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };
  return (
    <Card>
      <SectionTitle
        title={language === "pt" ? "Editar perfil Worker" : "Edit Worker profile"}
        subtitle={
          language === "pt"
            ? "As alterações ficam guardadas nesta demonstração."
            : "Changes are stored in this demo."
        }
      />
      <View style={[styles.editor, { marginTop: 16 }]}>
        <View style={styles.formColumns}>
          <Field
            style={styles.fieldHalf}
            label={language === "pt" ? "Nome" : "Name"}
            value={form.name}
            onChangeText={(value) => setValue("name", value)}
          />
          <Field
            style={styles.fieldHalf}
            label={language === "pt" ? "Profissão" : "Trade"}
            value={form.profession}
            onChangeText={(value) => setValue("profession", value)}
          />
        </View>
        <View style={styles.formColumns}>
          <Field
            style={styles.fieldThird}
            label={language === "pt" ? "Idade" : "Age"}
            value={form.age}
            keyboardType="number-pad"
            onChangeText={(value) => setValue("age", value)}
          />
          <Field
            style={styles.fieldThird}
            label={language === "pt" ? "País" : "Country"}
            value={form.country}
            onChangeText={(value) => setValue("country", value)}
          />
          <Field
            style={styles.fieldThird}
            label={language === "pt" ? "Localização" : "Location"}
            value={form.location}
            onChangeText={(value) => setValue("location", value)}
          />
        </View>
        <Field
          label={language === "pt" ? "Telefone" : "Phone"}
          value={form.phone}
          onChangeText={(value) => setValue("phone", value)}
        />
        <Field
          label={language === "pt" ? "Biografia profissional" : "Professional bio"}
          value={form.bio}
          multiline
          onChangeText={(value) => setValue("bio", value)}
        />
        <Field
          label={
            language === "pt"
              ? "Competências — uma por linha: Nome:Nível"
              : "Skills — one per line: Name:Level"
          }
          value={form.skills}
          multiline
          onChangeText={(value) => setValue("skills", value)}
        />
        <Text style={sharedStyles.label}>{t.status}</Text>
        <View style={styles.choices}>
          {(["available", "contracted", "on_site"] as WorkerStatus[]).map(
            (status) => (
              <Button
                key={status}
                compact
                label={
                  status === "available"
                    ? t.available
                    : status === "contracted"
                      ? t.contracted
                      : t.onSite
                }
                variant={form.status === status ? "primary" : "secondary"}
                accent={accent}
                onPress={() => setValue("status", status)}
              />
            ),
          )}
        </View>
        <Button
          testID="save-own-worker-profile"
          label={t.save}
          icon="checkmark"
          accent={accent}
          loading={busy}
          onPress={onSave}
        />
      </View>
    </Card>
  );
}

function CompanyProfileSummary({
  company,
  language,
  accent,
  projectsCount,
  teamsCount,
}: {
  company: Company;
  language: import("@/src/demo/types").LanguageCode;
  accent: string;
  projectsCount: number;
  teamsCount: number;
}) {
  return (
    <View style={styles.twoColumns}>
      <Card style={{ flex: 1.1, minWidth: 300 }}>
        <SectionTitle title={language === "pt" ? "Empresa" : "Company"} />
        <Text style={[sharedStyles.body, { marginTop: 14 }]}>
          {company.description}
        </Text>
        <View style={styles.infoGrid}>
          <Info icon="mail-outline" label="Email" value={company.email} />
          <Info
            icon="call-outline"
            label={language === "pt" ? "Telefone" : "Phone"}
            value={company.phone}
          />
          <Info
            icon="location-outline"
            label={language === "pt" ? "Localização" : "Location"}
            value={company.location}
          />
          <Info icon="globe-outline" label="Website" value={company.website} />
          <Info
            icon="receipt-outline"
            label={language === "pt" ? "NIF" : "Tax ID"}
            value={company.tax_id}
          />
        </View>
      </Card>
      <Card style={{ flex: 0.9, minWidth: 280 }}>
        <SectionTitle
          title={language === "pt" ? "Capacidade operacional" : "Operational capacity"}
        />
        <View style={styles.companyMetrics}>
          <View style={styles.companyMetric}>
            <Ionicons name="business-outline" size={22} color={accent} />
            <Text style={styles.companyMetricValue}>{projectsCount}</Text>
            <Text style={styles.companyMetricLabel}>
              {language === "pt" ? "Obras" : "Projects"}
            </Text>
          </View>
          <View style={styles.companyMetric}>
            <Ionicons name="people-outline" size={22} color={accent} />
            <Text style={styles.companyMetricValue}>{teamsCount}</Text>
            <Text style={styles.companyMetricLabel}>
              {language === "pt" ? "Equipas" : "Teams"}
            </Text>
          </View>
          <View style={styles.companyMetric}>
            <Ionicons
              name="documents-outline"
              size={22}
              color={workspaceColors.yellow}
            />
            <Text style={styles.companyMetricValue}>{company.documents.length}</Text>
            <Text style={styles.companyMetricLabel}>
              {language === "pt" ? "Documentos" : "Documents"}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

function CompanyProfileEditor({
  form,
  setForm,
  language,
  accent,
  busy,
  onSave,
}: {
  form: CompanyForm;
  setForm: React.Dispatch<React.SetStateAction<CompanyForm | null>>;
  language: import("@/src/demo/types").LanguageCode;
  accent: string;
  busy: boolean;
  onSave: () => void;
}) {
  const t = copy[language];
  const setValue = <K extends keyof CompanyForm>(
    key: K,
    value: CompanyForm[K],
  ) => setForm((current) => (current ? { ...current, [key]: value } : current));
  return (
    <Card>
      <SectionTitle
        title={language === "pt" ? "Editar perfil Company" : "Edit Company profile"}
      />
      <View style={[styles.editor, { marginTop: 16 }]}>
        <View style={styles.formColumns}>
          <Field
            style={styles.fieldHalf}
            label={language === "pt" ? "Nome da empresa" : "Company name"}
            value={form.name}
            onChangeText={(value) => setValue("name", value)}
          />
          <Field
            style={styles.fieldHalf}
            label={language === "pt" ? "Setor" : "Industry"}
            value={form.industry}
            onChangeText={(value) => setValue("industry", value)}
          />
        </View>
        <Field
          label={language === "pt" ? "Descrição" : "Description"}
          value={form.description}
          multiline
          onChangeText={(value) => setValue("description", value)}
        />
        <View style={styles.formColumns}>
          <Field
            style={styles.fieldHalf}
            label={language === "pt" ? "Localização" : "Location"}
            value={form.location}
            onChangeText={(value) => setValue("location", value)}
          />
          <Field
            style={styles.fieldHalf}
            label={language === "pt" ? "Telefone" : "Phone"}
            value={form.phone}
            onChangeText={(value) => setValue("phone", value)}
          />
        </View>
        <View style={styles.formColumns}>
          <Field
            style={styles.fieldHalf}
            label="Website"
            value={form.website}
            onChangeText={(value) => setValue("website", value)}
          />
          <Field
            style={styles.fieldHalf}
            label={language === "pt" ? "NIF" : "Tax ID"}
            value={form.tax_id}
            onChangeText={(value) => setValue("tax_id", value)}
          />
        </View>
        <Button
          testID="save-company-profile"
          label={t.save}
          icon="checkmark"
          accent={accent}
          loading={busy}
          onPress={onSave}
        />
      </View>
    </Card>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={18} color={workspaceColors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={sharedStyles.label}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function Indicator({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View style={{ gap: 7 }}>
      <View style={styles.indicatorHeader}>
        <Text style={styles.indicatorLabel}>{label}</Text>
        <Text style={[styles.indicatorValue, { color: accent }]}>
          {(value / 10).toFixed(1)}
        </Text>
      </View>
      <ProgressBar value={value} accent={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: workspaceColors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 46,
    gap: 16,
    maxWidth: 1400,
    width: "100%",
    alignSelf: "center",
  },
  contentCompact: {
    padding: 14,
    paddingBottom: 100,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    backgroundColor: workspaceColors.panelSoft,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    right: -90,
    top: -240,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  entityName: {
    color: workspaceColors.text,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  entitySubtitle: {
    color: workspaceColors.textSoft,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  scores: {
    flexDirection: "row",
    gap: 13,
  },
  twoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  info: {
    flexGrow: 1,
    flexBasis: 210,
    minWidth: 180,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 12,
    padding: 10,
    backgroundColor: workspaceColors.panelSoft,
  },
  infoValue: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  indicatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  indicatorLabel: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  indicatorValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  skills: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  skill: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 230,
    gap: 7,
  },
  editor: {
    gap: 14,
  },
  formColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
    minWidth: 230,
  },
  fieldThird: {
    flex: 1,
    minWidth: 170,
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  companyMetrics: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  companyMetric: {
    flex: 1,
    minWidth: 95,
    minHeight: 120,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 14,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  companyMetricValue: {
    color: workspaceColors.text,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "900",
  },
  companyMetricLabel: {
    color: workspaceColors.muted,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

