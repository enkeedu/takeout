import type { CSSProperties } from "react";

export const FONT_PRESET_KEYS = [
  "template-default",
  "editorial-serif",
  "modern-sans",
] as const;

export type FontPresetKey = (typeof FONT_PRESET_KEYS)[number];

export const FONT_PRESET_LABELS: Record<FontPresetKey, string> = {
  "template-default": "Template Default",
  "editorial-serif": "Editorial Serif",
  "modern-sans": "Modern Sans",
};

export const PALETTE_KEYS = ["imperial-red", "jade", "midnight"] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];

export const PALETTE_LABELS: Record<PaletteKey, string> = {
  "imperial-red": "Imperial Red",
  jade: "Jade",
  midnight: "Midnight",
};

type PaletteTokens = {
  accent: string;
  accentStrong: string;
  hoursFrom: string;
  hoursVia: string;
  hoursTo: string;
  hoursBorder: string;
};

const PALETTES: Record<PaletteKey, PaletteTokens> = {
  "imperial-red": {
    accent: "#B51F09",
    accentStrong: "#FFD700",
    hoursFrom: "#8f1808",
    hoursVia: "#b51f09",
    hoursTo: "#6f1207",
    hoursBorder: "#8F1D10",
  },
  jade: {
    accent: "#0F766E",
    accentStrong: "#6EE7B7",
    hoursFrom: "#0b4f48",
    hoursVia: "#0f766e",
    hoursTo: "#0a3a36",
    hoursBorder: "#0e625b",
  },
  midnight: {
    accent: "#334155",
    accentStrong: "#93C5FD",
    hoursFrom: "#1e293b",
    hoursVia: "#334155",
    hoursTo: "#0f172a",
    hoursBorder: "#475569",
  },
};

type FontTokens = {
  display: string;
  body: string;
};

const FONT_PRESETS: Partial<Record<FontPresetKey, FontTokens>> = {
  "editorial-serif": {
    display: '"Baskerville", "Times New Roman", Times, serif',
    body: '"Georgia", "Times New Roman", Times, serif',
  },
  "modern-sans": {
    display: '"Trebuchet MS", "Arial Narrow", "Helvetica Neue", Arial, sans-serif',
    body: '"Verdana", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
};

export function resolveFontPreset(requested: string | undefined): FontPresetKey {
  if (!requested) {
    return "template-default";
  }
  return FONT_PRESET_KEYS.includes(requested as FontPresetKey)
    ? (requested as FontPresetKey)
    : "template-default";
}

export function resolvePalette(requested: string | undefined): PaletteKey {
  if (!requested) {
    return "imperial-red";
  }
  return PALETTE_KEYS.includes(requested as PaletteKey)
    ? (requested as PaletteKey)
    : "imperial-red";
}

export function buildTemplateRootStyle(
  fontPreset: FontPresetKey,
  palette: PaletteKey
): CSSProperties {
  const tokens = PALETTES[palette];
  const styles: Record<string, string> = {
    "--template-accent": tokens.accent,
    "--template-accent-strong": tokens.accentStrong,
    "--template-hours-from": tokens.hoursFrom,
    "--template-hours-via": tokens.hoursVia,
    "--template-hours-to": tokens.hoursTo,
    "--template-hours-border": tokens.hoursBorder,
  };

  const fontTokens = FONT_PRESETS[fontPreset];
  if (fontTokens) {
    styles["--font-display"] = fontTokens.display;
    styles["--font-body"] = fontTokens.body;
  }

  return styles as CSSProperties;
}
