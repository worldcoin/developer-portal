import { isPortalV3Enabled } from "@/lib/feature-flags/portal-v3";

describe("isPortalV3Enabled", () => {
  const previous = process.env.LOCAL_DEV_PORTAL_V3_ENABLED;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
    } else {
      process.env.LOCAL_DEV_PORTAL_V3_ENABLED = previous;
    }
  });

  it("is false when LOCAL_DEV_PORTAL_V3_ENABLED is unset", () => {
    delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
    expect(isPortalV3Enabled()).toBe(false);
  });

  it("is true only for the exact string true", () => {
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    expect(isPortalV3Enabled()).toBe(true);
  });

  it("is false for all other values", () => {
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "1";
    expect(isPortalV3Enabled()).toBe(false);

    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "TRUE";
    expect(isPortalV3Enabled()).toBe(false);
  });
});
