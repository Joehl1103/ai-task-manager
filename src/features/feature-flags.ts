/**
 * Centralised feature flags backed by NEXT_PUBLIC_FEATURE_* env vars.
 *
 * Next.js inlines NEXT_PUBLIC_ values at build time, so flipping a flag
 * requires a rebuild (or dev-server restart). Add new flags here as the
 * product surface grows.
 */

/** Returns true when the raw env string equals "true" (case-insensitive). */
function isEnabled(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === "true";
}

export const featureFlags = {
  /** Show the Initiatives section in navigation, sidebar, and project forms. */
  initiatives: isEnabled(process.env.NEXT_PUBLIC_FEATURE_INITIATIVES),
} as const;
