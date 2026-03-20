import path from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

/**
 * Keeps Vitest module resolution aligned with the app's `@/` import alias.
 */
export default defineConfig({
  test: {
    /**
     * Keeps sibling git worktrees out of this workspace's test run so Vitest only
     * evaluates the files that belong to the current checkout.
     */
    exclude: [...configDefaults.exclude, "**/.worktrees/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
