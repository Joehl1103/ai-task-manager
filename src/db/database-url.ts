const databaseUrlEnvKeys = ["SUPABASE_DATABASE_URL", "DATABASE_URL"] as const;

export type DatabaseUrlEnvKey = (typeof databaseUrlEnvKeys)[number];

export interface DatabaseUrlConfig {
  connectionString: string;
  source: DatabaseUrlEnvKey;
}

/**
 * Reads the first configured database URL so hosted Supabase setups can use
 * their dedicated env var while local Postgres continues to work unchanged.
 */
export function readDatabaseUrlConfig(
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseUrlConfig | null {
  for (const key of databaseUrlEnvKeys) {
    const rawValue = environment[key];
    const connectionString = typeof rawValue === "string" ? rawValue.trim() : "";

    if (connectionString) {
      return {
        connectionString,
        source: key,
      };
    }
  }

  return null;
}

/**
 * Throws a user-facing error when neither supported database env var is set.
 */
export function requireDatabaseUrl(environment: NodeJS.ProcessEnv = process.env): DatabaseUrlConfig {
  const config = readDatabaseUrlConfig(environment);

  if (config) {
    return config;
  }

  throw new Error(
    "Relay could not find a workspace database URL. Set SUPABASE_DATABASE_URL for Supabase or DATABASE_URL for plain Postgres, then restart npm run dev.",
  );
}
