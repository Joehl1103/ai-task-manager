import { createServer } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildDevEnvironment,
  findAvailablePort,
  readRequestedPort,
  upsertPortArgument,
} from "./dev-instance.mjs";

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
      WATCHPACK_POLLING: "true",
    });
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
