import { describe, expect, it } from "vitest";

import { readDatabaseUrlConfig, requireDatabaseUrl } from "@/db/database-url";

describe("readDatabaseUrlConfig", () => {
  it("prefers SUPABASE_DATABASE_URL when both env vars are set", () => {
    expect(
      readDatabaseUrlConfig({
        DATABASE_URL: "postgresql://local-user:local-pass@localhost:5432/relay_tasks",
        SUPABASE_DATABASE_URL:
          "postgresql://remote-user:remote-pass@pooler.supabase.com:5432/postgres",
      }),
    ).toEqual({
      connectionString: "postgresql://remote-user:remote-pass@pooler.supabase.com:5432/postgres",
      source: "SUPABASE_DATABASE_URL",
    });
  });

  it("falls back to DATABASE_URL when Supabase is not configured", () => {
    expect(
      readDatabaseUrlConfig({
        DATABASE_URL: "postgresql://local-user:local-pass@localhost:5432/relay_tasks",
      }),
    ).toEqual({
      connectionString: "postgresql://local-user:local-pass@localhost:5432/relay_tasks",
      source: "DATABASE_URL",
    });
  });
});

describe("requireDatabaseUrl", () => {
  it("throws a restart-focused setup message when no supported env var is set", () => {
    expect(() => requireDatabaseUrl({})).toThrow(
      "Relay could not find a workspace database URL. Set SUPABASE_DATABASE_URL for Supabase or DATABASE_URL for plain Postgres, then restart npm run dev.",
    );
  });
});
