import { type AgentConfigState, type ProviderId } from "./types";

export const agentConfigStorageKey = "relay-agent-config";

export const providerCatalog: Record<
  ProviderId,
  {
    label: string;
    defaultModel: string;
    apiKeyPlaceholder: string;
  }
> = {
  anthropic: {
    label: "Anthropic",
    defaultModel: "claude-sonnet-4-0",
    apiKeyPlaceholder: "sk-ant-api03-...",
  },
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-5",
    apiKeyPlaceholder: "sk-proj-...",
  },
  google: {
    label: "Google",
    defaultModel: "gemini-2.5-flash",
    apiKeyPlaceholder: "AIza...",
  },
};

/**
 * Builds the default provider state used for first load and invalid saved data.
 */
export function createDefaultAgentConfig(): AgentConfigState {
  return {
    activeProvider: "openai",
    providers: {
      anthropic: {
        apiKey: "",
        model: providerCatalog.anthropic.defaultModel,
      },
      openai: {
        apiKey: "",
        model: providerCatalog.openai.defaultModel,
      },
      google: {
        apiKey: "",
        model: providerCatalog.google.defaultModel,
      },
    },
  };
}

/**
 * Normalizes stored configuration so corrupt local data does not break the UI.
 */
export function normalizeAgentConfig(value: unknown): AgentConfigState {
  const defaults = createDefaultAgentConfig();

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Record<string, unknown>;
  const providers =
    candidate.providers && typeof candidate.providers === "object"
      ? (candidate.providers as Record<string, unknown>)
      : {};

  return {
    activeProvider: "openai",
    providers: {
      anthropic: normalizeProviderEntry(providers.anthropic, "anthropic"),
      openai: normalizeProviderEntry(providers.openai, "openai"),
      google: normalizeProviderEntry(providers.google, "google"),
    },
  };
}

/**
 * Returns a human label for display in the configuration and task UI.
 */
export function getProviderLabel(providerId: ProviderId) {
  return providerCatalog[providerId].label;
}

/**
 * Checks whether an arbitrary value is one of the supported provider ids.
 */
export function isProviderId(value: unknown): value is ProviderId {
  return value === "anthropic" || value === "openai" || value === "google";
}

/**
 * Applies defaults for a single provider entry when loading saved config.
 */
function normalizeProviderEntry(value: unknown, providerId: ProviderId) {
  const defaults = createDefaultAgentConfig().providers[providerId];

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Record<string, unknown>;

  return {
    apiKey: typeof candidate.apiKey === "string" ? candidate.apiKey : defaults.apiKey,
    model:
      typeof candidate.model === "string" && candidate.model.trim()
        ? candidate.model
        : defaults.model,
  };
}
