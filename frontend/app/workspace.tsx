import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ImmersiveWorkspaceShell } from "@/src/components/workspace/ImmersiveWorkspaceShell";
import { workspaceColors } from "@/src/components/workspace/primitives";
import { useAuth } from "@/src/context/AuthContext";

export default function Workspace() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={workspaceColors.blue} size="large" />
        <Text style={styles.loadingText}>A recuperar a sessão…</Text>
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
