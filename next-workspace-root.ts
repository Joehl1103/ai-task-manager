import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * Walks upward until it finds the directory that actually contains the shared Next.js install.
 * This lets worktrees nested under `.worktrees/` point Turbopack at the real workspace root.
 */
export function findNextWorkspaceRoot(startingDirectory: string): string {
  const resolvedStartingDirectory = resolve(startingDirectory);
  let currentDirectory = resolvedStartingDirectory;

  while (true) {
    if (existsSync(join(currentDirectory, "node_modules", "next", "package.json"))) {
      return currentDirectory;
    }

    const parentDirectory = dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return resolvedStartingDirectory;
    }

    currentDirectory = parentDirectory;
  }
}
