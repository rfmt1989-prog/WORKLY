import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/design";

type Project = {
  id: string;
  name: string;
  location: string;
  status: string;
  progress: number;
  workers: number;
  deadline?: string;
  budget: number;
};

const demoProject = {
  name: "Nova Obra Demo",
  location: "Coimbra",
  status: "planning",
  progress: 5,
  workers: 0,
  deadline: "2027-03-31",
  budget: 75000,
};

export default function CompanyProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<Project[]>("/company/projects")
      .then(setProjects)
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    try {
      setBusy("create");
      await api.post("/company/projects", demoProject);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao criar obra.");
    } finally {
      setBusy("");
    }
  };

  const advance = async (project: Project) => {
    try {
      setBusy(project.id);
      await api.post(`/company/projects/${project.id}/update`, {
        ...project,
        progress: Math.min(project.progress + 10, 100),
      });
      await load();
    } finally {
      setBusy("");
    }
  };

  const remove = async (project: Project) => {
    const confirmed =
      Platform.OS !== "web" ||
      window.confirm(`Apagar a obra "${project.name}"?`);
    if (!confirmed) return;
    try {
      setBusy(project.id);
      await api.post(`/company/projects/${project.id}/delete`, {});
      await load();
    } finally {
      setBusy("");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: 60 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
              Obras
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>
              Planeamento e progresso em tempo real
            </Text>
          </View>
          <Pressable
            onPress={create}
            disabled={busy === "create"}
            style={{
              backgroundColor: colors.company,
              borderRadius: radius.large,
              paddingHorizontal: spacing[4],
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "900" }}>+ Nova</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.company} style={{ marginTop: 40 }} />
        ) : null}
        {error ? <Text style={{ color: colors.danger, marginTop: 16 }}>{error}</Text> : null}

        {projects.map((project) => (
          <View
            key={project.id}
            style={{
              marginTop: spacing[5],
              padding: spacing[5],
              borderRadius: radius.xlarge,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                  {project.name}
                </Text>
                <Text style={{ color: colors.textMuted, marginTop: 5 }}>
                  {project.location} · {project.workers} trabalhadores
                </Text>
              </View>
              <Text style={{ color: colors.company, fontSize: 20, fontWeight: "900" }}>
                {project.progress}%
              </Text>
            </View>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.border,
                marginTop: spacing[4],
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${project.progress}%`,
                  height: "100%",
                  backgroundColor: colors.company,
                }}
              />
            </View>
            <Text style={{ color: colors.textMuted, marginTop: spacing[3] }}>
              Prazo: {project.deadline} · Orçamento: €{project.budget.toLocaleString("pt-PT")}
            </Text>
            <View style={{ flexDirection: "row", marginTop: spacing[4] }}>
              <Pressable
                onPress={() => advance(project)}
                style={{
                  flex: 1,
                  backgroundColor: colors.companySoft,
                  borderRadius: radius.medium,
                  padding: spacing[3],
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.company, fontWeight: "800" }}>
                  Atualizar +10%
                </Text>
              </Pressable>
              <Pressable
                onPress={() => remove(project)}
                style={{ padding: spacing[3], marginLeft: spacing[2] }}
              >
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
