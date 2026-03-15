import { type ProviderId } from "./types";

const agentSystemInstruction =
  "You are Relay's built-in task agent. Help the user make progress on the task in plain language, stay practical, and keep the answer concise.";

const defaultMaxTokens = 700;

export interface BuildAgentPromptInput {
  taskTitle: string;
  taskDetails: string;
  brief: string;
}

export interface CallProviderAgentInput extends BuildAgentPromptInput {
  providerId: ProviderId;
  apiKey: string;
  model: string;
}

export interface CallProviderAgentResult {
  result: string;
  model: string;
}

/**
 * Calls the selected provider with a shared task-focused prompt and returns plain text.
 */
export async function callProviderAgent(
  input: CallProviderAgentInput,
): Promise<CallProviderAgentResult> {
  const normalizedInput = normalizeProviderCallInput(input);
  const prompt = buildAgentPrompt(normalizedInput);

  if (normalizedInput.providerId === "anthropic") {
    return callAnthropicAgent(normalizedInput, prompt);
  }

  if (normalizedInput.providerId === "openai") {
    return callOpenAIAgent(normalizedInput, prompt);
  }

  return callGoogleAgent(normalizedInput, prompt);
}

/**
 * Builds one prompt shape so provider switching does not change the task context.
 */
export function buildAgentPrompt(input: BuildAgentPromptInput) {
  const normalizedTitle = input.taskTitle.trim();
  const normalizedDetails = input.taskDetails.trim();
  const normalizedBrief = input.brief.trim();

  return [
    `Task title: ${normalizedTitle || "Untitled task"}`,
    `Task details: ${normalizedDetails || "No extra details were provided."}`,
    `Agent request: ${normalizedBrief}`,
    "Return the most useful next-step help for this task.",
  ].join("\n");
}

/**
 * Flattens each provider's response into the text the UI should store on the task.
 */
export function extractProviderText(providerId: ProviderId, payload: unknown) {
  if (providerId === "anthropic") {
    return extractAnthropicText(payload);
  }

  if (providerId === "openai") {
    return extractOpenAIText(payload);
  }

  return extractGoogleText(payload);
}

/**
 * Pulls a readable provider error out of the nested JSON formats used by these APIs.
 */
export function readProviderErrorMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message.trim();
  }

  return null;
}

/**
 * Sends a task request to Anthropic's Messages API.
 */
async function callAnthropicAgent(
  input: NormalizedProviderCallInput,
  prompt: string,
): Promise<CallProviderAgentResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: defaultMaxTokens,
      system: agentSystemInstruction,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  const payload = await readProviderPayload(response);

  if (!response.ok) {
    throw new Error(
      readProviderErrorMessage(payload) ??
        `Anthropic returned an error (${response.status}).`,
    );
  }

  return {
    result: extractProviderText("anthropic", payload),
    model: input.model,
  };
}

/**
 * Sends a task request to OpenAI's Responses API.
 */
async function callOpenAIAgent(
  input: NormalizedProviderCallInput,
  prompt: string,
): Promise<CallProviderAgentResult> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify(buildOpenAIRequestBody(input.model, prompt)),
  });

  const payload = await readProviderPayload(response);

  if (!response.ok) {
    throw new Error(
      readProviderErrorMessage(payload) ?? `OpenAI returned an error (${response.status}).`,
    );
  }

  return {
    result: extractProviderText("openai", payload),
    model: input.model,
  };
}

/**
 * Sends a task request to Google's Gemini generateContent endpoint.
 */
async function callGoogleAgent(
  input: NormalizedProviderCallInput,
  prompt: string,
): Promise<CallProviderAgentResult> {
  const encodedModel = encodeURIComponent(input.model);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: agentSystemInstruction,
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    },
  );

  const payload = await readProviderPayload(response);

  if (!response.ok) {
    throw new Error(
      readProviderErrorMessage(payload) ?? `Google returned an error (${response.status}).`,
    );
  }

  return {
    result: extractProviderText("google", payload),
    model: input.model,
  };
}

/**
 * Reads a provider response body without assuming it always returns valid JSON.
 */
async function readProviderPayload(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      message: text,
    };
  }
}

/**
 * Validates and trims provider input before any network request is made.
 */
function normalizeProviderCallInput(input: CallProviderAgentInput) {
  const normalizedApiKey = input.apiKey.trim();
  const normalizedModel = input.model.trim();
  const normalizedBrief = input.brief.trim();

  if (!normalizedApiKey) {
    throw new Error("Add an API key for the selected provider before calling the agent.");
  }

  if (!normalizedModel) {
    throw new Error("Add a model for the selected provider before calling the agent.");
  }

  if (!normalizedBrief) {
    throw new Error("Describe what the agent should do for this task.");
  }

  return {
    ...input,
    apiKey: normalizedApiKey,
    model: normalizedModel,
    brief: normalizedBrief,
    taskTitle: input.taskTitle.trim(),
    taskDetails: input.taskDetails.trim(),
  };
}

/**
 * Extracts plain text from Anthropic's block-based message format.
 */
function extractAnthropicText(payload: unknown) {
  const contentBlocks = isRecord(payload) && Array.isArray(payload.content) ? payload.content : [];
  const text = contentBlocks
    .flatMap((block) =>
      isRecord(block) && block.type === "text" && typeof block.text === "string"
        ? [block.text.trim()]
        : [],
    )
    .filter(Boolean)
    .join("\n\n");

  if (!text) {
    throw new Error("Anthropic returned an empty response.");
  }

  return text;
}

/**
 * Extracts plain text from OpenAI's response output content array.
 */
function extractOpenAIText(payload: unknown) {
  const outputText =
    isRecord(payload) && typeof payload.output_text === "string" ? payload.output_text.trim() : "";

  if (outputText) {
    return outputText;
  }

  const outputEntries = isRecord(payload) && Array.isArray(payload.output) ? payload.output : [];
  const text = outputEntries
    .flatMap((entry) =>
      isRecord(entry) && Array.isArray(entry.content) ? entry.content : [],
    )
    .flatMap((contentItem) => readOpenAIContentText(contentItem))
    .filter(Boolean)
    .join("\n\n");

  if (!text) {
    throw new Error(buildOpenAIEmptyResponseMessage(payload));
  }

  return text;
}

/**
 * Builds the request body used for OpenAI's Responses API.
 */
function buildOpenAIRequestBody(model: string, prompt: string) {
  return {
    model,
    instructions: agentSystemInstruction,
    input: prompt,
    max_output_tokens: defaultMaxTokens,
    text: {
      format: {
        type: "text",
      },
    },
    ...(shouldUseLowReasoningEffort(model)
      ? {
          reasoning: {
            effort: "low",
          },
        }
      : {}),
  };
}

/**
 * Reads assistant-visible text from one OpenAI content block shape.
 */
function readOpenAIContentText(contentItem: unknown) {
  if (!isRecord(contentItem)) {
    return [];
  }

  if (
    (contentItem.type === "output_text" || contentItem.type === "text") &&
    typeof contentItem.text === "string" &&
    contentItem.text.trim()
  ) {
    return [contentItem.text.trim()];
  }

  if (
    contentItem.type === "refusal" &&
    typeof contentItem.refusal === "string" &&
    contentItem.refusal.trim()
  ) {
    return [contentItem.refusal.trim()];
  }

  if (
    (contentItem.type === "output_text" || contentItem.type === "text") &&
    isRecord(contentItem.text) &&
    typeof contentItem.text.value === "string" &&
    contentItem.text.value.trim()
  ) {
    return [contentItem.text.value.trim()];
  }

  return [];
}

/**
 * Gives a more actionable error when OpenAI completes without assistant-visible text.
 */
function buildOpenAIEmptyResponseMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return "OpenAI returned no visible text.";
  }

  const messageParts = ["OpenAI returned no visible text."];

  if (typeof payload.status === "string" && payload.status.trim()) {
    messageParts.push(`Status: ${payload.status.trim()}.`);
  }

  if (isRecord(payload.incomplete_details) && typeof payload.incomplete_details.reason === "string") {
    messageParts.push(`Incomplete reason: ${payload.incomplete_details.reason.trim()}.`);
  }

  const contentTypes = readOpenAIContentTypes(payload);

  if (contentTypes.length > 0) {
    messageParts.push(`Content types: ${contentTypes.join(", ")}.`);
  }

  return messageParts.join(" ");
}

/**
 * Captures the returned OpenAI content types to make empty-response debugging easier.
 */
function readOpenAIContentTypes(payload: Record<string, unknown>) {
  const outputEntries = Array.isArray(payload.output) ? payload.output : [];

  return outputEntries
    .flatMap((entry) =>
      isRecord(entry) && Array.isArray(entry.content) ? entry.content : [],
    )
    .flatMap((contentItem) =>
      isRecord(contentItem) && typeof contentItem.type === "string"
        ? [contentItem.type.trim()]
        : [],
    )
    .filter(Boolean);
}

/**
 * Extracts plain text from Gemini's candidate content parts.
 */
function extractGoogleText(payload: unknown) {
  const candidates =
    isRecord(payload) && Array.isArray(payload.candidates) ? payload.candidates : [];
  const text = candidates
    .flatMap((candidate) =>
      isRecord(candidate) && isRecord(candidate.content) && Array.isArray(candidate.content.parts)
        ? candidate.content.parts
        : [],
    )
    .flatMap((part) =>
      isRecord(part) && typeof part.text === "string" ? [part.text.trim()] : [],
    )
    .filter(Boolean)
    .join("\n\n");

  if (!text) {
    throw new Error("Google returned an empty response.");
  }

  return text;
}

/**
 * Keeps unknown JSON handling readable when working across several provider payloads.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/**
 * Uses a lower reasoning effort for GPT-5-family models so token budget is less likely to
 * disappear into reasoning with no visible answer returned.
 */
function shouldUseLowReasoningEffort(model: string) {
  return model.trim().startsWith("gpt-5");
}

type NormalizedProviderCallInput = ReturnType<typeof normalizeProviderCallInput>;
