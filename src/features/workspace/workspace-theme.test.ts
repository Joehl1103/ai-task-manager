import { describe, expect, it } from "vitest";

import {
  buildWorkspaceThemeStyle,
  defaultWorkspaceThemeSelection,
  normalizeWorkspaceThemeSelection,
  readWorkspaceThemeLabel,
  workspaceThemeFlags,
} from "./workspace-theme";

describe("workspace theme registry", () => {
  /**
   * Guards the requested theme scope so we do not accidentally ship fewer variants later.
   */
  it("defines six paired day and night theme options", () => {
    expect(workspaceThemeFlags).toHaveLength(6);
    expect(defaultWorkspaceThemeSelection).toEqual({
      themeId: "relay-original",
      mode: "day",
    });
  });

  /**
   * Keeps saved browser preferences resilient when local storage contains stale or malformed values.
   */
  it("falls back to the default selection when saved data is invalid", () => {
    expect(normalizeWorkspaceThemeSelection(null)).toEqual(defaultWorkspaceThemeSelection);
    expect(
      normalizeWorkspaceThemeSelection({
        themeId: "missing-theme",
        mode: "midnight",
      }),
    ).toEqual(defaultWorkspaceThemeSelection);
  });

  /**
   * Confirms the active selection can be converted into CSS variables for the shell wrapper.
   */
  it("builds the expected CSS variable map for a selected theme mode", () => {
    const style = buildWorkspaceThemeStyle({
      themeId: "coastal-signal",
      mode: "night",
    });

    expect(style["--background"]).toBe("#081623");
    expect(style["--accent"]).toBe("#6fd6d1");
    expect(style["--backdrop-spotlight"]).toBe("rgba(111, 214, 209, 0.26)");
  });

  /**
   * Gives the UI a friendly, human-readable active preview label.
   */
  it("formats the active theme label with its mode", () => {
    expect(
      readWorkspaceThemeLabel({
        themeId: "linen-ledger",
        mode: "day",
      }),
    ).toBe("Linen Ledger / Day");
  });
});
