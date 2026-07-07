import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";

type Mode = "light" | "dark" | "system";

const ThemeCtx = createContext<{ mode: Mode; setMode: (m: Mode) => void; cycle: () => void }>({
  mode: "system",
  setMode: () => {},
  cycle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("system");

  useEffect(() => {
    storage.getItem<string>("theme_mode", "system").then((m) => {
      if (m === "light" || m === "dark" || m === "system") setModeState(m);
    });
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    storage.setItem("theme_mode", m);
  }, []);

  const cycle = useCallback(() => {
    setModeState((prev) => {
      const next: Mode = prev === "light" ? "dark" : prev === "dark" ? "system" : "light";
      storage.setItem("theme_mode", next);
      return next;
    });
  }, []);

  return <ThemeCtx.Provider value={{ mode, setMode, cycle }}>{children}</ThemeCtx.Provider>;
}

export const useThemeMode = () => useContext(ThemeCtx);
