import { type AgentConfigState, type ProviderId, type SavedApiKey } from "./types";

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
        savedKeys: [],
        activeKeyId: null,
      },
      openai: {
        apiKey: "",
        model: providerCatalog.openai.defaultModel,
        savedKeys: [],
        activeKeyId: null,
      },
      google: {
        apiKey: "",
        model: providerCatalog.google.defaultModel,
        savedKeys: [],
        activeKeyId: null,
      },
    },
  };
}

/**
 * Generates a short unique id for saved API key entries.
 */
export function createApiKeyId(): string {
  return `key-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
  const savedKeys = normalizeSavedKeys(candidate.savedKeys);
  const activeKeyId =
    typeof candidate.activeKeyId === "string" && savedKeys.some((k) => k.id === candidate.activeKeyId)
      ? candidate.activeKeyId
      : null;

  /* Resolve the effective API key: use the active saved key when set, fall back to the raw field. */
  const activeKey = activeKeyId ? savedKeys.find((k) => k.id === activeKeyId) : null;
  const rawApiKey = typeof candidate.apiKey === "string" ? candidate.apiKey : defaults.apiKey;

  return {
    apiKey: activeKey ? activeKey.apiKey : rawApiKey,
    model:
      typeof candidate.model === "string" && candidate.model.trim()
        ? candidate.model
        : defaults.model,
    savedKeys,
    activeKeyId,
  };
}

/**
 * Validates an array of saved API key entries from local storage.
 */
function normalizeSavedKeys(value: unknown): SavedApiKey[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const candidate = entry as Record<string, unknown>;

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.label !== "string" ||
      typeof candidate.apiKey !== "string" ||
      !candidate.id.trim() ||
      !candidate.label.trim() ||
      !candidate.apiKey.trim()
    ) {
      return [];
    }

    return [{ id: candidate.id, label: candidate.label, apiKey: candidate.apiKey }];
  });
}
