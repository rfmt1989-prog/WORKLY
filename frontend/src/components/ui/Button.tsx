import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  radius,
  spacing,
  useColors,
} from "@/src/theme/theme";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  label,
  icon,
  loading = false,
  variant = "primary",
  disabled,
  style,
  ...props
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor:
            variant === "primary"
              ? colors.surfaceSecondary
              : "transparent",
          borderColor: colors.borderStrong,
          opacity: isDisabled
            ? 0.5
            : state.pressed
              ? 0.78
              : 1,
        },
        typeof style === "function"
          ? style(state)
          : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={colors.onSurface}
        />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons
              name={icon}
              size={19}
              color={colors.onSurface}
            />
          ) : null}

          <Text
            style={[
              styles.label,
              {
                color: colors.onSurface,
                marginLeft: icon
                  ? spacing.sm
                  : 0,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
  },
});
