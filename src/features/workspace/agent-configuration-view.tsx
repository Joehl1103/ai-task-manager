"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { providerCatalog } from "@/features/workspace/provider-config";
import { type ProviderId, type ProviderSettings } from "@/features/workspace/types";

interface AgentConfigurationViewProps {
  activeProvider: ProviderId;
  activeProviderLabel: string;
  activeProviderSettings: ProviderSettings;
  isActiveProviderReady: boolean;
  onProviderApiKeyChange: (providerId: ProviderId, apiKey: string) => void;
  onProviderModelChange: (providerId: ProviderId, model: string) => void;
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
}: AgentConfigurationViewProps) {
  return (
    <>
      <header className="border-b border-[color:var(--border)] pb-6">
        <p className="text-sm text-[color:var(--muted)]">Separate workspace view</p>
        <h1 className="mt-2 text-3xl font-semibold">Configuration</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          Keep provider setup away from task editing. Values saved here stay in this
          browser and power live task, project, and initiative threads when you
          return to the workspace views.
        </p>
      </header>

      <section className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium">Agent settings</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              OpenAI compatibility is wired first here. Add an OpenAI API key and
              adjust the model used for live thread replies.
            </p>
          </div>
          <Badge variant={isActiveProviderReady ? "success" : "warning"}>
            {isActiveProviderReady ? "Live provider ready" : "API key needed"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
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
      </section>

      <section className="mt-4 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
        <p className="text-sm font-medium">How this connects to the workspace</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          After updating these values, switch back to Tasks, Projects, or
          Initiatives from the top menu. Editing stays in those views, while live
          thread replies reuse the configuration saved here.
        </p>
      </section>
    </>
  );
}
