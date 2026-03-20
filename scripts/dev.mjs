import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import {
  buildDevEnvironment,
  findAvailablePort,
  readRequestedPort,
  upsertPortArgument,
} from "./dev-instance.mjs";

const resolveFromScript = createRequire(import.meta.url);

/**
 * Mirrors the child process exit so `npm run dev` behaves like the underlying Next process.
 */
function exitFromChild(code, signal) {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
}

async function main() {
  const forwardedArguments = process.argv.slice(2);
  const requestedPort = readRequestedPort(forwardedArguments, process.env);
  const selectedPort = await findAvailablePort(requestedPort);

  if (selectedPort !== requestedPort) {
    console.warn(
      `⚠ Port ${requestedPort} is in use, using available port ${selectedPort} instead.`,
    );
  }

  const nextBinPath = resolveFromScript.resolve("next/dist/bin/next");
  const child = spawn(
    process.execPath,
    [nextBinPath, "dev", ...upsertPortArgument(forwardedArguments, selectedPort)],
    {
      stdio: "inherit",
      env: buildDevEnvironment(process.env, selectedPort),
    },
  );

  child.on("exit", exitFromChild);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
