import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AgentThreadPanel, createAgentThread } from "@/features/workspace/threads";

describe("agent thread panel", () => {
  /**
   * Uses a non-list thread container so only markdown content can introduce bullets.
   */
  it("renders only the markdown list instead of adding a second thread-level list", () => {
    const thread = {
      ...createAgentThread("task", "task-1"),
      messages: [
        {
          id: "message-1",
          role: "agent" as const,
          content: ["- **Option one**: Short explanation.", "- **Option two**: Another explanation."].join("\n"),
          createdAt: "Now",
          providerId: "openai" as const,
          model: "gpt-5",
          status: "done" as const,
        },
      ],
    };

    const markup = renderToStaticMarkup(
      <AgentThreadPanel
        activeProviderLabel="OpenAI"
        activeProviderModel="gpt-5"
        composerPlaceholder="Ask the agent for help"
        draft={{
          message: "",
          error: null,
        }}
        isPending={false}
        onDeleteMessage={vi.fn()}
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        thread={thread}
      />,
    );

    expect(markup.match(/<ul/g)).toHaveLength(1);
    expect(markup).toContain("<li><strong>Option one</strong>: Short explanation.</li>");
  });
});
