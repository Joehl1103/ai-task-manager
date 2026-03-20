import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildDevEnvironment,
  ensureDevTsconfig,
  findAvailablePort,
  readRequestedPort,
  upsertPortArgument,
} from "./dev-instance.mjs";

const tempDirectories = [];
const openServers = [];

afterEach(async () => {
  while (openServers.length > 0) {
    const server = openServers.pop();

    if (!server) {
      continue;
    }

    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  while (tempDirectories.length > 0) {
    const directory = tempDirectories.pop();

    if (directory) {
      rmSync(directory, { force: true, recursive: true });
    }
  }
});

describe("readRequestedPort", () => {
  it("defaults to port 3000 when nothing is configured", () => {
    expect(readRequestedPort([], {})).toBe(3000);
  });

  it("prefers an explicit CLI port over the environment", () => {
    expect(readRequestedPort(["--port", "4010"], { PORT: "3005" })).toBe(4010);
  });

  it("supports inline long-form port arguments", () => {
    expect(readRequestedPort(["--port=4012"], {})).toBe(4012);
  });
});

describe("upsertPortArgument", () => {
  it("adds a port argument when one was not provided", () => {
    expect(upsertPortArgument(["--hostname", "0.0.0.0"], 4015)).toEqual([
      "--hostname",
      "0.0.0.0",
      "--port",
      "4015",
    ]);
  });

  it("replaces an existing port argument", () => {
    expect(upsertPortArgument(["--port", "3000"], 4016)).toEqual(["--port", "4016"]);
  });
});

describe("buildDevEnvironment", () => {
  it("turns on polling and gives each selected port its own dev directory", () => {
    expect(buildDevEnvironment({}, 4020)).toMatchObject({
      PORT: "4020",
      RELAY_NEXT_DIST_DIR: ".next/instances/port-4020",
      RELAY_NEXT_TSCONFIG_PATH: ".next/instances/port-4020/tsconfig.json",
      WATCHPACK_POLLING: "true",
    });
  });

  it("creates a generated tsconfig for each concurrent dev instance", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "relay-dev-instance-"));
    tempDirectories.push(projectRoot);

    ensureDevTsconfig(projectRoot, 4021);

    expect(
      readFileSync(
        join(projectRoot, ".next", "instances", "port-4021", "tsconfig.json"),
        "utf8",
      ),
    ).toContain('"extends": "../../../tsconfig.json"');
  });
});

describe("findAvailablePort", () => {
  it("skips over an occupied port", async () => {
    const server = createServer();
    openServers.push(server);

    const usedPort = await new Promise((resolve, reject) => {
      server.listen(0, () => {
        const address = server.address();

        if (!address || typeof address === "string") {
          reject(new Error("Expected an ephemeral TCP port."));
          return;
        }

        resolve(address.port);
      });
    });

    const selectedPort = await findAvailablePort(usedPort);

    expect(selectedPort).toBeGreaterThan(usedPort);
  });
});
