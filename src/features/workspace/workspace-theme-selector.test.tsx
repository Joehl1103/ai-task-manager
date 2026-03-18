import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceThemeSelector } from "./workspace-theme-selector";

describe("workspace theme selector", () => {
  /**
   * Verifies the preview panel exposes all five paired flags with explicit day and night toggles.
   */
  it("renders every theme flag and both mode toggles", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceThemeSelector
        onSelectTheme={vi.fn()}
        selection={{
          themeId: "linen-ledger",
          mode: "day",
        }}
      />,
    );

    expect(markup).toContain("Theme Flags");
    expect(markup).toContain("Linen Ledger");
    expect(markup).toContain("Sage Study");
    expect(markup).toContain("Coastal Signal");
    expect(markup).toContain("Clay Ember");
    expect(markup).toContain("Citrus Press");
    expect(markup.match(/aria-label="[^"]+ day theme"/g)).toHaveLength(5);
    expect(markup.match(/aria-label="[^"]+ night theme"/g)).toHaveLength(5);
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

    expect(markup).toContain("Active Preview");
    expect(markup).toContain("Clay Ember / Night");
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(1);
  });
});
