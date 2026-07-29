import type { ComponentProps, ReactNode } from "react";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import type { UserRole, WorkerStatus } from "@/src/demo/types";

export const workspaceColors = {
  background: "#07090E",
  backgroundElevated: "#0A0D14",
  panel: "#10141D",
  panelStrong: "#151B26",
  panelSoft: "#0C1018",
  line: "#242C3B",
  lineStrong: "#354156",
  text: "#F5F8FF",
  textSoft: "#C8D0E0",
  muted: "#7F8A9D",
  blue: "#2388FF",
  blueSoft: "#72BCFF",
  red: "#FF3B48",
  redSoft: "#FF7A82",
  green: "#2FE39C",
  yellow: "#FFCD57",
  orange: "#FF954D",
  shadow: "#000000",
};

export function roleAccent(role: UserRole) {
  return role === "worker" ? workspaceColors.blue : workspaceColors.red;
}

type IconName = ComponentProps<typeof Ionicons>["name"];

export function Card({
  children,
  style,
  accent,
  testID,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  accent?: string;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        accent ? { borderColor: `${accent}55` } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  accent = workspaceColors.blue,
  variant = "primary",
  disabled = false,
  loading = false,
  compact = false,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  accent?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  testID?: string;
  style?: ViewStyle | ViewStyle[];
}) {
  const backgroundColor =
    variant === "primary"
      ? accent
      : variant === "danger"
        ? `${workspaceColors.red}22`
        : variant === "secondary"
          ? workspaceColors.panelStrong
          : "transparent";
  const borderColor =
    variant === "danger"
      ? `${workspaceColors.red}88`
      : variant === "primary"
        ? accent
        : workspaceColors.lineStrong;
  const color =
    variant === "danger"
      ? workspaceColors.redSoft
      : variant === "primary"
        ? "#FFFFFF"
        : workspaceColors.textSoft;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.buttonCompact : null,
        { backgroundColor, borderColor },
        pressed && !disabled ? { opacity: 0.78, transform: [{ scale: 0.985 }] } : null,
        disabled ? { opacity: 0.45 } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={compact ? 15 : 17} color={color} /> : null}
          <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  accent,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  accent?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        accent ? { borderColor: `${accent}66` } : null,
        pressed ? { opacity: 0.65 } : null,
      ]}
    >
      <Ionicons name={icon} size={19} color={accent ?? workspaceColors.textSoft} />
    </Pressable>
  );
}

export function Avatar({
  name,
  size = 44,
  accent = workspaceColors.blue,
  flag,
}: {
  name: string;
  size?: number;
  accent?: string;
  flag?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: accent,
            shadowColor: accent,
          },
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: Math.max(12, size * 0.3) }]}>
          {initials}
        </Text>
      </View>
      {flag ? (
        <View
          style={[
            styles.flagBadge,
            {
              width: Math.max(19, size * 0.38),
              height: Math.max(19, size * 0.38),
              borderRadius: Math.max(10, size * 0.19),
            },
          ]}
        >
          <Text style={{ fontSize: Math.max(10, size * 0.22) }}>{flag}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function StatusPill({
  status,
  label,
}: {
  status: WorkerStatus | string;
  label: string;
}) {
  const color =
    status === "on_site" || status === "active"
      ? workspaceColors.green
      : status === "contracted" || status === "assigned"
        ? workspaceColors.blueSoft
        : status === "paused"
          ? workspaceColors.orange
          : workspaceColors.muted;
  return (
    <View style={[styles.pill, { borderColor: `${color}66`, backgroundColor: `${color}16` }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function Score({
  value,
  label,
  accent = workspaceColors.blue,
  compact = false,
}: {
  value: number;
  label: string;
  accent?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.score, compact ? styles.scoreCompact : null]}>
      <View
        style={[
          styles.scoreCircle,
          compact ? styles.scoreCircleCompact : null,
          { borderColor: accent, shadowColor: accent },
        ]}
      >
        <Text style={[styles.scoreValue, compact ? { fontSize: 15 } : null]}>
          {value.toFixed(1)}
        </Text>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  accent = workspaceColors.blue,
}: {
  value: number;
  accent?: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${normalized}%`, backgroundColor: accent, shadowColor: accent },
        ]}
      />
    </View>
  );
}

export function Field({
  label,
  multiline,
  style,
  ...props
}: TextInputProps & { label: string; style?: ViewStyle }) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={workspaceColors.muted}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
      />
    </View>
  );
}

export function ModalPanel({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={[styles.modalPanel, wide ? styles.modalPanelWide : null]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>
            <IconButton icon="close" label="Close" onPress={onClose} />
          </View>
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.modalFooter}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={34} color={workspaceColors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDescription}>{description}</Text> : null}
    </View>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  detail?: string;
  accent: string;
}) {
  return (
    <Card style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={icon} size={19} color={accent} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </Card>
  );
}

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: workspaceColors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    color: workspaceColors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  subtitle: {
    color: workspaceColors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    color: workspaceColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    color: workspaceColors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: workspaceColors.panel,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 18,
    padding: 16,
    shadowColor: workspaceColors.shadow,
    shadowOpacity: Platform.OS === "web" ? 0.22 : 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    color: workspaceColors.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: workspaceColors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  button: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonCompact: {
    minHeight: 34,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  buttonLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: workspaceColors.panelStrong,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    backgroundColor: workspaceColors.panelStrong,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarText: {
    color: workspaceColors.text,
    fontWeight: "800",
  },
  flagBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: workspaceColors.panelStrong,
    borderWidth: 2,
    borderColor: workspaceColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    minHeight: 27,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  score: {
    alignItems: "center",
    gap: 7,
  },
  scoreCompact: {
    gap: 5,
  },
  scoreCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    backgroundColor: workspaceColors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  scoreCircleCompact: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 2,
  },
  scoreValue: {
    color: workspaceColors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  scoreLabel: {
    color: workspaceColors.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: workspaceColors.panelStrong,
    overflow: "hidden",
  },
  progressFill: {
    height: 7,
    borderRadius: 4,
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  fieldWrap: {
    gap: 7,
  },
  fieldLabel: {
    color: workspaceColors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    backgroundColor: workspaceColors.panelSoft,
    color: workspaceColors.text,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    outlineStyle: "none",
  } as never,
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,4,9,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalPanel: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "88%",
    backgroundColor: workspaceColors.backgroundElevated,
    borderWidth: 1,
    borderColor: workspaceColors.lineStrong,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
  },
  modalPanelWide: {
    maxWidth: 820,
  },
  modalHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: workspaceColors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    color: workspaceColors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: workspaceColors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  modalBody: {
    padding: 18,
    gap: 14,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: workspaceColors.line,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  empty: {
    paddingVertical: 34,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: workspaceColors.textSoft,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyDescription: {
    color: workspaceColors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  metricCard: {
    minWidth: 150,
    flex: 1,
    gap: 7,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  metricLabel: {
    color: workspaceColors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  metricValue: {
    color: workspaceColors.text,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  metricDetail: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    lineHeight: 16,
  },
});

