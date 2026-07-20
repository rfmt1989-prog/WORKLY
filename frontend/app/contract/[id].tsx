import React, { useCallback, useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, PanResponder, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useColors, spacing, radius } from "@/src/theme/theme";
import { Button, Badge } from "@/src/components/ui";

export default function ContractDetail() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [saving, setSaving] = useState(false);

  const [paths, setPaths] = useState<string[]>([]);
  const current = useRef("");

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>(`/contracts/${id}`);
      setContract(res);
    } catch {} finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        current.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        current.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setPaths((p) => [...p.slice(0, -1), current.current]);
      },
      onPanResponderRelease: () => {
        setPaths((p) => [...p, ""]);
      },
    })
  ).current;

  const hasSignature = paths.some((p) => p.length > 0);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post(`/contracts/${id}/sign`, { signature: user?.name || "signed" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSigning(false);
      await load();
    } catch {} finally { setSaving(false); }
  };

  if (loading || !contract) {
    return <View style={{ flex: 1, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.onSurface} /></View>;
  }

  const mySigned = user?.role === "worker" ? contract.signed_worker : contract.signed_company;
  const statusLabels: Record<string, string> = {
    active: "Ativo",
    pending: "Pendente",
    expired: "Expirado",
  };
  const statusLabel = statusLabels[String(contract.status)] || contract.status;
  const statusTone = contract.status === "active" ? "success" : contract.status === "pending" ? "warning" : "neutral";

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Pressable testID="contract-back" onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={26} color={c.onSurface} />
        </Pressable>
        <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800", flex: 1 }}>Contrato</Text>
        <Pressable testID="download-pdf" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} style={{ padding: 6 }}>
          <Ionicons name="download-outline" size={22} color={c.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + 120, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: c.onSurface, fontSize: 26, fontWeight: "800", letterSpacing: -0.5, flex: 1 }}>{contract.title}</Text>
            <Badge text={statusLabel} tone={statusTone as any} />
          </View>
          <Text style={{ color: c.muted, fontSize: 15 }}>{contract.company_name}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.xl }}>
          <Detail c={c} label="Valor" value={contract.rate} />
          <Detail c={c} label="Duração" value={contract.duration} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={{ color: c.onSurface, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Descrição</Text>
          <Text style={{ color: c.onSurfaceSecondary, fontSize: 15, lineHeight: 23 }}>{contract.summary}</Text>
        </View>

        {/* Timeline */}
        <View style={{ gap: spacing.md }}>
          <Text style={{ color: c.onSurface, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Estado</Text>
          {contract.timeline?.map((t: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ alignItems: "center" }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: t.done ? c.success : c.surfaceTertiary, alignItems: "center", justifyContent: "center" }}>
                  {t.done ? <Ionicons name="checkmark" size={14} color={c.onSuccess} /> : null}
                </View>
                {i < contract.timeline.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: c.border, marginVertical: 2 }} />}
              </View>
              <View style={{ paddingBottom: spacing.md }}>
                <Text style={{ color: c.onSurface, fontSize: 15, fontWeight: "600" }}>{t.label}</Text>
                {t.date ? <Text style={{ color: c.muted, fontSize: 12 }}>{new Date(t.date).toLocaleDateString("pt-PT")}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {/* Signature */}
        {!mySigned && contract.status !== "expired" && (
          <View style={{ gap: spacing.md }}>
            <Text style={{ color: c.onSurface, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Assinatura Digital</Text>
            {!signing ? (
              <Button testID="open-signature" label="Assinar Contrato" icon="create-outline" onPress={() => setSigning(true)} />
            ) : (
              <>
                <View
                  testID="signature-canvas"
                  {...pan.panHandlers}
                  style={{ height: 200, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderStrong, overflow: "hidden" }}
                >
                  <Svg style={StyleSheet.absoluteFill}>
                    {paths.filter((p) => p).map((p, i) => (
                      <Path key={i} d={p} stroke={c.onSurface} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                  </Svg>
                  {!hasSignature && (
                    <View style={{ ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
                      <Text style={{ color: c.muted }}>Desenhe a sua assinatura aqui</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <Button testID="clear-signature" label="Limpar" variant="secondary" onPress={() => setPaths([])} style={{ flex: 1 }} />
                  <Button testID="confirm-signature" label="Confirmar" onPress={submit} loading={saving} disabled={!hasSignature} style={{ flex: 1 }} />
                </View>
              </>
            )}
          </View>
        )}

        {mySigned && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: c.isDark ? "#14351f" : "#DCFCE7", padding: spacing.lg, borderRadius: radius.lg }}>
            <Ionicons name="checkmark-circle" size={22} color={c.success} />
            <Text style={{ color: c.success, fontWeight: "700", fontSize: 15 }}>Assinado por si</Text>
          </View>
        )}

        {contract.status === "expired" && (
          <Button testID="renew-contract" label="Renovar Contrato" icon="refresh" variant="secondary" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} />
        )}
      </ScrollView>
    </View>
  );
}

function Detail({ c, label, value }: any) {
  return (
    <View>
      <Text style={{ color: c.muted, fontSize: 12, marginBottom: 2 }}>{label}</Text>
      <Text style={{ color: c.onSurface, fontSize: 20, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
