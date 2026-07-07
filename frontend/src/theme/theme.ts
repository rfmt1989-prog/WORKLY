import { useColorScheme } from "react-native";
import { useThemeMode } from "@/src/context/ThemeContext";

const palette = {
  surface: { light: "#FFFFFF", dark: "#000000" },
  onSurface: { light: "#000000", dark: "#FFFFFF" },
  surfaceSecondary: { light: "#F2F2F7", dark: "#1C1C1E" },
  onSurfaceSecondary: { light: "#3A3A3C", dark: "#EBEBF5" },
  surfaceTertiary: { light: "#E5E5EA", dark: "#2C2C2E" },
  onSurfaceTertiary: { light: "#8E8E93", dark: "#98989D" },
  surfaceInverse: { light: "#000000", dark: "#FFFFFF" },
  onSurfaceInverse: { light: "#FFFFFF", dark: "#000000" },
  brand: { light: "#000000", dark: "#FFFFFF" },
  onBrand: { light: "#FFFFFF", dark: "#000000" },
  success: { light: "#166534", dark: "#4ADE80" },
  onSuccess: { light: "#FFFFFF", dark: "#000000" },
  warning: { light: "#B45309", dark: "#FBBF24" },
  error: { light: "#DC2626", dark: "#F87171" },
  border: { light: "#E5E5EA", dark: "#38383A" },
  borderStrong: { light: "#C7C7CC", dark: "#48484A" },
  muted: { light: "#8E8E93", dark: "#98989D" },
};

export type ThemeColors = { [K in keyof typeof palette]: string } & { isDark: boolean };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export function useColors(): ThemeColors {
  const system = useColorScheme();
  const { mode } = useThemeMode();
  const scheme = mode === "system" ? system ?? "light" : mode;
  const isDark = scheme === "dark";
  const key = isDark ? "dark" : "light";
  const out: any = { isDark };
  (Object.keys(palette) as (keyof typeof palette)[]).forEach((k) => {
    out[k] = palette[k][key];
  });
  return out as ThemeColors;
}
