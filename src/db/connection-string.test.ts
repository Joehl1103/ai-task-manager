import { describe, expect, it } from "vitest";

import { normalizePostgresConnectionString } from "@/db/connection-string";

describe("normalizePostgresConnectionString", () => {
  /**
   * Keeps reserved characters in the password from being misread as URL syntax.
   */
  it("encodes an unescaped hash in the password", () => {
    expect(
      normalizePostgresConnectionString(
        "postgresql://postgres.hpcoskyzzvzjrwdksjap:ekG0#uVEz@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
      ),
    ).toBe(
      "postgresql://postgres.hpcoskyzzvzjrwdksjap:ekG0%23uVEz@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    );
  });

  /**
   * Avoids rewriting already valid connection strings so correctly encoded env
   * values stay stable.
   */
  it("leaves an already valid connection string unchanged", () => {
    expect(
      normalizePostgresConnectionString(
        "postgresql://postgres.hpcoskyzzvzjrwdksjap:ekG0%23uVEz@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
      ),
    ).toBe(
      "postgresql://postgres.hpcoskyzzvzjrwdksjap:ekG0%23uVEz@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    );
  });
});
