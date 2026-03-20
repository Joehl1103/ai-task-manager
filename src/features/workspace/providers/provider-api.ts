import { type AgentThreadMessage, type ProviderId, type ThreadOwnerType } from "@/features/workspace/core";

const agentSystemInstruction =
  [
    "You are Relay's built-in workspace agent.",
    "Continue the current thread in plain language, stay practical, and keep the answer concise.",
    "Format replies in GitHub-flavored Markdown.",
    "Prefer short paragraphs by default.",
    "Only use bullet or numbered lists when the content is genuinely list-shaped or the user asks for a list.",
    "For recommendations or option sets, keep each item on a single markdown bullet in the form `- **Name**: explanation`.",
  ].join(" ");

const defaultMaxTokens = 700;
const openAIInitialMaxOutputTokens = 1200;
const openAIRetryMaxOutputTokens = 2400;

export interface BuildAgentPromptInput {
  ownerType: ThreadOwnerType;
  entityName: string;
  entityContext: string;
  messages: AgentThreadMessage[];
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
  const normalizedEntityName = input.entityName.trim();
  const normalizedEntityContext = input.entityContext.trim();
  const transcript = buildThreadTranscript(input.messages);

  return [
    `Entity type: ${input.ownerType}`,
    `Entity name: ${normalizedEntityName || `Untitled ${input.ownerType}`}`,
    "Entity context:",
    normalizedEntityContext || "No extra context was provided.",
    "",
    "Thread transcript:",
    transcript || "No prior messages.",
    "",
    "Write the next agent reply in this thread. Continue naturally from the latest human message.",
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
  const firstAttempt = await requestOpenAIResponse(input, prompt, openAIInitialMaxOutputTokens);

  if (!firstAttempt.response.ok) {
    throw new Error(
      readProviderErrorMessage(firstAttempt.payload) ??
        `OpenAI returned an error (${firstAttempt.response.status}).`,
    );
  }

  if (!shouldRetryOpenAIResponse(firstAttempt.payload)) {
    return {
      result: extractProviderText("openai", firstAttempt.payload),
      model: input.model,
    };
  }

  const retryAttempt = await requestOpenAIResponse(input, prompt, openAIRetryMaxOutputTokens);

  if (!retryAttempt.response.ok) {
    throw new Error(
      readProviderErrorMessage(retryAttempt.payload) ??
        `OpenAI returned an error (${retryAttempt.response.status}).`,
    );
  }

  if (shouldRetryOpenAIResponse(retryAttempt.payload)) {
    throw new Error(buildOpenAIRetryLimitMessage(retryAttempt.payload));
  }

  return {
    result: extractProviderText("openai", retryAttempt.payload),
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
  const normalizedEntityName = input.entityName.trim();
  const normalizedEntityContext = input.entityContext.trim();
  const normalizedMessages = input.messages
    .map((message) => ({
      ...message,
      content: message.content.trim(),
      createdAt: message.createdAt.trim(),
    }))
    .filter((message) => message.content);

  if (!normalizedApiKey) {
    throw new Error("Add an API key for the selected provider before calling the agent.");
  }

  if (!normalizedModel) {
    throw new Error("Add a model for the selected provider before calling the agent.");
  }

  if (!normalizedEntityName) {
    throw new Error("Each thread request needs an entity name.");
  }

  if (normalizedMessages.length === 0) {
    throw new Error("Add a message before calling the agent.");
  }

  if (normalizedMessages[normalizedMessages.length - 1]?.role !== "human") {
    throw new Error("The latest thread entry must be a human message.");
  }

  return {
    ...input,
    apiKey: normalizedApiKey,
    model: normalizedModel,
    entityName: normalizedEntityName,
    entityContext: normalizedEntityContext,
    messages: normalizedMessages,
  };
}

/**
 * Flattens one entity thread into a readable prompt transcript.
 */
function buildThreadTranscript(messages: AgentThreadMessage[]) {
  return messages
    .map((message) => {
      const speakerLabel = message.role === "human" ? "Human" : "Agent";
      const statusLabel =
        message.role === "agent" && message.status ? ` [${message.status}]` : "";
      const timestampLabel = message.createdAt.trim() ? ` (${message.createdAt.trim()})` : "";

      return `${speakerLabel}${statusLabel}${timestampLabel}: ${message.content.trim()}`;
    })
    .filter(Boolean)
    .join("\n\n");
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
  const text = readOpenAITextSegments(payload).join("\n\n");

  if (!text) {
    throw new Error(buildOpenAIEmptyResponseMessage(payload));
  }

  return text;
}

/**
 * Builds the request body used for OpenAI's Responses API.
 */
function buildOpenAIRequestBody(
  model: string,
  prompt: string,
  maxOutputTokens = openAIInitialMaxOutputTokens,
) {
  return {
    model,
    instructions: agentSystemInstruction,
    input: prompt,
    max_output_tokens: maxOutputTokens,
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
 * Reads every visible text segment OpenAI returned, including the convenience `output_text` field.
 */
function readOpenAITextSegments(payload: unknown) {
  const outputText =
    isRecord(payload) && typeof payload.output_text === "string" ? payload.output_text.trim() : "";

  if (outputText) {
    return [outputText];
  }

  const outputEntries = isRecord(payload) && Array.isArray(payload.output) ? payload.output : [];

  return outputEntries
    .flatMap((entry) =>
      isRecord(entry) && Array.isArray(entry.content) ? entry.content : [],
    )
    .flatMap((contentItem) => readOpenAIContentText(contentItem))
    .filter(Boolean);
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

/**
 * Performs one OpenAI Responses API request so retry behavior can stay focused and testable.
 */
async function requestOpenAIResponse(
  input: NormalizedProviderCallInput,
  prompt: string,
  maxOutputTokens: number,
) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify(buildOpenAIRequestBody(input.model, prompt, maxOutputTokens)),
  });

  return {
    response,
    payload: await readProviderPayload(response),
  };
}

/**
 * Retries only when OpenAI explicitly stopped at the output-token limit before returning text.
 */
function shouldRetryOpenAIResponse(payload: unknown) {
  return (
    isRecord(payload) &&
    payload.status === "incomplete" &&
    readOpenAIIncompleteReason(payload) === "max_output_tokens" &&
    readOpenAITextSegments(payload).length === 0
  );
}

/**
 * Gives a clearer final message after a larger-budget retry still produced no visible text.
 */
function buildOpenAIRetryLimitMessage(payload: unknown) {
  const baseMessage =
    "OpenAI hit the reply token limit twice before producing visible text. Try shortening the thread or switching to a lighter model.";
  const incompleteReason = isRecord(payload) ? readOpenAIIncompleteReason(payload) : "";

  if (!incompleteReason) {
    return baseMessage;
  }

  return `${baseMessage} Incomplete reason: ${incompleteReason}.`;
}

/**
 * Reads the incomplete reason from an OpenAI response payload when present.
 */
function readOpenAIIncompleteReason(payload: Record<string, unknown>) {
  if (isRecord(payload.incomplete_details) && typeof payload.incomplete_details.reason === "string") {
    return payload.incomplete_details.reason.trim();
  }

  return "";
}

type NormalizedProviderCallInput = ReturnType<typeof normalizeProviderCallInput>;
