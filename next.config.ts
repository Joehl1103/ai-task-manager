import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

import { buildAllowedDevOrigins } from "./config/next/dev-origins";
import { findNextWorkspaceRoot } from "./config/next/workspace-root";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = findNextWorkspaceRoot(appRoot);
const allowedDevOrigins = buildAllowedDevOrigins();
const distDir = process.env.RELAY_NEXT_DIST_DIR;
const tsconfigPath = process.env.RELAY_NEXT_TSCONFIG_PATH ?? "tsconfig.json";

const nextConfig: NextConfig = {
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
  ...(distDir ? { distDir } : {}),
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  typescript: {
    tsconfigPath,
  },
};

export default nextConfig;
