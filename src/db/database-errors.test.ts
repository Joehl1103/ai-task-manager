import { describe, expect, it } from "vitest";

import { readWorkspaceDatabaseErrorMessage } from "@/db/database-errors";

describe("readWorkspaceDatabaseErrorMessage", () => {
  it("explains host lookup failures with a restart reminder", () => {
    expect(
      readWorkspaceDatabaseErrorMessage({
        code: "ENOTFOUND",
        message: "getaddrinfo ENOTFOUND aws-1-us-east-2.pooler.supabase.com",
      }),
    ).toContain("Restart npm run dev after changing .env");
  });

  it("tells the user to push the schema when Relay tables are missing", () => {
    expect(
      readWorkspaceDatabaseErrorMessage({
        code: "42P01",
        message: "relation \"tasks\" does not exist",
      }),
    ).toContain("npm run db:push");
  });

  it("passes through the missing env guidance from the URL reader", () => {
    const message =
      "Relay could not find a workspace database URL. Set SUPABASE_DATABASE_URL for Supabase or DATABASE_URL for plain Postgres, then restart npm run dev.";

    expect(readWorkspaceDatabaseErrorMessage({ message })).toBe(message);
  });
});
