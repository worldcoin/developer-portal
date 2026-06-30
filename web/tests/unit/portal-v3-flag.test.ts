// #region Mocks
jest.mock("server-only", () => ({}));
// #endregion

import {
  isPortalV3Enabled,
  isPortalV3EnabledForEmail,
} from "@/lib/feature-flags/portal-v3/flag";

const ORIGINAL = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("isPortalV3Enabled (global)", () => {
  it("is true only for the exact string 'true'", () => {
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    expect(isPortalV3Enabled()).toBe(true);
  });

  it("is false when unset or any other value", () => {
    delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
    expect(isPortalV3Enabled()).toBe(false);
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "1";
    expect(isPortalV3Enabled()).toBe(false);
  });
});

describe("isPortalV3EnabledForEmail", () => {
  beforeEach(() => {
    delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
    process.env.PORTAL_V3_EMAILS = "dev@tools.com, Ada@Example.com";
  });

  it("enables an allow-listed email (case-insensitive, trimmed)", () => {
    expect(isPortalV3EnabledForEmail("ada@example.com")).toBe(true);
    expect(isPortalV3EnabledForEmail("dev@tools.com")).toBe(true);
  });

  it("rejects a non-listed email", () => {
    expect(isPortalV3EnabledForEmail("nope@example.com")).toBe(false);
  });

  it("rejects missing email", () => {
    expect(isPortalV3EnabledForEmail(undefined)).toBe(false);
    expect(isPortalV3EnabledForEmail(null)).toBe(false);
  });

  it("the global flag forces it on for everyone", () => {
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
    process.env.PORTAL_V3_EMAILS = "";
    expect(isPortalV3EnabledForEmail("anyone@example.com")).toBe(true);
    expect(isPortalV3EnabledForEmail(undefined)).toBe(true);
  });
});
