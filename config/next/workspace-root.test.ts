import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { findNextWorkspaceRoot } from "./workspace-root";

const tempDirectories = [];

afterEach(() => {
  while (tempDirectories.length > 0) {
    const directory = tempDirectories.pop();

    if (directory) {
      rmSync(directory, { force: true, recursive: true });
    }
  }
});

describe("findNextWorkspaceRoot", () => {
  it("returns the starting directory when it already contains Next.js", () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), "relay-next-root-"));
    tempDirectories.push(workspaceRoot);

    mkdirSync(join(workspaceRoot, "node_modules", "next"), { recursive: true });
    writeFileSync(join(workspaceRoot, "node_modules", "next", "package.json"), "{}");

    expect(findNextWorkspaceRoot(workspaceRoot)).toBe(workspaceRoot);
  });

  it("walks up to an ancestor workspace root for nested worktree-style directories", () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), "relay-next-root-"));
    const nestedProjectDirectory = join(
      workspaceRoot,
      ".worktrees",
      "feature-dev-multi-instance",
    );

    tempDirectories.push(workspaceRoot);
    mkdirSync(join(workspaceRoot, "node_modules", "next"), { recursive: true });
    mkdirSync(nestedProjectDirectory, { recursive: true });
    writeFileSync(join(workspaceRoot, "node_modules", "next", "package.json"), "{}");

    expect(findNextWorkspaceRoot(nestedProjectDirectory)).toBe(workspaceRoot);
  });
});
