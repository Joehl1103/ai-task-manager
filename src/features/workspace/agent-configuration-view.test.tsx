import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AgentConfigurationView } from "./agent-configuration-view";

describe("agent configuration view", () => {
  /**
   * Keeps workspace theme and provider controls tucked into a clickable configuration list.
   */
  it("renders collapsible configuration sections for theme and agent settings", () => {
    const markup = renderToStaticMarkup(
      <AgentConfigurationView
        activeProvider="openai"
        activeProviderLabel="OpenAI"
        activeProviderSettings={{
          apiKey: "",
          model: "gpt-5.1",
          savedKeys: [],
          activeKeyId: null,
        }}
        fetchingModelsKeyId={null}
        isActiveProviderReady={false}
        isFetchingModels={false}
        modelErrorKeyId={null}
        modelFetchError={null}
        onDeleteSavedKey={vi.fn()}
        onFetchModels={vi.fn()}
        onSaveApiKey={vi.fn()}
        onSavedKeyModelChange={vi.fn()}
        onSetActiveKey={vi.fn()}
        onUpdateSavedKey={vi.fn()}
        onThemeSelectionChange={vi.fn()}
        themeSelection={{
          themeId: "relay-original",
          mode: "day",
        }}
      />,
    );

    expect(markup).toContain("Configuration sections");
    expect(markup).toContain("Workspace theme");
    expect(markup).toContain("Agent settings");
    expect(markup).toContain('class="configuration-disclosure-status">Relay Original / Day</p>');
    expect(markup).toContain('class="configuration-disclosure-status">API key needed</p>');
    expect(markup).toContain("configuration-disclosure-meta");
    expect(markup).not.toContain("lucide-check");
    expect(markup.match(/<details/g)).toHaveLength(2);
    expect(markup).not.toContain("<details open");
    expect(markup).not.toContain("Separate workspace view");
    expect(markup).not.toContain("How this connects to the workspace");
    expect(markup).not.toContain(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]">Relay Original / Day</div>',
    );
    expect(markup.match(/aria-label="[^"]+ day theme"/g)).toHaveLength(6);
    expect(markup.match(/aria-label="[^"]+ night theme"/g)).toHaveLength(6);
  });

  /**
   * Keeps the saved-key list explicit, with edit and add actions separated so the entry points are
   * easy to understand at a glance.
   */
  it("renders saved keys with explicit edit controls and a separate add-key button", () => {
    const markup = renderToStaticMarkup(
      <AgentConfigurationView
        activeProvider="openai"
        activeProviderLabel="OpenAI"
        activeProviderSettings={{
          apiKey: "sk-work-12345678",
          model: "gpt-5",
          savedKeys: [
            {
              id: "work",
              label: "Work",
              apiKey: "sk-work-12345678",
              model: "gpt-5",
              availableModels: ["gpt-5", "gpt-5-mini"],
            },
            {
              id: "personal",
              label: "Personal",
              apiKey: "sk-pers-87654321",
              model: "gpt-5-mini",
              availableModels: [],
            },
          ],
          activeKeyId: "work",
        }}
        fetchingModelsKeyId={null}
        isActiveProviderReady={true}
        isFetchingModels={false}
        modelErrorKeyId={null}
        modelFetchError={null}
        onDeleteSavedKey={vi.fn()}
        onFetchModels={vi.fn()}
        onSaveApiKey={vi.fn()}
        onSavedKeyModelChange={vi.fn()}
        onSetActiveKey={vi.fn()}
        onUpdateSavedKey={vi.fn()}
        onThemeSelectionChange={vi.fn()}
        themeSelection={{
          themeId: "relay-original",
          mode: "day",
        }}
      />,
    );

    expect(markup).toContain("Active key");
    expect(markup).toContain("Set key active");
    expect(markup).toContain("Edit key");
    expect(markup).toContain("Refresh models for Work");
    expect(markup).toContain("Fetch models");
    expect(markup).toContain("Add API key");
    expect(markup).toContain(
      'class="configuration-disclosure-status flex items-center justify-end gap-1"',
    );
    expect(markup).toContain("lucide-check");
    expect(markup).toContain(">Live provider ready</span>");
    expect(markup).toContain("Only one saved OpenAI key can be active at a time.");
    expect(markup).toContain("gpt-5-mini");
    expect(markup).toContain("Saved OpenAI keys");
    expect(markup).toContain("space-y-1.5");
    expect(markup).toContain("md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]");
    expect(markup).toContain("md:w-56 md:flex-none");
    expect(markup).not.toContain("Save this key");
    expect(markup).not.toContain("lg:grid-cols-[minmax(0,1fr)_minmax(15rem,1.2fr)_auto]");
  });
});
