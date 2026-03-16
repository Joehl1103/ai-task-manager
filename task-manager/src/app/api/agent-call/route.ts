import { NextResponse } from "next/server";

import { isProviderId } from "@/features/workspace/provider-config";
import { callProviderAgent } from "@/features/workspace/provider-api";

/**
 * Accepts a task-scoped agent request and forwards it to the selected provider.
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

  if (!payload.taskTitle.trim()) {
    return NextResponse.json({ error: "Each agent call needs a task title." }, { status: 400 });
  }

  if (!payload.brief.trim()) {
    return NextResponse.json(
      { error: "Describe what the agent should do for this task." },
      { status: 400 },
    );
  }

  try {
    const result = await callProviderAgent({
      providerId: payload.providerId,
      apiKey: payload.apiKey,
      model: payload.model,
      taskTitle: payload.taskTitle,
      taskDetails: payload.taskDetails,
      brief: payload.brief,
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
      taskTitle: readString(candidate.taskTitle),
      taskDetails: readString(candidate.taskDetails),
      brief: readString(candidate.brief),
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
