/** @jest-environment node */
jest.mock("server-only", () => ({}));

const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: () => getSession() } }));

import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";

beforeEach(() => {
  process.env.PORTAL_V3_EMAILS = "ada@example.com";
  delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED;
  jest.clearAllMocks();
});

it("picks v3 for an allow-listed email", async () => {
  getSession.mockResolvedValue({ user: { email: "ada@example.com" } });
  expect(
    await pickPortalVersion(
      () => "v3",
      () => "v2",
    ),
  ).toBe("v3");
});

it("picks v2 with no session (kiosk / signed-out)", async () => {
  getSession.mockResolvedValue(null);
  expect(
    await pickPortalVersion(
      () => "v3",
      () => "v2",
    ),
  ).toBe("v2");
});
