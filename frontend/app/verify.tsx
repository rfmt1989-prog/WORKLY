import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "@/src/api/client";

type PublicWorker = {
  verified_profile: boolean;
  workly_id: string;
  name: string;
  nationality: string;
  languages: string[];
  profession: string;
  work_eligibility_status: "pending" | "eligible" | "not_eligible";
  identity_verification_status: "pending" | "verified" | "rejected";
  level: string;
  workly_value: number;
  verified_projects: number;
  verified_experience_hours: number;
  core_coverage: number;
};

export default function PublicWorkerVerificationScreen() {
  const params = useLocalSearchParams<{ worklyId?: string | string[] }>();
  const worklyId = useMemo(() => {
    const value = Array.isArray(params.worklyId)
      ? params.worklyId[0]
      : params.worklyId;
    return String(value || "").trim();
  }, [params.worklyId]);

  const [profile, setProfile] = useState<PublicWorker | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!worklyId) {
      setError("WORKLY ID inválido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get<PublicWorker>(`/public/workers/${encodeURIComponent(worklyId)}`)
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setProfile(null);
        setError("Não foi possível verificar este WORKLY ID.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [worklyId]);

  const eligibility =
    profile?.work_eligibility_status === "eligible"
      ? "Apto para trabalhar"
      : profile?.work_eligibility_status === "not_eligible"
        ? "Não apto para trabalhar"
        : "Aptidão a aguardar validação";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#5EB5FF" />
        <Text style={styles.muted}>A verificar identidade WORKLY…</Text>
      </View>
    );
  }

  if (!profile || error) {
    return (
      <View style={styles.center}>
        <Ionicons name="close-circle-outline" size={34} color="#FF8F8F" />
        <Text style={styles.errorTitle}>Perfil não verificado</Text>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>WORKLY</Text>
            <Text style={styles.kicker}>PERFIL PROFISSIONAL VERIFICÁVEL</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark-outline" size={15} color="#78D8A7" />
            <Text style={styles.verifiedText}>PERFIL WORKLY</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.name}>{profile.name || "Worker"}</Text>
          <Text style={styles.profession}>{profile.profession || "Profissão por definir"}</Text>
          <Text style={styles.worklyId}>{profile.workly_id}</Text>
        </View>

        <View style={styles.identityGrid}>
          <Info label="Nacionalidade" value={profile.nationality || "—"} />
          <Info label="Idiomas" value={profile.languages.join(" · ") || "—"} />
          <Info label="Apto para trabalhar" value={eligibility} />
        </View>

        <View style={styles.metrics}>
          <Metric label="Nível WORKLY" value={profile.level || "I"} />
          <Metric label="WORKLY VALUE" value={`${profile.workly_value}/100`} />
          <Metric label="Obras verificadas" value={String(profile.verified_projects)} />
          <Metric
            label="Horas WORKLY"
            value={`${Math.round(profile.verified_experience_hours)} h`}
          />
        </View>

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={14} color="#7892A8" />
          <Text style={styles.footerText}>
            Esta página confirma os dados profissionais públicos associados ao
            WORKLY ID. Dados de Cartão de Cidadão/Passaporte nunca são expostos.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#04090E" },
  content: { padding: 18, alignItems: "center", justifyContent: "center", minHeight: "100%" },
  center: {
    flex: 1,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#04090E",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 760,
    borderWidth: 1,
    borderColor: "#19364B",
    borderRadius: 24,
    backgroundColor: "#071019",
    padding: 20,
    gap: 20,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  brand: { color: "#86C7FF", fontSize: 16, fontWeight: "900", letterSpacing: 2.4 },
  kicker: { color: "#607C93", fontSize: 8, fontWeight: "700", letterSpacing: 1.3, marginTop: 3 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#285D45",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "#091A14",
  },
  verifiedText: { color: "#78D8A7", fontSize: 8, fontWeight: "800", letterSpacing: .8 },
  hero: { gap: 4, borderTopWidth: 1, borderTopColor: "#173044", paddingTop: 18 },
  name: { color: "#E7F0F7", fontSize: 28, lineHeight: 34, fontWeight: "800" },
  profession: { color: "#AFC4D5", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  worklyId: { color: "#6CAFE8", fontSize: 11, lineHeight: 16, fontWeight: "800", letterSpacing: 1 },
  identityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  info: {
    flex: 1,
    minWidth: 180,
    borderWidth: 1,
    borderColor: "#173145",
    borderRadius: 12,
    backgroundColor: "#050C12",
    padding: 11,
    gap: 3,
  },
  label: { color: "#667F93", fontSize: 8, lineHeight: 12, textTransform: "uppercase", letterSpacing: .7 },
  value: { color: "#D3E0EA", fontSize: 11, lineHeight: 16, fontWeight: "700" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: {
    flex: 1,
    minWidth: 130,
    borderWidth: 1,
    borderColor: "#20435B",
    borderRadius: 13,
    backgroundColor: "#071522",
    padding: 12,
  },
  metricValue: { color: "#8BC7FF", fontSize: 20, lineHeight: 25, fontWeight: "800" },
  metricLabel: { color: "#698397", fontSize: 8, lineHeight: 12, marginTop: 2, textTransform: "uppercase" },
  footer: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#173044",
    paddingTop: 14,
  },
  footerText: { flex: 1, color: "#6F879A", fontSize: 9, lineHeight: 15 },
  muted: { color: "#758B9D", fontSize: 11, lineHeight: 17, textAlign: "center" },
  errorTitle: { color: "#E9F1F7", fontSize: 18, lineHeight: 24, fontWeight: "700" },
});
