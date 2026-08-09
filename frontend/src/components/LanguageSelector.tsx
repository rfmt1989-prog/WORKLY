import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { languageOptions } from "@/src/demo/i18n";
import type { LanguageCode } from "@/src/demo/types";

import { workspaceColors } from "./workspace/primitives";

export function LanguageSelector({
  language,
  onChange,
  accent = workspaceColors.blue,
}: {
  language: LanguageCode;
  onChange: (language: LanguageCode) => void;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = languageOptions.find((item) => item.code === language) ?? languageOptions[0];

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Language: ${current.nativeName}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [
          styles.trigger,
          { borderColor: open ? `${accent}88` : workspaceColors.line },
          open ? { backgroundColor: `${accent}18` } : null,
          pressed ? { opacity: 0.72 } : null,
        ]}
      >
        <Ionicons name="language-outline" size={15} color={open ? accent : workspaceColors.textSoft} />
        <Text style={[styles.code, open ? { color: accent } : null]}>{current.code.toUpperCase()}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={12} color={workspaceColors.muted} />
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          {languageOptions.map((item) => {
            const active = item.code === language;
            return (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                accessibilityLabel={item.nativeName}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onChange(item.code);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  active ? { backgroundColor: `${accent}18` } : null,
                  pressed ? { opacity: 0.72 } : null,
                ]}
              >
                <Text style={[styles.optionCode, active ? { color: accent } : null]}>
                  {item.code.toUpperCase()}
                </Text>
                <Text style={[styles.optionText, active ? { color: workspaceColors.text } : null]}>
                  {item.nativeName}
                </Text>
                {active ? <Ionicons name="checkmark" size={15} color={accent} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    zIndex: 100,
  },
  trigger: {
    height: 34,
    minWidth: 72,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: workspaceColors.panelSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  code: {
    color: workspaceColors.textSoft,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  menu: {
    position: "absolute",
    top: 39,
    right: 0,
    width: 190,
    padding: 6,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    backgroundColor: workspaceColors.backgroundElevated,
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    gap: 2,
  },
  option: {
    minHeight: 36,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  optionCode: {
    width: 24,
    color: workspaceColors.muted,
    fontSize: 9,
    fontWeight: "900",
  },
  optionText: {
    flex: 1,
    color: workspaceColors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
});
