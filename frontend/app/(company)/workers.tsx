import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/design";

type Worker = {
  id: string;
  name: string;
  avatar: string;
  age: number;
  flag: string;
  country: string;
  specialty: string;
  experience_years: number;
  available: boolean;
  status: string;
  trust_score: number;
  productivity_score: number;
  skills: string[];
  certificates: string[];
  project?: string | null;
};

export default function CompanyWorkersScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Worker[]>("/company/workers")
      .then(setWorkers)
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return workers;
    return workers.filter((worker) =>
      `${worker.name} ${worker.specialty} ${worker.country} ${worker.skills.join(" ")}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, workers]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: spacing[10] }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}>
          Trabalhadores
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          {workers.length} profissionais demo disponíveis para pesquisa
        </Text>

        <View
          style={{
            marginTop: spacing[5],
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.large,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing[4],
          }}
        >
          <Ionicons name="search" size={20} color={colors.company} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Nome, profissão, país ou competência"
            placeholderTextColor={colors.textDisabled}
            style={{ flex: 1, color: colors.text, padding: spacing[4] }}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.company} style={{ marginTop: 40 }} />
        ) : null}
        {error ? (
          <Text style={{ color: colors.danger, marginTop: spacing[4] }}>{error}</Text>
        ) : null}

        {filtered.map((worker) => {
          const open = selected?.id === worker.id;
          return (
            <Pressable
              key={worker.id}
              onPress={() => setSelected(open ? null : worker)}
              style={{
                marginTop: spacing[4],
                padding: spacing[4],
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: open ? colors.company : colors.border,
                borderRadius: radius.xlarge,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={{ uri: worker.avatar }}
                  style={{ width: 58, height: 58, borderRadius: 29 }}
                />
                <View style={{ flex: 1, marginLeft: spacing[3] }}>
                  <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>
                    {worker.flag} {worker.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, marginTop: 3 }}>
                    {worker.specialty} · {worker.age} anos
                  </Text>
                  <Text
                    style={{
                      color: worker.available ? colors.success : colors.warning,
                      fontWeight: "700",
                      marginTop: 5,
                    }}
                  >
                    {worker.available ? "Disponível" : `Em obra · ${worker.project}`}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.warning, fontWeight: "900" }}>
                    ★ {worker.trust_score.toFixed(1)}
                  </Text>
                  <Text style={{ color: colors.textMuted, marginTop: 5 }}>
                    Prod. {worker.productivity_score.toFixed(1)}
                  </Text>
                </View>
              </View>

              {open ? (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    marginTop: spacing[4],
                    paddingTop: spacing[4],
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "800" }}>
                    {worker.experience_years} anos de experiência
                  </Text>
                  <Text style={{ color: colors.textMuted, marginTop: spacing[2] }}>
                    Competências: {worker.skills.join(" · ")}
                  </Text>
                  <Text style={{ color: colors.textMuted, marginTop: spacing[2] }}>
                    Certificados: {worker.certificates.join(" · ")}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
