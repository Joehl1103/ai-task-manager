"use client";

import { Bot, Send, Trash2, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { type AgentThread, type ThreadDraft } from "@/features/workspace/core";
import { getProviderLabel } from "@/features/workspace/providers";

import { FormattedAgentResponse } from "./formatted-agent-response";

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
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{readThreadActivityLabel(thread.messages.length)}</Badge>
        <p className="text-sm text-[color:var(--muted)]">
          Keep agent context nearby without adding another bespoke panel.
        </p>
      </div>

      {thread.messages.length > 0 ? (
        <div className="space-y-3">
          {thread.messages.map((message) => (
            <ThreadMessageCard
              key={message.id}
              message={message}
              onDelete={() => onDeleteMessage(message.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-24 items-center justify-center px-6 py-6 text-center text-sm text-[color:var(--muted)]">
            {emptyStateLabel}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Continue thread</CardTitle>
          <CardDescription>
            {`Using ${activeProviderLabel} · ${activeProviderModel}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Textarea
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={composerPlaceholder}
            value={draft.message}
          />

          {draft.error ? <p className="text-sm text-rose-700">{draft.error}</p> : null}
        </CardContent>

        <CardFooter className="justify-end">
          <Button disabled={isPending} onClick={onSend} size="sm">
            <Send className="size-4" />
            {isPending ? "Sending..." : "Send"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface ThreadMessageCardProps {
  message: AgentThread["messages"][number];
  onDelete: () => void;
}

/**
 * Keeps one thread message readable while moving the visual structure onto shared card sections.
 */
function ThreadMessageCard({ message, onDelete }: ThreadMessageCardProps) {
  const isAgentMessage = message.role === "agent";
  const providerLabel = isAgentMessage && message.providerId ? getProviderLabel(message.providerId) : null;

  return (
    <Card className={isAgentMessage ? "bg-[color:var(--surface-muted)]" : "bg-[color:var(--background)]"}>
      <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            {isAgentMessage ? <Bot className="size-4" /> : <User className="size-4" />}
            {isAgentMessage ? "Agent" : "You"}
          </CardTitle>
          <CardDescription>{readThreadMessageMeta(message.createdAt, providerLabel, message.status)}</CardDescription>
        </div>

        <Button aria-label="Delete message" onClick={onDelete} size="sm" variant="ghost">
          <Trash2 className="size-4" />
          Delete
        </Button>
      </CardHeader>

      <CardContent>
        {isAgentMessage ? (
          <FormattedAgentResponse className="mt-0" content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-[color:var(--foreground)]">
            {message.content}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Reads the compact metadata line shown beneath each thread message title.
 */
function readThreadMessageMeta(
  createdAt: string,
  providerLabel: string | null,
  status?: AgentThread["messages"][number]["status"],
) {
  const details = [providerLabel, createdAt, status].filter(Boolean);

  return details.join(" · ");
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
