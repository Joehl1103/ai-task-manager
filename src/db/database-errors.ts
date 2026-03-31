/**
 * Converts low-level database failures into troubleshooting text the UI can show directly.
 */
export function readWorkspaceDatabaseErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return defaultWorkspaceDatabaseErrorMessage;
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : null;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";

  if (message.includes("workspace database URL")) {
    return message;
  }

  if (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT"
  ) {
    return `${hostReachabilityErrorMessage} Restart npm run dev after changing .env because a browser reload does not refresh server env vars.`;
  }

  if (code === "28P01") {
    return "Relay reached the workspace database, but the username or password was rejected. Recheck the connection URL and percent-encode password characters like $ and # before restarting npm run dev.";
  }

  if (code === "3D000") {
    return "Relay reached the database server, but the database name in the URL does not exist. Confirm the database path in the connection URL, then restart npm run dev.";
  }

  if (code === "42P01") {
    return "Relay reached the workspace database, but the Relay tables are missing. Run npm run db:push against that database, then restart npm run dev.";
  }

  return defaultWorkspaceDatabaseErrorMessage;
}

const hostReachabilityErrorMessage =
  "Relay could not reach the workspace database. Check that the host is reachable and the connection URL is correct.";

const defaultWorkspaceDatabaseErrorMessage =
  "Relay could not load the workspace database. Restart npm run dev after changing .env, then verify the database URL, credentials, and schema.";
