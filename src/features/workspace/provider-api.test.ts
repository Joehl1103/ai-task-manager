import { describe, expect, it } from "vitest";

import {
  buildAgentPrompt,
  extractProviderText,
  readProviderErrorMessage,
} from "./provider-api";

describe("provider api helpers", () => {
  /**
   * Keeps prompt generation predictable so every provider gets the same task context.
   */
  it("builds a prompt from the task and request brief", () => {
    const prompt = buildAgentPrompt({
      taskTitle: "Plan the product kickoff",
      taskDetails: "Keep the meeting under thirty minutes.",
      brief: "Draft a tight agenda with next steps.",
    });

    expect(prompt).toContain("Task title: Plan the product kickoff");
    expect(prompt).toContain("Task details: Keep the meeting under thirty minutes.");
    expect(prompt).toContain("Agent request: Draft a tight agenda with next steps.");
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
