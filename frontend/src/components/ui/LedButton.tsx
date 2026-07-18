import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
} from "react-native";

import { colors, radius, spacing, typography } from "../../design";

type Accent = "worker" | "company" | "ai";

interface LedButtonProps extends PressableProps {
  label: string;
  accent?: Accent;
  loading?: boolean;
}

const accentColor = {
  worker: colors.worker,
  company: colors.company,
  ai: colors.ai,
};

export function LedButton({
  label,
  accent = "worker",
  loading = false,
  disabled,
  ...props
}: LedButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: accentColor[accent],
          shadowColor: accentColor[accent],
          backgroundColor: pressed
            ? `${accentColor[accent]}22`
            : colors.surface,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={accentColor[accent]} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.medium,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],

    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 4,
  },

  label: {
    color: colors.text,
    fontSize: typography.label.fontSize,
    fontWeight: "700",
  },
});