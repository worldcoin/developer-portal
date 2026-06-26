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

// World ID 4.0 is always available now (#1974 removed the rollout flag), so v3
// is a standalone SSM allowlist — no subset gate.
describe("isPortalV3EnabledServer (SSM allowlist)", () => {
  it("returns true when the team is in the portal-v3 list", async () => {
    setParameterStore([TEAM]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(true);
  });

  it("returns true when enable_all_teams is set", async () => {
    setParameterStore(["enable_all_teams"]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(true);
  });

  it("returns false when the team is not listed", async () => {
    setParameterStore(["team_other"]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(false);
  });

  it("fails closed when ParameterStore is unavailable", async () => {
    global.ParameterStore = undefined;
    expect(await isPortalV3EnabledServer(TEAM)).toBe(false);
  });
});
