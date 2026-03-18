import { NextResponse } from "next/server";

import { isProviderId } from "@/features/workspace/provider-config";
import { callProviderAgent } from "@/features/workspace/provider-api";
import { type AgentThreadMessage, type ThreadOwnerType } from "@/features/workspace/types";

/**
 * Accepts an entity-scoped thread request and forwards it to the selected provider.
 */
export async function POST(request: Request) {
  const payload = await readRequestPayload(request);

  if (!payload) {
    return NextResponse.json({ error: "Send a valid JSON request body." }, { status: 400 });
  }

  if (!isProviderId(payload.providerId)) {
    return NextResponse.json(
      { error: "Choose Anthropic, OpenAI, or Google before calling the agent." },
      { status: 400 },
    );
  }

  if (payload.providerId !== "openai") {
    return NextResponse.json(
      { error: "OpenAI compatibility is enabled first. Use the OpenAI agent settings for now." },
      { status: 400 },
    );
  }

  if (!payload.entityName.trim()) {
    return NextResponse.json(
      { error: "Each thread request needs an entity name." },
      { status: 400 },
    );
  }

  if (payload.messages.length === 0) {
    return NextResponse.json(
      { error: "Add a message before calling the agent." },
      { status: 400 },
    );
  }

  try {
    const result = await callProviderAgent({
      providerId: payload.providerId,
      apiKey: payload.apiKey,
      model: payload.model,
      ownerType: payload.ownerType,
      entityName: payload.entityName,
      entityContext: payload.entityContext,
      messages: payload.messages,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "The provider request failed unexpectedly.",
      },
      { status: 502 },
    );
  }
}

/**
 * Reads and normalizes the POST body so the route can stay focused on provider work.
 */
async function readRequestPayload(request: Request) {
  try {
    const candidate = (await request.json()) as Record<string, unknown>;

    return {
      providerId: candidate.providerId,
      apiKey: readString(candidate.apiKey),
      model: readString(candidate.model),
      ownerType: readOwnerType(candidate.ownerType),
      entityName: readString(candidate.entityName),
      entityContext: readString(candidate.entityContext),
      messages: readMessages(candidate.messages),
    };
  } catch {
    return null;
  }
}

/**
 * Converts unknown request values to strings so missing properties fall back cleanly.
 */
function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

/**
 * Guards owner types to the three entity scopes the app currently supports.
 */
function readOwnerType(value: unknown): ThreadOwnerType {
  return value === "project" || value === "initiative" ? value : "task";
}

/**
 * Reads a list of thread messages from the request body with light validation.
 */
function readMessages(value: unknown): AgentThreadMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((message, index) => {
    if (!message || typeof message !== "object") {
      return [];
    }

    const candidate = message as Record<string, unknown>;
    const role = candidate.role === "agent" ? "agent" : "human";
    const content = readString(candidate.content);

    if (!content.trim()) {
      return [];
    }

    const normalizedMessage: AgentThreadMessage = {
      id: readString(candidate.id) || `message-${index + 1}`,
      role,
      content,
      createdAt: readString(candidate.createdAt),
    };

    if (role === "agent" && isProviderId(candidate.providerId)) {
      normalizedMessage.providerId = candidate.providerId;
    }

    if (typeof candidate.model === "string" && candidate.model.trim()) {
      normalizedMessage.model = candidate.model.trim();
    }

    if (candidate.status === "done" || candidate.status === "error") {
      normalizedMessage.status = candidate.status;
    }

    return [normalizedMessage];
  });
}
