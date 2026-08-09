import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ImmersiveWorkspaceShell } from "@/src/components/workspace/ImmersiveWorkspaceShell";
import { workspaceColors } from "@/src/components/workspace/primitives";
import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { copy } from "@/src/demo/i18n";

export default function Workspace() {
  const { loading, user } = useAuth();
  const { language } = useWorklyData();
  const t = copy[language];

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={workspaceColors.blue} size="large" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <ImmersiveWorkspaceShell />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: workspaceColors.background,
  },
  loadingText: {
    color: workspaceColors.muted,
    fontSize: 13,
  },
});