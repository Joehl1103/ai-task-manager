import { describe, expect, it } from "vitest";

import {
  createDefaultAgentConfig,
  normalizeAgentConfig,
  providerCatalog,
} from "@/features/workspace/providers";

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

  /**
   * Ensures saved keys keep their own model state and always resolve to a single active key.
   */
  it("normalizes saved keys with key-level models and a fallback active key", () => {
    const config = normalizeAgentConfig({
      providers: {
        openai: {
          apiKey: "sk-raw-should-not-win",
          model: "raw-model-should-not-win",
          activeKeyId: "missing-key",
          savedKeys: [
            {
              id: "work",
              label: "Work",
              apiKey: "sk-work-1234",
              model: "gpt-5",
              availableModels: ["gpt-5", "gpt-5-mini"],
            },
            {
              id: "personal",
              label: "Personal",
              apiKey: "sk-personal-5678",
              availableModels: ["gpt-4o"],
            },
          ],
        },
      },
    });

    expect(config.providers.openai.activeKeyId).toBe("work");
    expect(config.providers.openai.apiKey).toBe("sk-work-1234");
    expect(config.providers.openai.model).toBe("gpt-5");
    expect(config.providers.openai.savedKeys[0].availableModels).toEqual([
      "gpt-5",
      "gpt-5-mini",
    ]);
    expect(config.providers.openai.savedKeys[1].model).toBe(providerCatalog.openai.defaultModel);
    expect(config.providers.openai.savedKeys[1].availableModels).toEqual([
      providerCatalog.openai.defaultModel,
      "gpt-4o",
    ]);
  });
});
