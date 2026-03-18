import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceThemeSelector } from "./workspace-theme-selector";

describe("workspace theme selector", () => {
  /**
   * Verifies the selector exposes all theme options with explicit day and night toggles.
   */
  it("renders every theme option and both mode toggles", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceThemeSelector
        onSelectTheme={vi.fn()}
        selection={{
          themeId: "relay-original",
          mode: "day",
        }}
      />,
    );

    expect(markup).toContain("Theme Options");
    expect(markup).toContain("Relay Original");
    expect(markup).toContain("Linen Ledger");
    expect(markup).toContain("Sage Study");
    expect(markup).toContain("Coastal Signal");
    expect(markup).toContain("Clay Ember");
    expect(markup).toContain("Citrus Press");
    expect(markup.match(/aria-label="[^"]+ day theme"/g)).toHaveLength(6);
    expect(markup.match(/aria-label="[^"]+ night theme"/g)).toHaveLength(6);
  });

  /**
   * Keeps the selected theme mode machine-readable so the active preview is obvious in the markup.
   */
  it("marks exactly one active toggle as pressed", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceThemeSelector
        onSelectTheme={vi.fn()}
        selection={{
          themeId: "clay-ember",
          mode: "night",
        }}
      />,
    );

    expect(markup).toContain("Current Theme");
    expect(markup).toContain("Clay Ember / Night");
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(1);
  });
});
