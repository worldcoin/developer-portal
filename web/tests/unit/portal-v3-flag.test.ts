// #region Mocks
jest.mock("server-only", () => ({}));
// #endregion

import {
  isPortalV3Enabled,
  isPortalV3EnabledForTeam,
} from "@/lib/feature-flags/portal-v3/flag";

const ENV_KEY = "LOCAL_DEV_PORTAL_V3_ENABLED";

describe("isPortalV3Enabled", () => {
  const original = process.env[ENV_KEY];

  afterEach(() => {
    if (original === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = original;
    }
  });

  it("returns false when the env var is unset", () => {
    delete process.env[ENV_KEY];
    expect(isPortalV3Enabled()).toBe(false);
  });

  it('returns true only for the exact string "true"', () => {
    process.env[ENV_KEY] = "true";
    expect(isPortalV3Enabled()).toBe(true);
  });

  it('returns false for a truthy-but-not-"true" value like "1"', () => {
    process.env[ENV_KEY] = "1";
    expect(isPortalV3Enabled()).toBe(false);
  });

  it('returns false for "false"', () => {
    process.env[ENV_KEY] = "false";
    expect(isPortalV3Enabled()).toBe(false);
  });
});

describe("isPortalV3EnabledForTeam", () => {
  const original = process.env[ENV_KEY];

  afterEach(() => {
    delete (global as { ParameterStore?: unknown }).ParameterStore;
    if (original === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = original;
    }
  });

  const mockParameterStore = (value: string | undefined) => {
    (global as { ParameterStore?: unknown }).ParameterStore = {
      getParameter: jest.fn().mockResolvedValue(value),
    };
  };

  it('is true when the team\'s SSM parameter is "true"', async () => {
    mockParameterStore("true");
    expect(await isPortalV3EnabledForTeam("team_1")).toBe(true);
  });

  it('is false when the team\'s SSM parameter is "false"', async () => {
    mockParameterStore("false");
    expect(await isPortalV3EnabledForTeam("team_1")).toBe(false);
  });

  it("falls back to the env var when Parameter Store is not initialized", async () => {
    delete (global as { ParameterStore?: unknown }).ParameterStore;
    process.env[ENV_KEY] = "true";
    expect(await isPortalV3EnabledForTeam("team_1")).toBe(true);
  });
});
