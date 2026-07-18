import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, spacing, typography } from "../../design";

type Accent = "worker" | "company";

type LedInputProps = TextInputProps & {
  label?: string;
  accent?: Accent;
  error?: string;
};

export function LedInput({
  label,
  accent = "worker",
  error,
  style,
  ...props
}: LedInputProps) {
  const accentColor =
    accent === "worker" ? colors.worker : colors.company;

  return (
    <View style={{ width: "100%" }}>
      {label ? (
        <Text
          style={{
            color: colors.textMuted,
            marginBottom: spacing[2],
            fontSize: typography.caption.fontSize,
          }}
        >
          {label}
        </Text>
      ) : null}

      <TextInput
        {...props}
        placeholderTextColor={colors.textDisabled}
        selectionColor={accentColor}
        style={[
          {
            width: "100%",
            minHeight: 48,
            color: colors.text,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.medium,
            paddingHorizontal: spacing[4],
            fontSize: typography.body.fontSize,
          },
          style,
        ]}
      />

      {error ? (
        <Text
          style={{
            color: colors.danger,
            marginTop: spacing[2],
            fontSize: typography.caption.fontSize,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}