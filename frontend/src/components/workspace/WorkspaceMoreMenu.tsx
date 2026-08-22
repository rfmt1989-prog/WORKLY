import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { LanguageCode } from "@/src/demo/types";

import type { WorkspaceSection } from "./navigation";
import { premiumCopy } from "./premiumCopy";
import { ModalPanel, workspaceColors } from "./primitives";

type Item = {
  id: WorkspaceSection;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (section: WorkspaceSection) => void;
  items: Item[];
  activeSection: WorkspaceSection;
  accent: string;
  language: LanguageCode;
};

export function WorkspaceMoreMenu({
  visible,
  onClose,
  onNavigate,
  items,
  activeSection,
  accent,
  language,
}: Props) {
  const p = premiumCopy[language];
  return (
    <ModalPanel
      visible={visible}
      onClose={onClose}
      title={p.moreTools}
      subtitle={p.moreToolsSubtitle}
    >
      <View style={styles.grid}>
        {items.map((item) => {
          const active = activeSection === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => {
                onNavigate(item.id);
                onClose();
              }}
              style={({ pressed }) => [
                styles.item,
                active
                  ? { borderColor: `${accent}77`, backgroundColor: `${accent}12` }
                  : null,
                pressed ? { opacity: 0.72 } : null,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: `${accent}12` }]}>
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={active ? accent : workspaceColors.textSoft}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.label}</Text>
                <Text style={styles.meta}>
                  {active
                    ? p.currentArea
                    : p.open}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={workspaceColors.muted} />
            </Pressable>
          );
        })}
      </View>
    </ModalPanel>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 9 },
  item: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 14,
    backgroundColor: workspaceColors.panelSoft,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: workspaceColors.text, fontSize: 13, fontWeight: "800" },
  meta: { color: workspaceColors.muted, fontSize: 11, marginTop: 2 },
});
