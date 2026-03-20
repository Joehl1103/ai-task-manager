import { NextResponse } from "next/server";

/**
 * Accepts the user's OpenAI API key via POST and returns a filtered, sorted list of
 * chat-capable model ids. The key never leaves the server request.
 */
export async function POST(request: Request) {
  const body = await readRequestBody(request);

  if (!body) {
    return NextResponse.json({ error: "Send a valid JSON body with an apiKey field." }, { status: 400 });
  }

  if (!body.apiKey.trim()) {
    return NextResponse.json({ error: "Provide an OpenAI API key to fetch available models." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        authorization: `Bearer ${body.apiKey.trim()}`,
      },
    });

    if (!response.ok) {
      const errorPayload = await readJsonSafely(response);
      const message = readOpenAIErrorMessage(errorPayload) ?? `OpenAI returned ${response.status}.`;

      return NextResponse.json({ error: message }, { status: response.status });
    }

    const payload = await readJsonSafely(response);
    const models = extractChatModelIds(payload);

    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch models from OpenAI.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * Reads and validates the POST body so the route handler stays focused on orchestration.
 */
async function readRequestBody(request: Request) {
  try {
    const candidate = (await request.json()) as Record<string, unknown>;

    return {
      apiKey: typeof candidate.apiKey === "string" ? candidate.apiKey : "",
    };
  } catch {
    return null;
  }
}

/**
 * Filters the OpenAI model list to only chat-capable models and sorts them with the most
 * commonly used families first.
 */
function extractChatModelIds(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    return [];
  }

  const excludedPrefixes = [
    "whisper",
    "tts",
    "dall-e",
    "text-embedding",
    "text-search",
    "text-similarity",
    "babbage",
    "davinci",
    "curie",
    "ada",
    "moderation",
    "text-moderation",
    "code-search",
    "code-cushman",
    "code-davinci",
    "cushman",
    "if-",
    "text-davinci",
    "text-curie",
    "text-babbage",
    "text-ada",
  ];

  const modelIds = payload.data
    .flatMap((entry: unknown) => {
      if (!isRecord(entry) || typeof entry.id !== "string") {
        return [];
      }

      const id = entry.id.trim().toLowerCase();

      if (!id) {
        return [];
      }

      if (excludedPrefixes.some((prefix) => id.startsWith(prefix))) {
        return [];
      }

      return [entry.id.trim()];
    })
    .sort(compareChatModelIds);

  return modelIds;
}

/**
 * Sorts models so gpt-5, gpt-4o, o-series, and chatgpt families appear before others.
 */
function compareChatModelIds(a: string, b: string): number {
  return getChatModelSortWeight(a) - getChatModelSortWeight(b) || a.localeCompare(b);
}

/**
 * Assigns a sort weight so popular model families float to the top of the picker.
 */
function getChatModelSortWeight(id: string): number {
  const lowered = id.toLowerCase();

  if (lowered.startsWith("gpt-5")) return 0;
  if (lowered.startsWith("gpt-4o")) return 1;
  if (lowered.startsWith("gpt-4.1")) return 2;
  if (lowered.startsWith("gpt-4")) return 3;
  if (lowered.startsWith("o4")) return 4;
  if (lowered.startsWith("o3")) return 5;
  if (lowered.startsWith("o1")) return 6;
  if (lowered.startsWith("chatgpt")) return 7;
  if (lowered.startsWith("gpt-3")) return 8;

  return 9;
}

/**
 * Reads a human-friendly error from OpenAI's standard error response shape.
 */
function readOpenAIErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message.trim() || null;
  }

  if (typeof payload.message === "string") {
    return payload.message.trim() || null;
  }

  return null;
}

/** Safely parses a fetch response as JSON. */
async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Narrows unknown values to plain objects. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
