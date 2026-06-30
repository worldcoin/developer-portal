jest.mock("server-only", () => ({}));

import { isPortalV3EnabledForEmail } from "@/lib/feature-flags/portal-v3/flag";

const ORIGINAL = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("isPortalV3EnabledForEmail", () => {
  it("enables allow-listed emails only", () => {
    delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
    process.env.PORTAL_V3_EMAILS = "ada@example.com";

    expect(isPortalV3EnabledForEmail("ada@example.com")).toBe(true);
    expect(isPortalV3EnabledForEmail("bob@example.com")).toBe(false);
    expect(isPortalV3EnabledForEmail(undefined)).toBe(false);
  });

  it("ignores the global switch in production", () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = "production";
    process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";

    expect(isPortalV3EnabledForEmail("bob@example.com")).toBe(false);
  });
});
