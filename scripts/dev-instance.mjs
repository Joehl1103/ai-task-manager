import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

export const DEFAULT_DEV_PORT = 3000;
export const DEV_DIST_DIR_ENV = "RELAY_NEXT_DIST_DIR";
export const DEV_TSCONFIG_ENV = "RELAY_NEXT_TSCONFIG_PATH";
const PORT_ARGUMENT_FLAGS = new Set(["-p", "--port"]);

/**
 * Accepts only valid TCP port values so we do not forward malformed arguments into Next.
 */
function normalizePort(candidate) {
  const parsedPort = Number(candidate);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return null;
  }

  return parsedPort;
}

/**
 * Reads a requested port from the forwarded CLI args, falling back to `PORT` or the default.
 */
export function readRequestedPort(
  forwardedArguments,
  currentEnvironment = process.env,
) {
  for (let index = 0; index < forwardedArguments.length; index += 1) {
    const currentArgument = forwardedArguments[index];

    if (!currentArgument) {
      continue;
    }

    if (PORT_ARGUMENT_FLAGS.has(currentArgument)) {
      return normalizePort(forwardedArguments[index + 1]) ?? DEFAULT_DEV_PORT;
    }

    if (currentArgument.startsWith("--port=")) {
      return normalizePort(currentArgument.slice("--port=".length)) ?? DEFAULT_DEV_PORT;
    }
  }

  return normalizePort(currentEnvironment.PORT) ?? DEFAULT_DEV_PORT;
}

/**
 * Rewrites or appends the final selected port so the child Next process uses the same port
 * that we used when deriving the per-instance build directory.
 */
export function upsertPortArgument(forwardedArguments, selectedPort) {
  const nextArguments = [...forwardedArguments];

  for (let index = 0; index < nextArguments.length; index += 1) {
    const currentArgument = nextArguments[index];

    if (!currentArgument) {
      continue;
    }

    if (PORT_ARGUMENT_FLAGS.has(currentArgument)) {
      nextArguments[index + 1] = String(selectedPort);
      return nextArguments;
    }

    if (currentArgument.startsWith("--port=")) {
      nextArguments[index] = `--port=${selectedPort}`;
      return nextArguments;
    }
  }

  return [...nextArguments, "--port", String(selectedPort)];
}

/**
 * Gives each dev port its own `.next` subtree so concurrent dev servers do not fight over
 * the same Next.js lock file.
 */
function buildDevDistDirectory(selectedPort) {
  return `.next/instances/port-${selectedPort}`;
}

/**
 * Uses a generated per-instance tsconfig so Next can add its type includes without
 * rewriting the tracked root tsconfig.json for every chosen port.
 */
function buildDevTsconfigPath(selectedPort) {
  return `${buildDevDistDirectory(selectedPort)}/tsconfig.json`;
}

/**
 * Creates the generated tsconfig file that each concurrent dev instance points Next at.
 */
export function ensureDevTsconfig(projectRoot, selectedPort) {
  const instanceDirectory = resolve(projectRoot, buildDevDistDirectory(selectedPort));
  const tsconfigPath = resolve(projectRoot, buildDevTsconfigPath(selectedPort));

  mkdirSync(instanceDirectory, { recursive: true });
  writeFileSync(
    tsconfigPath,
    `${JSON.stringify(
      {
        extends: "../../../tsconfig.json",
      },
      null,
      2,
    )}\n`,
  );
}

/**
 * Ensures worktree-safe polling and a per-port build directory for each Next dev instance.
 */
export function buildDevEnvironment(currentEnvironment, selectedPort) {
  return {
    ...currentEnvironment,
    PORT: String(selectedPort),
    WATCHPACK_POLLING: currentEnvironment.WATCHPACK_POLLING ?? "true",
    [DEV_DIST_DIR_ENV]:
      currentEnvironment[DEV_DIST_DIR_ENV] ?? buildDevDistDirectory(selectedPort),
    [DEV_TSCONFIG_ENV]:
      currentEnvironment[DEV_TSCONFIG_ENV] ?? buildDevTsconfigPath(selectedPort),
  };
}

/**
 * Checks whether the given TCP port is currently free using Node's default bind behavior,
 * which matches how Next probes and listens during `next dev`.
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const probeServer = createServer();

    probeServer.unref();
    probeServer.on("error", () => {
      resolve(false);
    });
    probeServer.listen(port, () => {
      probeServer.close(() => {
        resolve(true);
      });
    });
  });
}

/**
 * Walks upward from the requested port until an available port is found.
 */
export async function findAvailablePort(requestedPort) {
  let selectedPort = requestedPort;

  while (!(await isPortAvailable(selectedPort))) {
    selectedPort += 1;
  }

  return selectedPort;
}
