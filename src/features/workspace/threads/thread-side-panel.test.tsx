import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { type AgentThread } from "@/features/workspace/core";

import { ThreadSidePanel } from "./thread-side-panel";

function buildThread(messageCount = 0): AgentThread {
  return {
    id: "thread-task-task-1",
    ownerType: "task",
    ownerId: "task-1",
    messages: Array.from({ length: messageCount }, (_, i) => ({
      id: `message-${i + 1}`,
      role: "human" as const,
      content: `Message ${i + 1}`,
      createdAt: "2026-04-01 12:00",
    })),
  };
}

describe("ThreadSidePanel", () => {
  it("renders the owner name in the panel header", () => {
    const markup = renderToStaticMarkup(
      <ThreadSidePanel
        activeProviderLabel="Claude"
        activeProviderModel="claude-3-opus"
        draft={{ message: "", error: null }}
        isPending={false}
        onClose={vi.fn()}
        onDeleteMessage={vi.fn()}
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        ownerName="Review auth middleware"
        thread={buildThread()}
      />,
    );

    expect(markup).toContain("Review auth middleware");
    expect(markup).toContain("Thread");
  });

  it("renders empty state when thread has no messages", () => {
    const markup = renderToStaticMarkup(
      <ThreadSidePanel
        activeProviderLabel="Claude"
        activeProviderModel="claude-3-opus"
        draft={{ message: "", error: null }}
        isPending={false}
        onClose={vi.fn()}
        onDeleteMessage={vi.fn()}
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        ownerName="My task"
        thread={buildThread(0)}
      />,
    );

    expect(markup).toContain("No messages yet.");
  });

  it("renders messages when thread has content", () => {
    const markup = renderToStaticMarkup(
      <ThreadSidePanel
        activeProviderLabel="OpenAI"
        activeProviderModel="gpt-4"
        draft={{ message: "", error: null }}
        isPending={false}
        onClose={vi.fn()}
        onDeleteMessage={vi.fn()}
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        ownerName="My task"
        thread={buildThread(2)}
      />,
    );

    expect(markup).toContain("Message 1");
    expect(markup).toContain("Message 2");
  });

  it("renders the composer with provider info", () => {
    const markup = renderToStaticMarkup(
      <ThreadSidePanel
        activeProviderLabel="Claude"
        activeProviderModel="claude-3-opus"
        draft={{ message: "", error: null }}
        isPending={false}
        onClose={vi.fn()}
        onDeleteMessage={vi.fn()}
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        ownerName="My task"
        thread={buildThread()}
      />,
    );

    expect(markup).toContain("Claude");
    expect(markup).toContain("claude-3-opus");
    expect(markup).toContain("Send");
  });
});
