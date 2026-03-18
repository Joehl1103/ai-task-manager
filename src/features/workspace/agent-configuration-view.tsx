"use client";

import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { providerCatalog } from "@/features/workspace/provider-config";
import {
  readWorkspaceThemeLabel,
  type WorkspaceThemeSelection,
} from "@/features/workspace/workspace-theme";
import { WorkspaceThemeSelector } from "@/features/workspace/workspace-theme-selector";
import { type ProviderId, type ProviderSettings } from "@/features/workspace/types";

interface AgentConfigurationViewProps {
  activeProvider: ProviderId;
  activeProviderLabel: string;
  activeProviderSettings: ProviderSettings;
  isActiveProviderReady: boolean;
  onProviderApiKeyChange: (providerId: ProviderId, apiKey: string) => void;
  onProviderModelChange: (providerId: ProviderId, model: string) => void;
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
  isActiveProviderReady,
  onProviderApiKeyChange,
  onProviderModelChange,
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

              <div className="border-t border-[color:var(--border)] px-4 py-4">
                <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
                  <label className="grid gap-2 text-sm">
                    <span className="text-[color:var(--muted)]">{activeProviderLabel} API key</span>
                    <Input
                      onChange={(event) =>
                        onProviderApiKeyChange(activeProvider, event.target.value)
                      }
                      placeholder={providerCatalog[activeProvider].apiKeyPlaceholder}
                      type="password"
                      value={activeProviderSettings.apiKey}
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="text-[color:var(--muted)]">{activeProviderLabel} model</span>
                    <Input
                      onChange={(event) => onProviderModelChange(activeProvider, event.target.value)}
                      placeholder={providerCatalog[activeProvider].defaultModel}
                      value={activeProviderSettings.model}
                    />
                  </label>
                </div>

                <p className="mt-3 text-xs leading-5 text-[color:var(--muted)]">
                  Your {activeProviderLabel} key stays in this browser&apos;s local storage and is
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
