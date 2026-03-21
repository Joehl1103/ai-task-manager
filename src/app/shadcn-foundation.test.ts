import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Reads a repo-root file so foundation config regressions are caught by the normal test suite.
 */
function readProjectFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("shadcn foundation", () => {
  /**
   * Confirms the phase-1 config file stays aligned with the existing Next.js, Tailwind, and alias
   * setup so later component installs land in the right places.
   */
  it("defines the expected shadcn/ui config", () => {
    const config = JSON.parse(readProjectFile("components.json")) as {
      style: string;
      rsc: boolean;
      tsx: boolean;
      iconLibrary: string;
      tailwind: {
        config: string;
        css: string;
        baseColor: string;
        cssVariables: boolean;
        prefix: string;
      };
      aliases: Record<string, string>;
    };

    expect(config.style).toBe("new-york");
    expect(config.rsc).toBe(true);
    expect(config.tsx).toBe(true);
    expect(config.iconLibrary).toBe("lucide");
    expect(config.tailwind).toEqual({
      config: "",
      css: "src/app/globals.css",
      baseColor: "neutral",
      cssVariables: true,
      prefix: "",
    });
    expect(config.aliases).toMatchObject({
      components: "@/components",
      ui: "@/components/ui",
      lib: "@/lib",
      utils: "@/lib/utils",
    });
  });

  /**
   * Keeps the typography, radius, and overlay shadow tokens centralized in the global stylesheet
   * instead of drifting back to arbitrary utility values.
   */
  it("defines the phase-1 design tokens in globals.css", () => {
    const globalsCss = readProjectFile("src/app/globals.css");

    expect(globalsCss).toContain("--font-size-xs: 0.75rem;");
    expect(globalsCss).toContain("--font-size-sm: 0.875rem;");
    expect(globalsCss).toContain("--font-size-base: 1rem;");
    expect(globalsCss).toContain("--font-size-xl: 1.25rem;");
    expect(globalsCss).toContain("--font-size-2xl: 1.5rem;");
    expect(globalsCss).toContain("--radius: 0.375rem;");
    expect(globalsCss).toContain("--shadow-sm:");
    expect(globalsCss).toContain("--shadow-md:");
    expect(globalsCss).toContain("--text-xs: var(--font-size-xs);");
    expect(globalsCss).toContain("--text-sm: var(--font-size-sm);");
    expect(globalsCss).toContain("--text-base: var(--font-size-base);");
    expect(globalsCss).toContain("--text-xl: var(--font-size-xl);");
    expect(globalsCss).toContain("--text-2xl: var(--font-size-2xl);");
    expect(globalsCss).toContain("--radius-sm: calc(var(--radius) - 4px);");
    expect(globalsCss).toContain("--radius-md: calc(var(--radius) - 2px);");
    expect(globalsCss).toContain("--radius-lg: var(--radius);");
    expect(globalsCss).toContain("--radius-xl: calc(var(--radius) + 4px);");
  });
});
