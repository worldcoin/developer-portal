// #region Mocks
jest.mock("server-only", () => ({}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));
// #endregion

import { GET } from "@/api/admin/me";
import { NextRequest } from "next/server";

// #region Test Data
const createRequest = (requestHeaders?: Record<string, string>) =>
  new NextRequest("http://localhost/api/admin/me", {
    headers: requestHeaders,
  });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ADMIN_AUTH_PROVIDER;
  delete process.env.ADMIN_AUTH_GROUP_ROLES;
  delete process.env.ADMIN_AUTH_DEFAULT_ROLE;
  delete process.env.ADMIN_AUTH_DEV_EMAIL;
});

// #region /api/admin/me
describe("/api/admin/me", () => {
  it("returns 401 when no admin auth provider is configured", async () => {
    process.env.ADMIN_AUTH_DEFAULT_ROLE = "readonly";

    const res = await GET(
      createRequest({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the request is unauthenticated", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";
    process.env.ADMIN_AUTH_DEFAULT_ROLE = "readonly";

    const res = await GET(createRequest());

    expect(res.status).toBe(401);
  });

  it("returns the email and role of the authenticated admin", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";
    process.env.ADMIN_AUTH_DEFAULT_ROLE = "readonly";

    const res = await GET(
      createRequest({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      email: "dev@example.com",
      role: "readonly",
    });
  });
});
// #endregion
