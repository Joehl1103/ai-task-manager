import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Unit tests for the useLocalStorageState hook. Since we test in a Node
 * environment (no real DOM), we verify the module exports the expected
 * function signature.
 */

/* Minimal localStorage mock for Node test environment */
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

import { useLocalStorageState } from "./use-local-storage-state";

describe("useLocalStorageState", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("exports a function", () => {
    expect(typeof useLocalStorageState).toBe("function");
  });
});
