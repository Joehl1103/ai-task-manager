/**
 * Re-encodes a URL credential segment so reserved characters such as `#` or `@`
 * remain part of the username/password instead of being treated as URL syntax.
 */
function encodeCredentialSegment(value: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch {
    return encodeURIComponent(value);
  }
}

/**
 * Detects whether a connection string can already be parsed as a valid URL.
 */
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes Postgres connection strings whose credentials contain unescaped
 * reserved URL characters. This keeps local `.env` values forgiving while still
 * passing a standards-compliant URL to `postgres-js`.
 */
export function normalizePostgresConnectionString(connectionString: string): string {
  if (isValidUrl(connectionString)) {
    return connectionString;
  }

  const protocolMatch = connectionString.match(/^(postgres(?:ql)?:\/\/)(.*)$/i);

  if (!protocolMatch) {
    return connectionString;
  }

  const [, protocol, remainder] = protocolMatch;
  const firstSlashIndex = remainder.indexOf("/");

  if (firstSlashIndex === -1) {
    return connectionString;
  }

  const authority = remainder.slice(0, firstSlashIndex);
  const resource = remainder.slice(firstSlashIndex);
  const atIndex = authority.lastIndexOf("@");

  if (atIndex === -1) {
    return connectionString;
  }

  const credentials = authority.slice(0, atIndex);
  const host = authority.slice(atIndex + 1);
  const separatorIndex = credentials.indexOf(":");
  const username = separatorIndex === -1 ? credentials : credentials.slice(0, separatorIndex);
  const password = separatorIndex === -1 ? "" : credentials.slice(separatorIndex + 1);
  const encodedUsername = encodeCredentialSegment(username);
  const encodedPassword = separatorIndex === -1 ? "" : `:${encodeCredentialSegment(password)}`;
  const normalizedConnectionString = `${protocol}${encodedUsername}${encodedPassword}@${host}${resource}`;

  return isValidUrl(normalizedConnectionString) ? normalizedConnectionString : connectionString;
}
