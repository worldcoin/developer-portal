/** @jest-environment node */
jest.mock("server-only", () => ({}));

const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));

import { isPortalV3ForSession } from "@/lib/feature-flags/portal-v3/activation";

const ORIGINAL = { ...process.env };
beforeEach(() => {
  process.env = { ...ORIGINAL };
  delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
  process.env.PORTAL_V3_EMAILS = "ada@example.com";
  jest.clearAllMocks();
});

it("true for an allow-listed email", async () => {
  getSession.mockResolvedValue({ user: { email: "ada@example.com" } });
  expect(await isPortalV3ForSession()).toBe(true);
});

it("false for a non-listed email", async () => {
  getSession.mockResolvedValue({ user: { email: "bob@example.com" } });
  expect(await isPortalV3ForSession()).toBe(false);
});

it("false when there is no session", async () => {
  getSession.mockResolvedValue(null);
  expect(await isPortalV3ForSession()).toBe(false);
});

it("true for everyone when the global switch is on", async () => {
  process.env.LOCAL_DEV_PORTAL_V3_ENABLED = "true";
  getSession.mockResolvedValue({ user: { email: "bob@example.com" } });
  expect(await isPortalV3ForSession()).toBe(true);
});
