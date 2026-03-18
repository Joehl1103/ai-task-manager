import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const resolveFromScript = createRequire(import.meta.url);

/**
 * Ensures the Next dev server uses polling-based file watching in worktrees and tmp directories
 * where native file events can be unreliable.
 */
function buildDevEnvironment(currentEnvironment) {
  return {
    ...currentEnvironment,
    WATCHPACK_POLLING: currentEnvironment.WATCHPACK_POLLING ?? "true",
  };
}

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

const nextBinPath = resolveFromScript.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBinPath, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: buildDevEnvironment(process.env),
});

child.on("exit", exitFromChild);
