import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildAgentPrompt,
  callProviderAgent,
  extractProviderText,
  readProviderErrorMessage,
} from "@/features/workspace/providers";

const originalFetch = globalThis.fetch;

describe("provider api helpers", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  /**
   * Keeps prompt generation predictable so every provider gets the same task context.
   */
  it("builds a prompt from the task and request brief", () => {
    const prompt = buildAgentPrompt({
      ownerType: "task",
      entityName: "Plan the product kickoff",
      entityContext: "Keep the meeting under thirty minutes.",
      messages: [
        {
          id: "message-1",
          role: "human",
          content: "Draft a tight agenda with next steps.",
          createdAt: "Now",
        },
      ],
    });

    expect(prompt).toContain("Entity type: task");
    expect(prompt).toContain("Entity name: Plan the product kickoff");
    expect(prompt).toContain("Keep the meeting under thirty minutes.");
    expect(prompt).toContain("Human (Now): Draft a tight agenda with next steps.");
  });

  /**
   * Verifies Anthropic text blocks are flattened into a simple string for the UI.
   */
  it("extracts text from an Anthropic response", () => {
    expect(
      extractProviderText("anthropic", {
        content: [
          {
            type: "text",
            text: "Use a short opening, decisions, and owners.",
          },
        ],
      }),
    ).toBe("Use a short opening, decisions, and owners.");
  });

  /**
   * Verifies OpenAI response messages are flattened into a simple string for the UI.
   */
  it("extracts text from an OpenAI response", () => {
    expect(
      extractProviderText("openai", {
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "Keep the agenda to three sections and one clear decision.",
              },
            ],
          },
        ],
      }),
    ).toBe("Keep the agenda to three sections and one clear decision.");
  });

  /**
   * Tolerates OpenAI content blocks that expose plain text under `type: text`.
   */
  it("extracts text from an OpenAI response with plain text content blocks", () => {
    expect(
      extractProviderText("openai", {
        output: [
          {
            type: "message",
            content: [
              {
                type: "text",
                text: "Use one calm response, one boundary, and one repair step.",
              },
            ],
          },
        ],
      }),
    ).toBe("Use one calm response, one boundary, and one repair step.");
  });

  /**
   * Gives a more actionable error when OpenAI finishes without visible assistant text.
   */
  it("explains incomplete OpenAI responses with no visible text", () => {
    expect(() =>
      extractProviderText("openai", {
        status: "incomplete",
        incomplete_details: {
          reason: "max_output_tokens",
        },
        output: [],
      }),
    ).toThrow("OpenAI returned no visible text. Status: incomplete. Incomplete reason: max_output_tokens.");
  });

  /**
   * Retries once with a larger reply budget when OpenAI stops before emitting visible text.
   */
  it("retries incomplete OpenAI responses caused by max_output_tokens", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "incomplete",
            incomplete_details: {
              reason: "max_output_tokens",
            },
            output: [],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: "Start with the blocker, propose one next action, and ask one short follow-up question.",
                  },
                ],
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

    globalThis.fetch = fetchMock;

    await expect(
      callProviderAgent({
        providerId: "openai",
        apiKey: "test-key",
        model: "gpt-5",
        ownerType: "task",
        entityName: "Launch prep",
        entityContext: "Summarize the latest blocker clearly.",
        messages: [
          {
            id: "message-1",
            role: "human",
            content: "Can you help me draft the next update?",
            createdAt: "Now",
          },
        ],
      }),
    ).resolves.toEqual({
      result:
        "Start with the blocker, propose one next action, and ask one short follow-up question.",
      model: "gpt-5",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const initialRequest = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const retryRequest = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));

    expect(retryRequest.max_output_tokens).toBeGreaterThan(initialRequest.max_output_tokens);
  });

  /**
   * Makes the shared agent instructions explicitly ask for markdown while discouraging unnecessary lists.
   */
  it("asks OpenAI for markdown replies with paragraphs by default", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: "Short markdown reply.",
                },
              ],
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    globalThis.fetch = fetchMock;

    await callProviderAgent({
      providerId: "openai",
      apiKey: "test-key",
      model: "gpt-5",
      ownerType: "project",
      entityName: "Relay MVP",
      entityContext: "Keep formatting readable in the thread UI.",
      messages: [
        {
          id: "message-1",
          role: "human",
          content: "Give me the next recommendation.",
          createdAt: "Now",
        },
      ],
    });

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));

    expect(requestBody.instructions).toContain("GitHub-flavored Markdown");
    expect(requestBody.instructions).toContain("Prefer short paragraphs by default");
    expect(requestBody.instructions).toContain("Only use bullet or numbered lists");
    expect(requestBody.instructions).toContain("`- **Name**: explanation`");
  });

  /**
   * Verifies Gemini response candidates are flattened into a simple string for the UI.
   */
  it("extracts text from a Google response", () => {
    expect(
      extractProviderText("google", {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "Start with purpose, then blockers, then owners and dates.",
                },
              ],
            },
          },
        ],
      }),
    ).toBe("Start with purpose, then blockers, then owners and dates.");
  });

  /**
   * Surfaces provider-side failures with a readable fallback message.
   */
  it("reads nested provider error payloads", () => {
    expect(
      readProviderErrorMessage({
        error: {
          message: "The API key is invalid.",
        },
      }),
    ).toBe("The API key is invalid.");
  });
});
