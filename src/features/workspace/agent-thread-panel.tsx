"use client";

import { Bot, Send, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormattedAgentResponse } from "@/features/workspace/formatted-agent-response";
import { getProviderLabel } from "@/features/workspace/provider-config";

import { type AgentThread, type ThreadDraft } from "./types";

interface AgentThreadPanelProps {
  thread: AgentThread;
  draft: ThreadDraft;
  isPending: boolean;
  activeProviderLabel: string;
  activeProviderModel: string;
  composerPlaceholder: string;
  emptyStateLabel?: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onDeleteMessage: (messageId: string) => void;
}

/**
 * Renders one owner-scoped conversation thread plus the composer used to continue it.
 */
export function AgentThreadPanel({
  thread,
  draft,
  isPending,
  activeProviderLabel,
  activeProviderModel,
  composerPlaceholder,
  emptyStateLabel = "No messages yet.",
  onDraftChange,
  onSend,
  onDeleteMessage,
}: AgentThreadPanelProps) {
  return (
    <section className="space-y-3 border-t border-[color:var(--row-divider)] pt-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
        {readThreadActivityLabel(thread.messages.length)}
      </p>

      {thread.messages.length > 0 ? (
        <div className="space-y-3">
          {thread.messages.map((message) => (
            <ThreadMessageRow
              key={message.id}
              message={message}
              onDelete={() => onDeleteMessage(message.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[color:var(--muted)]">{emptyStateLabel}</p>
      )}

      <div className="space-y-3">
        <p className="text-sm text-[color:var(--muted)]">
          Using {activeProviderLabel} · {activeProviderModel}
        </p>

        <Textarea
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={composerPlaceholder}
          value={draft.message}
        />

        {draft.error ? <p className="text-sm text-rose-700">{draft.error}</p> : null}

        <div className="flex justify-end">
          <Button disabled={isPending} onClick={onSend} size="sm">
            <Send className="size-4" />
            {isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </section>
  );
}

interface ThreadMessageRowProps {
  message: AgentThread["messages"][number];
  onDelete: () => void;
}

/**
 * Keeps one thread message readable while visually separating human and agent turns.
 */
function ThreadMessageRow({ message, onDelete }: ThreadMessageRowProps) {
  const isAgentMessage = message.role === "agent";
  const providerLabel = isAgentMessage && message.providerId ? getProviderLabel(message.providerId) : null;

  return (
    <div
      className={
        isAgentMessage
          ? "rounded-md border border-[color:var(--row-divider)] bg-[color:var(--surface)] p-3"
          : "rounded-md border border-[color:var(--row-divider)] bg-[color:var(--background)] p-3"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            {isAgentMessage ? <Bot className="size-4" /> : <User className="size-4" />}
            {isAgentMessage ? "Agent" : "You"}
            {providerLabel ? <span className="font-normal text-[color:var(--muted)]">{providerLabel}</span> : null}
            {isAgentMessage && message.status ? (
              <span className="font-normal text-[color:var(--muted)]">· {message.status}</span>
            ) : null}
          </p>
          <p className="text-xs text-[color:var(--muted)]">{message.createdAt}</p>

          {isAgentMessage ? (
            <FormattedAgentResponse className="mt-2" content={message.content} />
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--foreground)]">
              {message.content}
            </p>
          )}
        </div>

        <Button aria-label="Delete message" onClick={onDelete} size="sm" variant="ghost">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

/**
 * Reads a compact label for thread activity counts.
 */
function readThreadActivityLabel(messageCount: number) {
  if (messageCount === 0) {
    return "No messages";
  }

  return messageCount === 1 ? "1 message" : `${messageCount} messages`;
}
