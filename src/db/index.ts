import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { normalizePostgresConnectionString } from "./connection-string";
import { requireDatabaseUrl } from "./database-url";
import * as schema from "./schema";

let db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (db) return db;

  const { connectionString } = requireDatabaseUrl();
  const client = postgres(normalizePostgresConnectionString(connectionString));
  db = drizzle(client, { schema });
  return db;
}

export * from "./schema";
