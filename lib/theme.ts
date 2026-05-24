import { useColorScheme } from "react-native";

import { useAppStore } from "../store/useAppStore";

export type ThemeMode = "system" | "light" | "dark";

export type ThemeColors = {
  background: string;
  card: string;
  elevated: string;
  border: string;
  shadow: string;
  text: string;
  secondaryText: string;
  primary: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  inverseText: string;
};

export type ThemeTokens = {
  colors: ThemeColors;
  shadow: string;
};

const baseLight: ThemeColors = {
  background: "#F7F8FA",
  card: "#FFFFFF",
  elevated: "#FFFFFF",
  border: "rgba(17, 24, 39, 0.08)",
  shadow: "rgba(15, 23, 42, 0.06)",
  text: "#111827",
  secondaryText: "#6B7280",
  primary: "#2563EB",
  primarySoft: "rgba(37, 99, 235, 0.12)",
  success: "#16A34A",
  successSoft: "rgba(22, 163, 74, 0.12)",
  warning: "#F59E0B",
  warningSoft: "rgba(245, 158, 11, 0.12)",
  danger: "#DC2626",
  dangerSoft: "rgba(220, 38, 38, 0.12)",
  overlay: "rgba(15, 23, 42, 0.6)",
  inverseText: "#FFFFFF"
};

const baseDark: ThemeColors = {
  background: "#0F172A",
  card: "#1E293B",
  elevated: "#223044",
  border: "rgba(148, 163, 184, 0.18)",
  shadow: "rgba(2, 6, 23, 0.28)",
  text: "#F8FAFC",
  secondaryText: "#94A3B8",
  primary: "#60A5FA",
  primarySoft: "rgba(96, 165, 250, 0.16)",
  success: "#4ADE80",
  successSoft: "rgba(74, 222, 128, 0.16)",
  warning: "#FBBF24",
  warningSoft: "rgba(251, 191, 36, 0.16)",
  danger: "#F87171",
  dangerSoft: "rgba(248, 113, 113, 0.16)",
  overlay: "rgba(2, 6, 23, 0.72)",
  inverseText: "#0F172A"
};

const highContrastLight: ThemeColors = {
  ...baseLight,
  border: "rgba(17, 24, 39, 0.18)",
  shadow: "rgba(15, 23, 42, 0.08)",
  primarySoft: "rgba(37, 99, 235, 0.18)",
  successSoft: "rgba(22, 163, 74, 0.18)",
  warningSoft: "rgba(245, 158, 11, 0.18)",
  dangerSoft: "rgba(220, 38, 38, 0.18)"
};

const highContrastDark: ThemeColors = {
  ...baseDark,
  border: "rgba(248, 250, 252, 0.24)",
  shadow: "rgba(2, 6, 23, 0.3)",
  primarySoft: "rgba(96, 165, 250, 0.22)",
  successSoft: "rgba(74, 222, 128, 0.22)",
  warningSoft: "rgba(251, 191, 36, 0.22)",
  dangerSoft: "rgba(248, 113, 113, 0.22)"
};

export function resolveTheme(mode: ThemeMode, systemDark: boolean, highContrast: boolean): ThemeTokens {
  const isDark = mode === "system" ? systemDark : mode === "dark";
  const colors = isDark ? highContrast ? highContrastDark : baseDark : highContrast ? highContrastLight : baseLight;

  return {
    colors,
    shadow: isDark ? "rgba(2, 6, 23, 0.28)" : "rgba(15, 23, 42, 0.06)"
  };
}

export function useAppTheme() {
  const scheme = useColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);
  const highContrast = useAppStore((state) => state.highContrast);
  return resolveTheme(themeMode, scheme === "dark", highContrast).colors;
}

export const layout = {
  radius: {
    card: 24,
    button: 20,
    input: 20,
    modal: 24
  },
  spacing: {
    page: 20,
    section: 24,
    stack: 16
  },
  touchTarget: 48
};