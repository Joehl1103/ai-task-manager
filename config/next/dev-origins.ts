import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";

export type NetworkInterfacesMap = ReturnType<typeof networkInterfaces>;

/**
 * Normalizes a single configured origin into the hostname format Next expects for
 * `allowedDevOrigins`.
 */
function normalizeDevOrigin(origin: string): string | null {
  const trimmedOrigin = origin.trim().toLowerCase();

  if (!trimmedOrigin) {
    return null;
  }

  if (trimmedOrigin.includes("://")) {
    try {
      return new URL(trimmedOrigin).hostname;
    } catch {
      return null;
    }
  }

  const withoutPath = trimmedOrigin.split("/")[0];
  const hasSinglePortSeparator =
    withoutPath.includes(":") &&
    withoutPath.indexOf(":") === withoutPath.lastIndexOf(":");

  return hasSinglePortSeparator ? withoutPath.split(":")[0] ?? null : withoutPath;
}

/**
 * Deduplicates and sorts origin entries so config generation stays stable across runs.
 */
function toSortedUniqueOrigins(origins: Array<string | null>): string[] {
  return [...new Set(origins.filter((origin): origin is string => Boolean(origin)))].sort();
}

/**
 * Reads any user-provided origin overrides so custom local domains can still opt in.
 */
export function parseConfiguredDevOrigins(
  configuredOrigins: string | undefined,
): string[] {
  return toSortedUniqueOrigins(
    configuredOrigins?.split(",").map((origin) => normalizeDevOrigin(origin)) ?? [],
  );
}

/**
 * Narrows network interface entries to IPv4 addresses because those are the addresses
 * this project currently uses for local network development.
 */
function isIpv4Interface(
  interfaceInfo: NetworkInterfaceInfo,
): interfaceInfo is NetworkInterfaceInfo {
  return String(interfaceInfo.family) === "IPv4";
}

/**
 * Discovers the machine's current IPv4 addresses so dev-server websocket checks follow
 * the machine instead of a stale hardcoded IP.
 */
export function readMachineDevOrigins(interfaces: NetworkInterfacesMap): string[] {
  return toSortedUniqueOrigins(
    Object.values(interfaces)
      .flatMap((interfaceEntries) => interfaceEntries ?? [])
      .filter(isIpv4Interface)
      .map((interfaceInfo) => normalizeDevOrigin(interfaceInfo.address)),
  );
}

type BuildAllowedDevOriginsOptions = {
  configuredOrigins?: string | undefined;
  interfaces?: NetworkInterfacesMap;
};

/**
 * Builds the final `allowedDevOrigins` list from both machine-discovered IPs and
 * optional user overrides. When nothing is found, the caller can omit the config field
 * entirely and let Next fall back to its warning-only behavior.
 */
export function buildAllowedDevOrigins(
  options: BuildAllowedDevOriginsOptions = {},
): string[] | undefined {
  const machineOrigins = readMachineDevOrigins(
    options.interfaces ?? networkInterfaces(),
  );
  const configuredOrigins = parseConfiguredDevOrigins(options.configuredOrigins);
  const allowedDevOrigins = toSortedUniqueOrigins([
    ...machineOrigins,
    ...configuredOrigins,
  ]);

  return allowedDevOrigins.length > 0 ? allowedDevOrigins : undefined;
}
