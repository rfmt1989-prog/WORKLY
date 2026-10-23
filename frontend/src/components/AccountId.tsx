import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, StyleSheet, Text, View } from "react-native";

import { workspaceColors } from "./workspace/primitives";

export function AccountId({ value, hint }: { value: string; hint: string }) {
  return (
    <View style={styles.root} testID="account-workly-id">
      <View style={styles.row}>
        <Ionicons name="id-card-outline" size={16} color={workspaceColors.blueSoft} />
        <Text style={styles.label}>WORKLY ID</Text>
        <Text selectable accessibilityLabel={`WORKLY ID: ${value}`} style={styles.value}>
          {value}
        </Text>
      </View>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: "stretch", gap: 5, marginTop: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  label: { color: workspaceColors.textSoft, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  value: { color: workspaceColors.blueSoft, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, flexShrink: 1 },
  hint: { color: workspaceColors.muted, fontSize: 11, lineHeight: 17 },
});
