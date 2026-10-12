import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { DemoDocument, LanguageCode } from "@/src/demo/types";
import { Button } from "./primitives";
import { walletText } from "./walletI18n";

export function WorkerDocumentVerification({ document, language, onSaved }: { document: DemoDocument; language: LanguageCode; onSaved: () => void }) {
  const { user } = useAuth();
  const { notify, reload } = useWorklyData();
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<DemoDocument["fitness_decision"]>(document.fitness_decision);
  const t = (key: Parameters<typeof walletText>[1]) => walletText(language, key);
  const canVerify = user?.role === "company" && user.permissions?.includes("documents.manage") && document.file_id;
  const verify = async (status: "verified" | "rejected") => {
    if (busy || !canVerify) return;
    setBusy(true);
    try {
      await api.patch(`/files/${document.file_id}/verification`, { status, fitness_decision: decision });
      await reload(true);
      notify(t("saved"), "success");
      onSaved();
    } catch { notify(t("failed"), "error"); }
    finally { setBusy(false); }
  };
  if (document.owner_type !== "worker") return null;
  return <View style={styles.box} testID="document-verification">
    <Text style={styles.title}>{document.status === "verified" ? t("verified") : document.status === "rejected" ? t("rejected") : t("review")}</Text>
    {!canVerify ? <Text style={styles.note}>{t("reviewNote")}</Text> : <>
      {document.category === "medical" ? <>
        <Text style={styles.note}>{t("medicalNote")}</Text>
        <Text style={styles.title}>{t("medicalResult")}</Text>
        <View style={styles.options}>{([ ["fit", "medicalFit"], ["conditional", "medicalConditional"], ["unfit", "medicalUnfit"] ] as const).map(([value, key]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: decision === value, disabled: busy }} disabled={busy} onPress={() => setDecision(value)} style={[styles.option, decision === value && styles.selected]}><Text style={styles.label}>{t(key)}</Text></Pressable>)}</View>
      </> : null}
      <View style={styles.actions}>
        <Button label={t("validateDoc")} icon="shield-checkmark-outline" loading={busy} disabled={document.category === "medical" && !decision} onPress={() => void verify("verified")} />
        <Button label={t("rejectDoc")} variant="secondary" disabled={busy} onPress={() => void verify("rejected")} />
      </View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: "#29445B", borderRadius: 14, padding: 14, gap: 12 },
  title: { color: "#D6E6F3", fontSize: 12, lineHeight: 18, fontWeight: "600" },
  note: { color: "#8AA5BA", fontSize: 11, lineHeight: 18 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { padding: 10, borderWidth: 1, borderColor: "#294257", borderRadius: 9 },
  selected: { backgroundColor: "#193F69", borderColor: "#77B2EF" },
  label: { color: "#BDDCF4", fontSize: 11, lineHeight: 17 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
});
