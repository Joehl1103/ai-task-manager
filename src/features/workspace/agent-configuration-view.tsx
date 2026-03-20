"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { providerCatalog } from "@/features/workspace/provider-config";
import {
  readWorkspaceThemeLabel,
  type WorkspaceThemeSelection,
} from "@/features/workspace/workspace-theme";
import { WorkspaceThemeSelector } from "@/features/workspace/workspace-theme-selector";
import { type ProviderId, type ProviderSettings, type SavedApiKey } from "@/features/workspace/types";

interface AgentConfigurationViewProps {
  activeProvider: ProviderId;
  activeProviderLabel: string;
  activeProviderSettings: ProviderSettings;
  availableModels: string[];
  isActiveProviderReady: boolean;
  isFetchingModels: boolean;
  modelFetchError: string | null;
  onDeleteSavedKey: (providerId: ProviderId, keyId: string) => void;
  onFetchModels: () => void;
  onProviderApiKeyChange: (providerId: ProviderId, apiKey: string) => void;
  onProviderModelChange: (providerId: ProviderId, model: string) => void;
  onSaveApiKey: (providerId: ProviderId, label: string, apiKey: string) => void;
  onSelectSavedKey: (providerId: ProviderId, keyId: string) => void;
  onThemeSelectionChange: (selection: WorkspaceThemeSelection) => void;
  themeSelection: WorkspaceThemeSelection;
}

/**
 * Keeps provider setup in its own view so task editing can stay visually separate.
 */
export function AgentConfigurationView({
  activeProvider,
  activeProviderLabel,
  activeProviderSettings,
  availableModels,
  isActiveProviderReady,
  isFetchingModels,
  modelFetchError,
  onDeleteSavedKey,
  onFetchModels,
  onProviderApiKeyChange,
  onProviderModelChange,
  onSaveApiKey,
  onSelectSavedKey,
  onThemeSelectionChange,
  themeSelection,
}: AgentConfigurationViewProps) {
  const hasModels = availableModels.length > 0;
  const hasApiKey = activeProviderSettings.apiKey.trim().length > 0;
  return (
    <>
      <header className="border-b border-[color:var(--border)] pb-6">
        <h1 className="text-3xl font-semibold">Configuration</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          Keep provider setup away from task editing. Values saved here stay in this
          browser and power live task, project, and initiative threads when you
          return to the workspace views.
        </p>
      </header>

      <section className="mt-6">
        <p className="text-sm font-medium">Configuration sections</p>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          Open only the settings you want to adjust. Theme and provider controls stay collapsed
          until you click into each section.
        </p>

        <ul className="mt-4 space-y-4">
          <li>
            <details className="configuration-disclosure rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
              <summary className="configuration-disclosure-summary flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
                <div>
                  <p className="text-sm font-medium">Workspace theme</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                    Choose between six paired day and night themes, including Relay Original.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="accent">{readWorkspaceThemeLabel(themeSelection)}</Badge>
                  <ChevronDown
                    aria-hidden="true"
                    className="configuration-disclosure-chevron size-4 shrink-0 text-[color:var(--muted)]"
                  />
                </div>
              </summary>

              <div className="border-t border-[color:var(--border)] px-4 py-4">
                <WorkspaceThemeSelector
                  onSelectTheme={onThemeSelectionChange}
                  selection={themeSelection}
                  showHeader={false}
                />
              </div>
            </details>
          </li>

          <li>
            <details className="configuration-disclosure rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
              <summary className="configuration-disclosure-summary flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
                <div>
                  <p className="text-sm font-medium">Agent settings</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                    Add your OpenAI API key and adjust the model used for live thread replies.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={isActiveProviderReady ? "success" : "warning"}>
                    {isActiveProviderReady ? "Live provider ready" : "API key needed"}
                  </Badge>
                  <ChevronDown
                    aria-hidden="true"
                    className="configuration-disclosure-chevron size-4 shrink-0 text-[color:var(--muted)]"
                  />
                </div>
              </summary>

              <div className="border-t border-[color:var(--border)] px-4 py-4 space-y-4">
                <ApiKeyManager
                  activeKeyId={activeProviderSettings.activeKeyId}
                  activeProvider={activeProvider}
                  activeProviderLabel={activeProviderLabel}
                  apiKey={activeProviderSettings.apiKey}
                  onApiKeyChange={onProviderApiKeyChange}
                  onDeleteSavedKey={onDeleteSavedKey}
                  onSaveApiKey={onSaveApiKey}
                  onSelectSavedKey={onSelectSavedKey}
                  savedKeys={activeProviderSettings.savedKeys}
                />

                <div className="grid gap-2 text-sm">
                  <span className="text-[color:var(--muted)]">{activeProviderLabel} model</span>

                  {hasModels ? (
                    <Select
                      onChange={(event) =>
                        onProviderModelChange(activeProvider, event.target.value)
                      }
                      value={activeProviderSettings.model}
                    >
                      {availableModels.map((modelId) => (
                        <option key={modelId} value={modelId}>
                          {modelId}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm text-[color:var(--foreground)] transition-all duration-150 hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!hasApiKey || isFetchingModels}
                        onClick={onFetchModels}
                        type="button"
                      >
                        {isFetchingModels ? (
                          <>
                            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          "Fetch models"
                        )}
                      </button>

                      <span className="text-xs text-[color:var(--muted)]">
                        {activeProviderSettings.model || providerCatalog[activeProvider].defaultModel}
                      </span>
                    </div>
                  )}

                  {modelFetchError ? (
                    <p className="text-xs text-red-500">{modelFetchError}</p>
                  ) : null}
                </div>

                <p className="text-xs leading-5 text-[color:var(--muted)]">
                  Your {activeProviderLabel} keys stay in this browser&apos;s local storage and are
                  only sent to the app when you trigger a live thread reply.
                </p>
              </div>
            </details>
          </li>
        </ul>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  API key manager                                                           */
/* -------------------------------------------------------------------------- */

interface ApiKeyManagerProps {
  activeKeyId: string | null;
  activeProvider: ProviderId;
  activeProviderLabel: string;
  apiKey: string;
  onApiKeyChange: (providerId: ProviderId, apiKey: string) => void;
  onDeleteSavedKey: (providerId: ProviderId, keyId: string) => void;
  onSaveApiKey: (providerId: ProviderId, label: string, apiKey: string) => void;
  onSelectSavedKey: (providerId: ProviderId, keyId: string) => void;
  savedKeys: SavedApiKey[];
}

/**
 * Manages saving, switching, and deleting named API keys for a single provider.
 */
function ApiKeyManager({
  activeKeyId,
  activeProvider,
  activeProviderLabel,
  apiKey,
  onApiKeyChange,
  onDeleteSavedKey,
  onSaveApiKey,
  onSelectSavedKey,
  savedKeys,
}: ApiKeyManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasSavedKeys = savedKeys.length > 0;

  /**
   * Validates and saves a new named key, then resets the form.
   */
  function handleSaveNewKey() {
    const trimmedLabel = newKeyLabel.trim();
    const trimmedKey = newKeyValue.trim();

    if (!trimmedLabel) {
      setSaveError("Give this key a name (e.g. \"Personal\", \"Work\").");
      return;
    }

    if (!trimmedKey) {
      setSaveError("Paste an API key before saving.");
      return;
    }

    if (savedKeys.some((k) => k.label.toLowerCase() === trimmedLabel.toLowerCase())) {
      setSaveError(`A key named "${trimmedLabel}" already exists.`);
      return;
    }

    onSaveApiKey(activeProvider, trimmedLabel, trimmedKey);
    setNewKeyLabel("");
    setNewKeyValue("");
    setSaveError(null);
    setIsAdding(false);
  }

  /**
   * Discards the in-progress add form.
   */
  function handleCancelAdd() {
    setNewKeyLabel("");
    setNewKeyValue("");
    setSaveError(null);
    setIsAdding(false);
  }

  return (
    <div className="space-y-3">
      {/* Saved key switcher */}
      {hasSavedKeys ? (
        <div className="grid gap-2 text-sm">
          <span className="text-[color:var(--muted)]">Saved {activeProviderLabel} keys</span>
          <div className="space-y-1.5">
            {savedKeys.map((savedKey) => {
              const isActive = savedKey.id === activeKeyId;

              return (
                <div
                  className="flex items-center gap-2"
                  key={savedKey.id}
                >
                  <button
                    aria-pressed={isActive}
                    className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-left text-sm transition-all duration-150 active:scale-[0.99] ${
                      isActive
                        ? "border-[color:var(--border-strong)] bg-[color:var(--surface)] font-medium text-[color:var(--foreground)] shadow-[0_4px_12px_-6px_var(--shadow-color)]"
                        : "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-strong)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface)]"
                    }`}
                    onClick={() => onSelectSavedKey(activeProvider, savedKey.id)}
                    type="button"
                  >
                    <span>{savedKey.label}</span>
                    <span className="ml-2 text-xs text-[color:var(--muted)]">
                      {maskApiKey(savedKey.apiKey)}
                    </span>
                    {isActive ? (
                      <Badge className="ml-2" variant="accent">Active</Badge>
                    ) : null}
                  </button>

                  <button
                    aria-label={`Delete key ${savedKey.label}`}
                    className="cursor-pointer rounded-md p-2 text-[color:var(--muted)] transition-all duration-150 hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)] active:scale-95"
                    onClick={() => onDeleteSavedKey(activeProvider, savedKey.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Add new key form */}
      {isAdding ? (
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 space-y-2">
          <label className="grid gap-1 text-sm">
            <span className="text-[color:var(--muted)]">Key name</span>
            <Input
              onChange={(event) => { setNewKeyLabel(event.target.value); setSaveError(null); }}
              placeholder="e.g. Personal, Work, Project"
              value={newKeyLabel}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-[color:var(--muted)]">API key</span>
            <Input
              onChange={(event) => { setNewKeyValue(event.target.value); setSaveError(null); }}
              placeholder={providerCatalog[activeProvider].apiKeyPlaceholder}
              type="password"
              value={newKeyValue}
            />
          </label>
          {saveError ? (
            <p className="text-xs text-red-500">{saveError}</p>
          ) : null}
          <div className="flex items-center gap-2 pt-1">
            <button
              className="cursor-pointer rounded-md border border-[color:var(--border-strong)] bg-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent-foreground)] transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              onClick={handleSaveNewKey}
              type="button"
            >
              Save key
            </button>
            <button
              className="cursor-pointer rounded-md px-3 py-1.5 text-sm text-[color:var(--muted)] transition-all duration-150 hover:text-[color:var(--foreground)] active:opacity-70"
              onClick={handleCancelAdd}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Quick key input for users who don't want to save */}
          {!hasSavedKeys ? (
            <label className="grid flex-1 gap-1 text-sm">
              <span className="text-[color:var(--muted)]">{activeProviderLabel} API key</span>
              <Input
                onChange={(event) => onApiKeyChange(activeProvider, event.target.value)}
                placeholder={providerCatalog[activeProvider].apiKeyPlaceholder}
                type="password"
                value={apiKey}
              />
            </label>
          ) : null}

          <button
            className="flex h-10 cursor-pointer items-center gap-1.5 self-end rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm text-[color:var(--foreground)] transition-all duration-150 hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface)] active:scale-[0.98]"
            onClick={() => setIsAdding(true)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            {hasSavedKeys ? "Add another key" : "Save this key"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Shows only the first and last few characters of an API key for identification.
 */
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return "****";
  }

  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
