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
        }}
        isActiveProviderReady={false}
        onProviderApiKeyChange={vi.fn()}
        onProviderModelChange={vi.fn()}
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
    expect(markup).toContain("Relay Original / Day");
    expect(markup.match(/<details/g)).toHaveLength(2);
    expect(markup).not.toContain("<details open");
    expect(markup).not.toContain("Separate workspace view");
    expect(markup).not.toContain("How this connects to the workspace");
    expect(markup.match(/aria-label="[^"]+ day theme"/g)).toHaveLength(6);
    expect(markup.match(/aria-label="[^"]+ night theme"/g)).toHaveLength(6);
  });
});
