import { isPortalV3EnabledServer } from "@/lib/feature-flags/portal-v3/server";

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
  global.ParameterStore = undefined;
});

describe("isPortalV3EnabledServer", () => {
  it('returns true when SSM returns the string "true"', async () => {
    global.ParameterStore = {
      getParameter: jest.fn().mockResolvedValue("true"),
    } as unknown as NonNullable<typeof global.ParameterStore>;
    expect(await isPortalV3EnabledServer()).toBe(true);
  });

  it("fails closed when ParameterStore is unavailable", async () => {
    expect(await isPortalV3EnabledServer()).toBe(false);
  });

  it("returns true when LOCAL_DEV_PORTAL_V3_ENABLED=true in development", async () => {
    const orig = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      configurable: true,
    });
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    expect(await isPortalV3EnabledServer()).toBe(true);
    Object.defineProperty(process.env, "NODE_ENV", {
      value: orig,
      configurable: true,
    });
  });
});
