const isWorldId40EnabledServer = jest.fn();
jest.mock("@/lib/feature-flags/world-id-4-0/server", () => ({
  isWorldId40EnabledServer: (...args: unknown[]) =>
    isWorldId40EnabledServer(...args),
}));

import { isPortalV3EnabledServer } from "@/lib/feature-flags/portal-v3/server";

const TEAM = "team_123";

const setParameterStore = (value: string[] | undefined) => {
  global.ParameterStore = {
    getParameter: jest.fn().mockResolvedValue(value),
  } as unknown as NonNullable<typeof global.ParameterStore>;
};

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED_TEAMS;
});

afterEach(() => {
  global.ParameterStore = undefined;
});

describe("isPortalV3EnabledServer (subset gate + allowlist)", () => {
  it("returns false when world-id-4-0 is disabled, even if portal-v3 lists the team", async () => {
    isWorldId40EnabledServer.mockResolvedValue(false);
    setParameterStore([TEAM]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(false);
  });

  it("returns true when WID4 is enabled and the team is in the portal-v3 list", async () => {
    isWorldId40EnabledServer.mockResolvedValue(true);
    setParameterStore([TEAM]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(true);
  });

  it("returns true when WID4 is enabled and enable_all_teams is set", async () => {
    isWorldId40EnabledServer.mockResolvedValue(true);
    setParameterStore(["enable_all_teams"]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(true);
  });

  it("returns false when WID4 is enabled but the team is not listed", async () => {
    isWorldId40EnabledServer.mockResolvedValue(true);
    setParameterStore(["team_other"]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(false);
  });

  it("fails closed when ParameterStore is unavailable (WID4 enabled)", async () => {
    isWorldId40EnabledServer.mockResolvedValue(true);
    global.ParameterStore = undefined;
    expect(await isPortalV3EnabledServer(TEAM)).toBe(false);
  });
});
