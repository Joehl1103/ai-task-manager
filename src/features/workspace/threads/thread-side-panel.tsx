"use client";

import { useEffect } from "react";

import { type AgentThread, type ThreadDraft } from "@/features/workspace/core";

import { AgentThreadPanel } from "./agent-thread-panel";

interface ThreadSidePanelProps {
  activeProviderLabel: string;
  activeProviderModel: string;
  draft: ThreadDraft;
  isPending: boolean;
  onClose: () => void;
  onDeleteMessage: (messageId: string) => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  ownerName: string;
  thread: AgentThread;
}

/**
 * Right-edge push panel that wraps the existing AgentThreadPanel with a header
 * showing the owner name and an Escape-to-close listener.
 */
export function ThreadSidePanel({
  activeProviderLabel,
  activeProviderModel,
  draft,
  isPending,
  onClose,
  onDeleteMessage,
  onDraftChange,
  onSend,
  ownerName,
  thread,
}: ThreadSidePanelProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <aside className="flex h-full w-80 min-w-80 flex-col border-l border-[color:var(--row-divider)] bg-[color:var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[color:var(--row-divider)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-[color:var(--muted)]">Thread</p>
          <p className="truncate text-sm text-[color:var(--foreground)]">{ownerName}</p>
        </div>
        <button
          aria-label="Close thread panel"
          className="text-xs text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          onClick={onClose}
          type="button"
        >
          Esc ✕
        </button>
      </div>

      {/* Thread content */}
      <div className="flex-1 overflow-y-auto px-4">
        <AgentThreadPanel
          activeProviderLabel={activeProviderLabel}
          activeProviderModel={activeProviderModel}
          composerPlaceholder={`Message ${ownerName}...`}
          draft={draft}
          isPending={isPending}
          onDeleteMessage={onDeleteMessage}
          onDraftChange={onDraftChange}
          onSend={onSend}
          thread={thread}
        />
      </div>
    </aside>
  );
}
