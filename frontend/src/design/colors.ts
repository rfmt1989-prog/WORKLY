export const colors = {
  background: "#05070A",
  backgroundElevated: "#090D12",

  surface: "#0C1118",
  surfaceHover: "#111823",

  border: "#1D2733",
  borderStrong: "#2B3948",

  text: "#F8FAFC",
  textMuted: "#8E9AAA",
  textDisabled: "#566170",

  worker: "#27A7FF",
  workerSoft: "rgba(39, 167, 255, 0.14)",

  company: "#FF2D2D",
  companySoft: "rgba(255, 45, 45, 0.14)",

  ai: "#9B5CFF",
  aiSoft: "rgba(155, 92, 255, 0.14)",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#FF2D2D",
  info: "#27A7FF",

  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

export type WorklyColor = keyof typeof colors;