import path from "node:path";

import { defineConfig } from "vitest/config";

/**
 * Keeps Vitest module resolution aligned with the app's `@/` import alias.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
