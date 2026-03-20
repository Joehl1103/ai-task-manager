"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  fetchingModelsKeyId: string | null;
  isActiveProviderReady: boolean;
  isFetchingModels: boolean;
  modelErrorKeyId: string | null;
  modelFetchError: string | null;
  onDeleteSavedKey: (providerId: ProviderId, keyId: string) => void;
  onFetchModels: (providerId: ProviderId, keyId: string) => void;
  onSaveApiKey: (providerId: ProviderId, label: string, apiKey: string) => void;
  onSavedKeyModelChange: (providerId: ProviderId, keyId: string, model: string) => void;
  onSetActiveKey: (providerId: ProviderId, keyId: string) => void;
  onUpdateSavedKey: (providerId: ProviderId, keyId: string, label: string, apiKey: string) => void;
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
  fetchingModelsKeyId,
  isActiveProviderReady,
  isFetchingModels,
  modelErrorKeyId,
  modelFetchError,
  onDeleteSavedKey,
  onFetchModels,
  onSaveApiKey,
  onSavedKeyModelChange,
  onSetActiveKey,
  onUpdateSavedKey,
  onThemeSelectionChange,
  themeSelection,
}: AgentConfigurationViewProps) {
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

              <div className="space-y-4 border-t border-[color:var(--border)] px-4 py-4">
                <ApiKeyManager
                  activeKeyId={activeProviderSettings.activeKeyId}
                  activeProvider={activeProvider}
                  activeProviderLabel={activeProviderLabel}
                  apiKey={activeProviderSettings.apiKey}
                  fetchingModelsKeyId={fetchingModelsKeyId}
                  isFetchingModels={isFetchingModels}
                  modelErrorKeyId={modelErrorKeyId}
                  modelFetchError={modelFetchError}
                  onDeleteSavedKey={onDeleteSavedKey}
                  onFetchModels={onFetchModels}
                  onSaveApiKey={onSaveApiKey}
                  onSavedKeyModelChange={onSavedKeyModelChange}
                  onSetActiveKey={onSetActiveKey}
                  onUpdateSavedKey={onUpdateSavedKey}
                  savedKeys={activeProviderSettings.savedKeys}
                />

                <p className="text-xs leading-5 text-[color:var(--muted)]">
                  Only one saved {activeProviderLabel} key can be active at a time. Each saved key
                  keeps its own selected model and fetched model list in this browser&apos;s local
                  storage.
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
  fetchingModelsKeyId: string | null;
  isFetchingModels: boolean;
  modelErrorKeyId: string | null;
  modelFetchError: string | null;
  onDeleteSavedKey: (providerId: ProviderId, keyId: string) => void;
  onFetchModels: (providerId: ProviderId, keyId: string) => void;
  onSaveApiKey: (providerId: ProviderId, label: string, apiKey: string) => void;
  onSavedKeyModelChange: (providerId: ProviderId, keyId: string, model: string) => void;
  onSetActiveKey: (providerId: ProviderId, keyId: string) => void;
  onUpdateSavedKey: (providerId: ProviderId, keyId: string, label: string, apiKey: string) => void;
  savedKeys: SavedApiKey[];
}

/**
 * Manages saving, activating, deleting, and configuring named API keys for one provider.
 */
function ApiKeyManager({
  activeKeyId,
  activeProvider,
  activeProviderLabel,
  apiKey,
  fetchingModelsKeyId,
  isFetchingModels,
  modelErrorKeyId,
  modelFetchError,
  onDeleteSavedKey,
  onFetchModels,
  onSaveApiKey,
  onSavedKeyModelChange,
  onSetActiveKey,
  onUpdateSavedKey,
  savedKeys,
}: ApiKeyManagerProps) {
  const [editorMode, setEditorMode] = useState<"add" | "edit" | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftKeyValue, setDraftKeyValue] = useState("");
  const [editorError, setEditorError] = useState<string | null>(null);

  const hasSavedKeys = savedKeys.length > 0;

  /**
   * Opens the add-key form and preloads the unsaved raw key when no saved entries exist yet.
   */
  function handleStartAdd() {
    setEditorMode("add");
    setEditingKeyId(null);
    setDraftLabel("");
    setDraftKeyValue(hasSavedKeys ? "" : apiKey);
    setEditorError(null);
  }

  /**
   * Opens the editor for one saved key so the label or raw key can be changed explicitly.
   */
  function handleStartEdit(savedKey: SavedApiKey) {
    setEditorMode("edit");
    setEditingKeyId(savedKey.id);
    setDraftLabel(savedKey.label);
    setDraftKeyValue(savedKey.apiKey);
    setEditorError(null);
  }

  /**
   * Validates and submits either a new saved key or edits to an existing one.
   */
  function handleSubmitEditor() {
    const trimmedLabel = draftLabel.trim();
    const trimmedKey = draftKeyValue.trim();

    if (!trimmedLabel) {
      setEditorError("Give this key a name (e.g. \"Personal\", \"Work\").");
      return;
    }

    if (!trimmedKey) {
      setEditorError("Paste an API key before saving.");
      return;
    }

    const labelConflict = savedKeys.some(
      (savedKey) =>
        savedKey.id !== editingKeyId && savedKey.label.toLowerCase() === trimmedLabel.toLowerCase(),
    );

    if (labelConflict) {
      setEditorError(`A key named "${trimmedLabel}" already exists.`);
      return;
    }

    if (editorMode === "edit" && editingKeyId) {
      onUpdateSavedKey(activeProvider, editingKeyId, trimmedLabel, trimmedKey);
    } else {
      onSaveApiKey(activeProvider, trimmedLabel, trimmedKey);
    }

    handleCloseEditor();
  }

  /**
   * Closes the add/edit panel and clears its transient field state.
   */
  function handleCloseEditor() {
    setEditorMode(null);
    setEditingKeyId(null);
    setDraftLabel("");
    setDraftKeyValue("");
    setEditorError(null);
  }

  return (
    <div className="space-y-3">
      {hasSavedKeys ? (
        <div className="grid gap-2 text-sm">
          <span className="text-[color:var(--muted)]">Saved {activeProviderLabel} keys</span>
          <div className="space-y-1.5">
            {savedKeys.map((savedKey) => {
              const isActive = savedKey.id === activeKeyId;
              const isFetchingThisKey = fetchingModelsKeyId === savedKey.id;
              const availableModels =
                savedKey.availableModels.length > 0 ? savedKey.availableModels : [savedKey.model];
              const hasFetchedModels = savedKey.availableModels.length > 0;
              const showsFetchError =
                modelErrorKeyId === savedKey.id && Boolean(modelFetchError);

              return (
                <div
                  className={`rounded-md border px-3 py-2 transition-colors ${
                    isActive
                      ? "border-[color:var(--border-strong)] bg-[color:var(--surface)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface-strong)]"
                  }`}
                  key={savedKey.id}
                >
                  <div className="grid gap-3 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-[color:var(--foreground)]">
                          {savedKey.label}
                        </p>
                        {isActive ? <Badge variant="accent">Active key</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                        {maskApiKey(savedKey.apiKey)}
                      </p>
                    </div>

                    <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center">
                      <Select
                        className="min-w-0 md:w-56 md:flex-none"
                        onChange={(event) =>
                          onSavedKeyModelChange(activeProvider, savedKey.id, event.target.value)
                        }
                        value={savedKey.model}
                      >
                        {availableModels.map((modelId) => (
                          <option key={modelId} value={modelId}>
                            {modelId}
                          </option>
                        ))}
                      </Select>

                      {hasFetchedModels ? (
                        <Button
                          aria-label={`Refresh models for ${savedKey.label}`}
                          className="shrink-0"
                          disabled={isFetchingModels}
                          onClick={() => onFetchModels(activeProvider, savedKey.id)}
                          size="icon"
                          title={`Refresh models for ${savedKey.label}`}
                          variant="outline"
                        >
                          {isFetchingThisKey ? (
                            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                          ) : (
                            <RefreshCw aria-hidden="true" className="size-3.5" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          className="shrink-0"
                          disabled={isFetchingModels}
                          onClick={() => onFetchModels(activeProvider, savedKey.id)}
                          size="sm"
                          variant="outline"
                        >
                          {isFetchingThisKey ? (
                            <>
                              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                              Fetching...
                            </>
                          ) : (
                            "Fetch models"
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      {!isActive ? (
                        <Button
                          onClick={() => onSetActiveKey(activeProvider, savedKey.id)}
                          size="sm"
                          variant="outline"
                        >
                          Set key active
                        </Button>
                      ) : null}

                      <Button
                        onClick={() => handleStartEdit(savedKey)}
                        size="sm"
                        variant="outline"
                      >
                        <Pencil aria-hidden="true" className="size-3.5" />
                        Edit key
                      </Button>

                      <Button
                        aria-label={`Delete key ${savedKey.label}`}
                        onClick={() => onDeleteSavedKey(activeProvider, savedKey.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {showsFetchError ? (
                    <p className="mt-2 text-xs text-red-500">{modelFetchError}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {editorMode ? (
        <div className="space-y-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
          <p className="text-sm font-medium text-[color:var(--foreground)]">
            {editorMode === "edit" ? "Edit API key" : "Add API key"}
          </p>
          <label className="grid gap-1 text-sm">
            <span className="text-[color:var(--muted)]">Key name</span>
            <Input
              onChange={(event) => {
                setDraftLabel(event.target.value);
                setEditorError(null);
              }}
              placeholder="e.g. Personal, Work, Project"
              value={draftLabel}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-[color:var(--muted)]">API key</span>
            <Input
              onChange={(event) => {
                setDraftKeyValue(event.target.value);
                setEditorError(null);
              }}
              placeholder={providerCatalog[activeProvider].apiKeyPlaceholder}
              type="password"
              value={draftKeyValue}
            />
          </label>
          {editorError ? <p className="text-xs text-red-500">{editorError}</p> : null}
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleSubmitEditor} size="sm">
              {editorMode === "edit" ? "Save changes" : "Add API key"}
            </Button>
            <Button onClick={handleCloseEditor} size="sm" variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          {!hasSavedKeys && apiKey ? (
            <p className="text-xs text-[color:var(--muted)]">
              Unsaved key detected. Use &quot;Add API key&quot; to store it with a name.
            </p>
          ) : null}

          <Button className="self-end" onClick={handleStartAdd} variant="subtle">
            <Plus aria-hidden="true" className="size-3.5" />
            Add API key
          </Button>
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
