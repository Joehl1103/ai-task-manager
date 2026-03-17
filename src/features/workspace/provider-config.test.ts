import { describe, expect, it } from "vitest";

import {
  createDefaultAgentConfig,
  normalizeAgentConfig,
  providerCatalog,
} from "./provider-config";

describe("provider config", () => {
  /**
   * Ensures all supported providers start with a known default model.
   */
  it("creates default config for all providers", () => {
    const config = createDefaultAgentConfig();

    expect(config.activeProvider).toBe("openai");
    expect(config.providers.anthropic.model).toBe(providerCatalog.anthropic.defaultModel);
    expect(config.providers.openai.model).toBe(providerCatalog.openai.defaultModel);
    expect(config.providers.google.model).toBe(providerCatalog.google.defaultModel);
  });

  /**
   * Prevents malformed local storage data from breaking the configuration panel.
   */
  it("normalizes incomplete saved config", () => {
    const config = normalizeAgentConfig({
      activeProvider: "google",
      providers: {
        google: {
          apiKey: "abc123",
        },
      },
    });

    expect(config.activeProvider).toBe("openai");
    expect(config.providers.google.apiKey).toBe("abc123");
    expect(config.providers.google.model).toBe(providerCatalog.google.defaultModel);
    expect(config.providers.openai.model).toBe(providerCatalog.openai.defaultModel);
  });
});
