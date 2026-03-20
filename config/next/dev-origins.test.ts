import type { NetworkInterfaceInfo } from "node:os";

import { describe, expect, it } from "vitest";

import {
  buildAllowedDevOrigins,
  parseConfiguredDevOrigins,
  readMachineDevOrigins,
  type NetworkInterfacesMap,
} from "./dev-origins";

/**
 * Builds a minimal network interface entry so each test only needs to specify the values
 * that affect origin discovery.
 */
function createInterfaceInfo(
  overrides: Partial<NetworkInterfaceInfo>,
): NetworkInterfaceInfo {
  return {
    address: "127.0.0.1",
    netmask: "255.0.0.0",
    family: "IPv4",
    mac: "00:00:00:00:00:00",
    internal: true,
    cidr: "127.0.0.1/8",
    ...overrides,
  };
}

describe("configured dev origins", () => {
  it("normalizes host entries and removes duplicates", () => {
    expect(
      parseConfiguredDevOrigins(
        " HTTP://192.168.4.63:3000 , relay.local , 192.168.4.63:4000 , ",
      ),
    ).toEqual(["192.168.4.63", "relay.local"]);
  });
});

describe("machine dev origins", () => {
  it("collects IPv4 addresses from the current machine and ignores IPv6 entries", () => {
    const interfaces: NetworkInterfacesMap = {
      lo0: [createInterfaceInfo({ address: "127.0.0.1", internal: true })],
      en0: [
        createInterfaceInfo({
          address: "192.168.4.63",
          cidr: "192.168.4.63/24",
          internal: false,
          mac: "aa:bb:cc:dd:ee:ff",
        }),
        createInterfaceInfo({
          address: "fe80::1",
          family: "IPv6",
          cidr: "fe80::1/64",
        }),
      ],
    };

    expect(readMachineDevOrigins(interfaces)).toEqual([
      "127.0.0.1",
      "192.168.4.63",
    ]);
  });
});

describe("allowed dev origins", () => {
  it("merges discovered machine IPs with configured overrides", () => {
    const interfaces: NetworkInterfacesMap = {
      en0: [
        createInterfaceInfo({
          address: "192.168.4.63",
          cidr: "192.168.4.63/24",
          internal: false,
        }),
      ],
    };

    expect(
      buildAllowedDevOrigins({
        configuredOrigins: "relay.local, 192.168.4.63:3000",
        interfaces,
      }),
    ).toEqual(["192.168.4.63", "relay.local"]);
  });

  it("returns undefined when there is nothing to allow explicitly", () => {
    expect(
      buildAllowedDevOrigins({
        configuredOrigins: undefined,
        interfaces: {},
      }),
    ).toBeUndefined();
  });
});
