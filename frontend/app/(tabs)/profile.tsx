import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { useThemeMode } from "@/src/context/ThemeContext";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { TrustRing, ProgressBar, Stars, Badge, Card } from "@/src/components/ui";

export default function Profile() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const { mode, setMode } = useThemeMode();
  const [avail, setAvail] = useState(user?.available ?? true);

  if (!user) return null;
  const isWorker = user.role === "worker";

  const toggleAvail = async (v: boolean) => {
    setAvail(v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.post("/availability", { available: v });
      setUser({ ...user, available: v });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Cover + avatar */}
        <View style={{ height: 180 }}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1673551799304-b81cce68c308?w=1200&q=80" }}
            style={{ width: "100%", height: "100%" }}
          />
          <LinearGradient colors={["transparent", c.surface]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120 }} />
          <View style={{ position: "absolute", top: insets.top + 4, right: spacing.xl, flexDirection: "row", gap: spacing.sm }}>
            <IconBtn c={c} icon="notifications-outline" onPress={() => router.push("/notifications")} testID="profile-notifications" />
            <IconBtn c={c} icon="settings-outline" onPress={() => {}} testID="profile-settings" />
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: -50 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
            <Image source={{ uri: user.avatar }} style={{ width: 96, height: 96, borderRadius: radius.pill, borderWidth: 4, borderColor: c.surface }} />
            <View style={{ flex: 1, paddingBottom: spacing.sm }}>
              <Text style={{ color: c.onSurface, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 }}>{user.name}</Text>
              <Text style={{ color: c.muted, fontSize: 14 }}>{user.title}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.md }}>
            <Stars value={user.reputation || 0} size={15} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="location-outline" size={15} color={c.muted} />
              <Text style={{ color: c.onSurfaceSecondary, fontSize: 14 }}>{user.location}</Text>
            </View>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <Badge text={user.level || "Professional"} tone="success" />
          </View>
        </View>

        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          {/* Trust + level */}
          <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
            <TrustRing score={user.trust_score || 0} />
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Text style={{ color: c.onSurface, fontWeight: "800", fontSize: 16 }}>Nível Profissional</Text>
              <ProgressBar value={user.level_progress || 0} />
              <Text style={{ color: c.muted, fontSize: 12 }}>{Math.round((user.level_progress || 0) * 100)}% completo</Text>
            </View>
          </Card>

          {isWorker && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}>
              <View>
                <Text style={{ color: c.onSurface, fontSize: 16, fontWeight: "700" }}>Disponibilidade</Text>
                <Text style={{ color: c.muted, fontSize: 13 }}>{avail ? "Disponível para trabalho" : "Indisponível"}</Text>
              </View>
              <Switch testID="availability-switch" value={avail} onValueChange={toggleAvail} trackColor={{ true: c.success }} />
            </View>
          )}

          <Pressable testID="career-link" onPress={() => router.push("/career")} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: c.brand, borderRadius: radius.lg, padding: spacing.lg }}>
            <Ionicons name="trending-up" size={22} color={c.onBrand} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.onBrand, fontSize: 16, fontWeight: "700" }}>Carreira & Conquistas</Text>
              <Text style={{ color: c.onBrand, opacity: 0.7, fontSize: 13 }}>Timeline, badges e formação</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.onBrand} />
          </Pressable>

          {/* Skills */}
          {isWorker && user.skills?.length ? (
            <Section c={c} title="Competências">
              {user.skills.map((s: any) => (
                <View key={s.name} style={{ marginBottom: spacing.md }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: c.onSurface, fontSize: 14, fontWeight: "600" }}>{s.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 13 }}>{Math.round(s.level * 100)}%</Text>
                  </View>
                  <ProgressBar value={s.level} />
                </View>
              ))}
            </Section>
          ) : null}

          {/* Certificates */}
          {isWorker && user.certificates?.length ? (
            <Section c={c} title="Certificados">
              {user.certificates.map((cert: any, i: number) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.surfaceTertiary, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="ribbon-outline" size={20} color={cert.status === "expiring" ? c.warning : c.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.onSurface, fontSize: 14, fontWeight: "600" }}>{cert.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 12 }}>{cert.issuer} · expira {cert.expires}</Text>
                  </View>
                  {cert.status === "expiring" && <Badge text="A expirar" tone="warning" />}
                </View>
              ))}
            </Section>
          ) : null}

          {/* Portfolio */}
          {isWorker && user.portfolio?.length ? (
            <Section c={c} title="Portfólio">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                {user.portfolio.map((p: any, i: number) => (
                  <View key={i} style={{ width: 180 }}>
                    <Image source={{ uri: p.image }} style={{ width: 180, height: 120, borderRadius: radius.md }} />
                    <Text style={{ color: c.onSurfaceSecondary, fontSize: 13, marginTop: 6, fontWeight: "600" }}>{p.title}</Text>
                  </View>
                ))}
              </ScrollView>
            </Section>
          ) : null}

          {/* Languages + countries */}
          <Section c={c} title="Idiomas & Países">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {[...(user.languages || []), ...(user.countries || [])].map((t, i) => (
                <View key={i} style={{ backgroundColor: c.surfaceTertiary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill }}>
                  <Text style={{ color: c.onSurface, fontSize: 13, fontWeight: "600" }}>{t}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Theme */}
          <Section c={c} title="Aparência">
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(["light", "dark", "system"] as const).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    testID={`theme-${m}`}
                    onPress={() => { Haptics.selectionAsync(); setMode(m); }}
                    style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: active ? c.brand : c.surfaceTertiary, alignItems: "center", gap: 4 }}
                  >
                    <Ionicons name={m === "light" ? "sunny" : m === "dark" ? "moon" : "contrast"} size={18} color={active ? c.onBrand : c.onSurface} />
                    <Text style={{ color: active ? c.onBrand : c.onSurface, fontSize: 12, fontWeight: "600" }}>
                      {m === "light" ? "Claro" : m === "dark" ? "Escuro" : "Sistema"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Pressable
            testID="logout-button"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); logout(); router.replace("/login"); }}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}
          >
            <Ionicons name="log-out-outline" size={20} color={c.error} />
            <Text style={{ color: c.error, fontWeight: "700", fontSize: 15 }}>Terminar Sessão</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ c, title, children }: any) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800", marginBottom: 4 }}>{title}</Text>
      <View style={{ backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}>
        {children}
      </View>
    </View>
  );
}

function IconBtn({ c, icon, onPress, testID }: any) {
  return (
    <Pressable testID={testID} onPress={onPress} style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={20} color="#fff" />
    </Pressable>
  );
}
