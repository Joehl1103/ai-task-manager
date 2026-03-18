import type { CSSProperties } from "react";

export type WorkspaceThemeId =
  | "linen-ledger"
  | "sage-study"
  | "coastal-signal"
  | "clay-ember"
  | "citrus-press";

export type WorkspaceThemeMode = "day" | "night";

export interface WorkspaceThemeSelection {
  themeId: WorkspaceThemeId;
  mode: WorkspaceThemeMode;
}

export interface WorkspaceThemePalette {
  background: string;
  foreground: string;
  surface: string;
  surfaceStrong: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  rowDivider: string;
  rowHover: string;
  rowActive: string;
  muted: string;
  mutedStrong: string;
  accent: string;
  accentForeground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  popover: string;
  popoverForeground: string;
  input: string;
  ring: string;
  focusRing: string;
  backdropStart: string;
  backdropEnd: string;
  backdropSpotlight: string;
  shadowColor: string;
}

export interface WorkspaceThemeFlag {
  id: WorkspaceThemeId;
  name: string;
  summary: string;
  day: WorkspaceThemePalette;
  night: WorkspaceThemePalette;
}

type WorkspaceThemeStyle = CSSProperties & Record<`--${string}`, string>;

export const workspaceThemeSelectionStorageKey = "relay.workspace-theme-selection";

export const workspaceThemeFlags: WorkspaceThemeFlag[] = [
  {
    id: "linen-ledger",
    name: "Linen Ledger",
    summary: "Warm paper neutrals with brass accents for a calm editorial workspace.",
    day: {
      background: "#f6efe6",
      foreground: "#201914",
      surface: "#fffaf3",
      surfaceStrong: "#fffcf8",
      surfaceMuted: "#efe2d3",
      border: "#d9c4ad",
      borderStrong: "#9e7452",
      rowDivider: "#e7d6c4",
      rowHover: "#f6ebde",
      rowActive: "#ebdccb",
      muted: "#7b6754",
      mutedStrong: "#4f3d2c",
      accent: "#7b4f2d",
      accentForeground: "#fff7ef",
      card: "#fffaf3",
      cardForeground: "#201914",
      primary: "#7b4f2d",
      primaryForeground: "#fff7ef",
      secondary: "#efe2d3",
      secondaryForeground: "#5d4836",
      popover: "#fffaf3",
      popoverForeground: "#201914",
      input: "#d9c4ad",
      ring: "#9e7452",
      focusRing: "rgba(158, 116, 82, 0.18)",
      backdropStart: "#f4e6d7",
      backdropEnd: "#f7f1e9",
      backdropSpotlight: "rgba(186, 129, 79, 0.18)",
      shadowColor: "rgba(76, 44, 18, 0.18)",
    },
    night: {
      background: "#17110d",
      foreground: "#f6eee7",
      surface: "#221913",
      surfaceStrong: "#2a1f18",
      surfaceMuted: "#33261d",
      border: "#4c3828",
      borderStrong: "#c18a56",
      rowDivider: "#3d2c20",
      rowHover: "#2c2119",
      rowActive: "#38291f",
      muted: "#baa38f",
      mutedStrong: "#eadcca",
      accent: "#c18a56",
      accentForeground: "#1d130c",
      card: "#221913",
      cardForeground: "#f6eee7",
      primary: "#c18a56",
      primaryForeground: "#1d130c",
      secondary: "#33261d",
      secondaryForeground: "#efdcc7",
      popover: "#221913",
      popoverForeground: "#f6eee7",
      input: "#4c3828",
      ring: "#c18a56",
      focusRing: "rgba(193, 138, 86, 0.24)",
      backdropStart: "#21170f",
      backdropEnd: "#130d09",
      backdropSpotlight: "rgba(193, 138, 86, 0.22)",
      shadowColor: "rgba(0, 0, 0, 0.38)",
    },
  },
  {
    id: "sage-study",
    name: "Sage Study",
    summary: "Muted botanical greens with creamy surfaces and a quiet studio feel.",
    day: {
      background: "#eef2eb",
      foreground: "#1b241d",
      surface: "#f8fbf6",
      surfaceStrong: "#fcfefb",
      surfaceMuted: "#e1e9dd",
      border: "#bccbbd",
      borderStrong: "#6a826b",
      rowDivider: "#d3ddd0",
      rowHover: "#edf4e8",
      rowActive: "#e3ebde",
      muted: "#607164",
      mutedStrong: "#334336",
      accent: "#567456",
      accentForeground: "#f4faf4",
      card: "#f8fbf6",
      cardForeground: "#1b241d",
      primary: "#567456",
      primaryForeground: "#f4faf4",
      secondary: "#e1e9dd",
      secondaryForeground: "#3d5240",
      popover: "#f8fbf6",
      popoverForeground: "#1b241d",
      input: "#bccbbd",
      ring: "#6a826b",
      focusRing: "rgba(106, 130, 107, 0.18)",
      backdropStart: "#dde8d8",
      backdropEnd: "#f3f7f1",
      backdropSpotlight: "rgba(86, 116, 86, 0.18)",
      shadowColor: "rgba(33, 56, 37, 0.16)",
    },
    night: {
      background: "#0f1511",
      foreground: "#eef5ef",
      surface: "#17201a",
      surfaceStrong: "#1d2820",
      surfaceMuted: "#253128",
      border: "#37503d",
      borderStrong: "#8db48f",
      rowDivider: "#2a3a2f",
      rowHover: "#1d2921",
      rowActive: "#253228",
      muted: "#afc2b2",
      mutedStrong: "#e4eee5",
      accent: "#8db48f",
      accentForeground: "#102013",
      card: "#17201a",
      cardForeground: "#eef5ef",
      primary: "#8db48f",
      primaryForeground: "#102013",
      secondary: "#253128",
      secondaryForeground: "#d8e6da",
      popover: "#17201a",
      popoverForeground: "#eef5ef",
      input: "#37503d",
      ring: "#8db48f",
      focusRing: "rgba(141, 180, 143, 0.24)",
      backdropStart: "#18241b",
      backdropEnd: "#0c120e",
      backdropSpotlight: "rgba(141, 180, 143, 0.18)",
      shadowColor: "rgba(0, 0, 0, 0.34)",
    },
  },
  {
    id: "coastal-signal",
    name: "Coastal Signal",
    summary: "Sea-glass blues, salt-air neutrals, and a sharper product-design contrast.",
    day: {
      background: "#edf6f8",
      foreground: "#12222b",
      surface: "#f8fcfd",
      surfaceStrong: "#fcfeff",
      surfaceMuted: "#deedf1",
      border: "#bcd6df",
      borderStrong: "#4f8ca0",
      rowDivider: "#d3e5eb",
      rowHover: "#edf7fa",
      rowActive: "#e1f0f4",
      muted: "#5a7480",
      mutedStrong: "#26424f",
      accent: "#2d7186",
      accentForeground: "#eff9fc",
      card: "#f8fcfd",
      cardForeground: "#12222b",
      primary: "#2d7186",
      primaryForeground: "#eff9fc",
      secondary: "#deedf1",
      secondaryForeground: "#355464",
      popover: "#f8fcfd",
      popoverForeground: "#12222b",
      input: "#bcd6df",
      ring: "#4f8ca0",
      focusRing: "rgba(79, 140, 160, 0.18)",
      backdropStart: "#d8edf4",
      backdropEnd: "#f5fafb",
      backdropSpotlight: "rgba(77, 140, 160, 0.2)",
      shadowColor: "rgba(20, 67, 84, 0.16)",
    },
    night: {
      background: "#081623",
      foreground: "#e9f7fb",
      surface: "#102231",
      surfaceStrong: "#142a3b",
      surfaceMuted: "#193345",
      border: "#28506a",
      borderStrong: "#6fd6d1",
      rowDivider: "#1f3e53",
      rowHover: "#142838",
      rowActive: "#193345",
      muted: "#9ebfcc",
      mutedStrong: "#d7eef6",
      accent: "#6fd6d1",
      accentForeground: "#08201f",
      card: "#102231",
      cardForeground: "#e9f7fb",
      primary: "#6fd6d1",
      primaryForeground: "#08201f",
      secondary: "#193345",
      secondaryForeground: "#d1ebf5",
      popover: "#102231",
      popoverForeground: "#e9f7fb",
      input: "#28506a",
      ring: "#6fd6d1",
      focusRing: "rgba(111, 214, 209, 0.24)",
      backdropStart: "#0f2534",
      backdropEnd: "#05101a",
      backdropSpotlight: "rgba(111, 214, 209, 0.26)",
      shadowColor: "rgba(0, 0, 0, 0.36)",
    },
  },
  {
    id: "clay-ember",
    name: "Clay Ember",
    summary: "Terracotta highlights and ember tones that feel warm without going pastel.",
    day: {
      background: "#faf0ea",
      foreground: "#281714",
      surface: "#fff7f3",
      surfaceStrong: "#fffaf8",
      surfaceMuted: "#f2ddd3",
      border: "#dfbcaf",
      borderStrong: "#b0614a",
      rowDivider: "#eccfc2",
      rowHover: "#fbece5",
      rowActive: "#f5e0d5",
      muted: "#8a6154",
      mutedStrong: "#59342b",
      accent: "#b0614a",
      accentForeground: "#fff4ef",
      card: "#fff7f3",
      cardForeground: "#281714",
      primary: "#b0614a",
      primaryForeground: "#fff4ef",
      secondary: "#f2ddd3",
      secondaryForeground: "#74483d",
      popover: "#fff7f3",
      popoverForeground: "#281714",
      input: "#dfbcaf",
      ring: "#b0614a",
      focusRing: "rgba(176, 97, 74, 0.18)",
      backdropStart: "#f8ddd1",
      backdropEnd: "#fcf3ee",
      backdropSpotlight: "rgba(176, 97, 74, 0.2)",
      shadowColor: "rgba(87, 41, 31, 0.16)",
    },
    night: {
      background: "#140d0c",
      foreground: "#f9ece7",
      surface: "#211513",
      surfaceStrong: "#2a1b19",
      surfaceMuted: "#342220",
      border: "#593b34",
      borderStrong: "#df8a70",
      rowDivider: "#412a25",
      rowHover: "#281916",
      rowActive: "#34211e",
      muted: "#c0a097",
      mutedStrong: "#f0ddd7",
      accent: "#df8a70",
      accentForeground: "#28110a",
      card: "#211513",
      cardForeground: "#f9ece7",
      primary: "#df8a70",
      primaryForeground: "#28110a",
      secondary: "#342220",
      secondaryForeground: "#f0dad3",
      popover: "#211513",
      popoverForeground: "#f9ece7",
      input: "#593b34",
      ring: "#df8a70",
      focusRing: "rgba(223, 138, 112, 0.24)",
      backdropStart: "#221310",
      backdropEnd: "#0f0908",
      backdropSpotlight: "rgba(223, 138, 112, 0.2)",
      shadowColor: "rgba(0, 0, 0, 0.36)",
    },
  },
  {
    id: "citrus-press",
    name: "Citrus Press",
    summary: "Crisp parchment yellows, olive depth, and a brighter brand-forward edge.",
    day: {
      background: "#f8f5e8",
      foreground: "#262414",
      surface: "#fffdf4",
      surfaceStrong: "#fffef8",
      surfaceMuted: "#eeead2",
      border: "#d7d0a9",
      borderStrong: "#8a8440",
      rowDivider: "#e5dec0",
      rowHover: "#f7f3e2",
      rowActive: "#ede8cf",
      muted: "#76704c",
      mutedStrong: "#4e4a2a",
      accent: "#8a8440",
      accentForeground: "#fffdf0",
      card: "#fffdf4",
      cardForeground: "#262414",
      primary: "#8a8440",
      primaryForeground: "#fffdf0",
      secondary: "#eeead2",
      secondaryForeground: "#5f5b36",
      popover: "#fffdf4",
      popoverForeground: "#262414",
      input: "#d7d0a9",
      ring: "#8a8440",
      focusRing: "rgba(138, 132, 64, 0.18)",
      backdropStart: "#f0eac6",
      backdropEnd: "#fbf8ee",
      backdropSpotlight: "rgba(171, 154, 74, 0.18)",
      shadowColor: "rgba(74, 70, 24, 0.16)",
    },
    night: {
      background: "#13140c",
      foreground: "#f7f5e5",
      surface: "#1d2012",
      surfaceStrong: "#242817",
      surfaceMuted: "#2e321d",
      border: "#4b5230",
      borderStrong: "#d6c667",
      rowDivider: "#373c24",
      rowHover: "#232716",
      rowActive: "#2d311d",
      muted: "#bbb88c",
      mutedStrong: "#eeedcf",
      accent: "#d6c667",
      accentForeground: "#171809",
      card: "#1d2012",
      cardForeground: "#f7f5e5",
      primary: "#d6c667",
      primaryForeground: "#171809",
      secondary: "#2e321d",
      secondaryForeground: "#e5dfb1",
      popover: "#1d2012",
      popoverForeground: "#f7f5e5",
      input: "#4b5230",
      ring: "#d6c667",
      focusRing: "rgba(214, 198, 103, 0.24)",
      backdropStart: "#222513",
      backdropEnd: "#0c0d08",
      backdropSpotlight: "rgba(214, 198, 103, 0.18)",
      shadowColor: "rgba(0, 0, 0, 0.34)",
    },
  },
];

export const defaultWorkspaceThemeSelection: WorkspaceThemeSelection = {
  themeId: "linen-ledger",
  mode: "day",
};

/**
 * Restores a saved theme selection while falling back to the default pair when storage is stale.
 */
export function normalizeWorkspaceThemeSelection(value: unknown): WorkspaceThemeSelection {
  if (!isRecord(value)) {
    return defaultWorkspaceThemeSelection;
  }

  const themeId = isWorkspaceThemeId(value.themeId)
    ? value.themeId
    : defaultWorkspaceThemeSelection.themeId;
  const mode = isWorkspaceThemeMode(value.mode) ? value.mode : defaultWorkspaceThemeSelection.mode;

  return {
    themeId,
    mode,
  };
}

/**
 * Finds the full theme definition for one feature-flagged visual direction.
 */
export function readWorkspaceThemeFlag(themeId: WorkspaceThemeId): WorkspaceThemeFlag {
  return workspaceThemeFlags.find((themeFlag) => themeFlag.id === themeId) ?? workspaceThemeFlags[0];
}

/**
 * Returns the specific palette for the active day or night mode.
 */
export function readWorkspaceThemePalette(
  selection: WorkspaceThemeSelection,
): WorkspaceThemePalette {
  const themeFlag = readWorkspaceThemeFlag(selection.themeId);

  return selection.mode === "night" ? themeFlag.night : themeFlag.day;
}

/**
 * Formats the selection for compact labels inside the preview controls.
 */
export function readWorkspaceThemeLabel(selection: WorkspaceThemeSelection): string {
  const themeFlag = readWorkspaceThemeFlag(selection.themeId);

  return `${themeFlag.name} / ${capitalizeThemeMode(selection.mode)}`;
}

/**
 * Converts the active palette into CSS custom properties for the shell wrapper.
 */
export function buildWorkspaceThemeStyle(
  selection: WorkspaceThemeSelection,
): WorkspaceThemeStyle {
  const palette = readWorkspaceThemePalette(selection);

  return {
    "--background": palette.background,
    "--foreground": palette.foreground,
    "--surface": palette.surface,
    "--surface-strong": palette.surfaceStrong,
    "--surface-muted": palette.surfaceMuted,
    "--border": palette.border,
    "--border-strong": palette.borderStrong,
    "--row-divider": palette.rowDivider,
    "--row-hover": palette.rowHover,
    "--row-active": palette.rowActive,
    "--muted": palette.muted,
    "--muted-strong": palette.mutedStrong,
    "--accent": palette.accent,
    "--accent-foreground": palette.accentForeground,
    "--card": palette.card,
    "--card-foreground": palette.cardForeground,
    "--primary": palette.primary,
    "--primary-foreground": palette.primaryForeground,
    "--secondary": palette.secondary,
    "--secondary-foreground": palette.secondaryForeground,
    "--popover": palette.popover,
    "--popover-foreground": palette.popoverForeground,
    "--input": palette.input,
    "--ring": palette.ring,
    "--focus-ring": palette.focusRing,
    "--backdrop-start": palette.backdropStart,
    "--backdrop-end": palette.backdropEnd,
    "--backdrop-spotlight": palette.backdropSpotlight,
    "--shadow-color": palette.shadowColor,
  };
}

/**
 * Narrows unknown local-storage values without pulling parsing logic into the client component.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/**
 * Confirms a candidate string maps to one of the supported preview flags.
 */
function isWorkspaceThemeId(value: unknown): value is WorkspaceThemeId {
  return (
    typeof value === "string" &&
    workspaceThemeFlags.some((themeFlag) => themeFlag.id === value)
  );
}

/**
 * Validates the saved mode so the UI only hydrates supported day or night previews.
 */
function isWorkspaceThemeMode(value: unknown): value is WorkspaceThemeMode {
  return value === "day" || value === "night";
}

/**
 * Keeps UI labels readable without repeating capitalization logic in the selector.
 */
function capitalizeThemeMode(mode: WorkspaceThemeMode): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}
