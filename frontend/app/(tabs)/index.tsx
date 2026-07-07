import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/context/AuthContext";
import { useApi } from "@/src/hooks/useApi";
import { api } from "@/src/api/client";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { Card, TrustRing, ProgressBar, Button } from "@/src/components/ui";

export default function Home() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, reload } = useApi<any>("/dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const isWorker = user?.role === "worker";
  const active = data?.active_checkin;

  const toggleCheckin = async () => {
    setCheckingIn(true);
    try {
      if (active) await api.post("/checkout");
      else await api.post("/checkin");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await reload();
    } catch {} finally {
      setCheckingIn(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <ScreenHeader
        subtitle={greeting()}
        title={user?.name || "WORKLY"}
        avatar={user?.avatar}
        showBell
        showTheme
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + 120, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.onSurface} />}
      >
        {loading && !data ? (
          <>
            <Skeleton h={150} />
            <Skeleton h={90} />
            <Skeleton h={90} />
          </>
        ) : isWorker ? (
          <WorkerDash c={c} data={data} router={router} />
        ) : (
          <CompanyDash c={c} data={data} router={router} />
        )}
      </ScrollView>

      {isWorker && !loading && (
        <Pressable
          testID="checkin-fab"
          onPress={toggleCheckin}
          style={{
            position: "absolute",
            bottom: insets.bottom + 80,
            right: spacing.xl,
            height: 56,
            paddingHorizontal: spacing.xl,
            borderRadius: radius.pill,
            backgroundColor: active ? c.error : c.success,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Ionicons name={active ? "log-out-outline" : "log-in-outline"} size={22} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
            {checkingIn ? "..." : active ? "Check Out" : "Check In"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function WorkerDash({ c, data, router }: any) {
  return (
    <>
      {/* Trust + Level */}
      <Card testID="trust-card" style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
        <TrustRing score={data.trust_score} />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800" }}>{data.level}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="star" size={14} color={c.warning} />
            <Text style={{ color: c.onSurfaceSecondary, fontWeight: "700" }}>{data.reputation} reputation</Text>
          </View>
          <ProgressBar value={data.level_progress} />
          <Text style={{ color: c.muted, fontSize: 12 }}>{Math.round(data.level_progress * 100)}% para o próximo nível</Text>
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <StatCard c={c} icon="cash-outline" label="Este mês" value={`€${data.earnings_month}`} />
        <StatCard c={c} icon="checkmark-done-outline" label="Trabalhos" value={data.jobs_completed} />
      </View>

      {/* Today's jobs */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs }}>
        <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800" }}>Hoje</Text>
        <Text style={{ color: c.muted, fontSize: 13 }}>{data.todays_jobs?.length || 0} trabalhos</Text>
      </View>
      {data.todays_jobs?.length ? (
        data.todays_jobs.map((j: any) => (
          <Card key={j.id} testID={`job-${j.id}`}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700" }}>{j.title}</Text>
                <Text style={{ color: c.muted, fontSize: 13 }}>{j.company}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <Ionicons name="location-outline" size={14} color={c.muted} />
                  <Text style={{ color: c.onSurfaceSecondary, fontSize: 13, flex: 1 }} numberOfLines={1}>{j.location}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Ionicons name="time-outline" size={14} color={c.muted} />
                  <Text style={{ color: c.onSurfaceSecondary, fontSize: 13 }}>{j.time}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <Text style={{ color: c.success, fontSize: 18, fontWeight: "800" }}>€{j.pay}</Text>
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.surfaceTertiary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill }}
                >
                  <Ionicons name="navigate" size={13} color={c.onSurface} />
                  <Text style={{ color: c.onSurface, fontSize: 12, fontWeight: "700" }}>GPS</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card><Text style={{ color: c.muted }}>Sem trabalhos hoje.</Text></Card>
      )}

      <Button label="Ver Carreira & Conquistas" icon="trending-up" variant="secondary" onPress={() => router.push("/career")} />
    </>
  );
}

function CompanyDash({ c, data, router }: any) {
  return (
    <>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <StatCard c={c} icon="wallet-outline" label="Gasto/mês" value={`€${data.spend_month}`} />
        <StatCard c={c} icon="briefcase-outline" label="Projetos" value={data.active_projects} />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <StatCard c={c} icon="people-outline" label="Disponíveis" value={data.stats.available_workers} />
        <StatCard c={c} icon="document-outline" label="Faturas" value={data.stats.invoices_due} />
      </View>

      <Button label="Procurar Trabalhadores" icon="search" onPress={() => router.push("/(tabs)/search")} />

      <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800", marginTop: spacing.xs }}>Projetos Ativos</Text>
      {data.projects?.map((p: any) => (
        <Card key={p.id} testID={`project-${p.id}`}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
            <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700", flex: 1 }}>{p.name}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{p.workers} 👷</Text>
          </View>
          <ProgressBar value={p.progress} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm }}>
            <Text style={{ color: c.muted, fontSize: 12 }}>{Math.round(p.progress * 100)}% concluído</Text>
            <Text style={{ color: c.onSurfaceSecondary, fontSize: 12, fontWeight: "700" }}>€{p.budget.toLocaleString()}</Text>
          </View>
        </Card>
      ))}
    </>
  );
}

function StatCard({ c, icon, label, value }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, gap: 6 }}>
      <Ionicons name={icon} size={20} color={c.onSurfaceSecondary} />
      <Text style={{ color: c.onSurface, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function Skeleton({ h }: { h: number }) {
  const c = useColors();
  return <View style={{ height: h, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary }} />;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia 👋";
  if (h < 19) return "Boa tarde 👋";
  return "Boa noite 👋";
}
