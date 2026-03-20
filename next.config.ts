import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

import { buildAllowedDevOrigins } from "./next-dev-origins";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const allowedDevOrigins = buildAllowedDevOrigins();

const nextConfig: NextConfig = {
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
