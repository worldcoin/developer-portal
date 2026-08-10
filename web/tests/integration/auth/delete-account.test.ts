import { deleteAccount } from "@/api/delete-account";
import { auth0 } from "@/lib/auth0";
import { Auth0User } from "@/lib/types";
import { NextRequest } from "next/server";

// #region Mocks
const validSessionUser = {
  email: "test@world.org",
  email_verified: true,
  sub: "email|1234567890",
  name: "Test User",
  nickname: "test",
  picture: "https://example.com/test.png",
  updated_at: "2022-01-01T00:00:00.000Z",
  sid: "1234567890",
} as Auth0User;

jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: jest.fn(),
    updateSession: jest.fn(),
  },
}));

const getSession = auth0.getSession as jest.Mock;

jest.mock("../../../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const usersDelete = jest.fn();

jest.mock("auth0", () => ({
  ManagementClient: jest.fn().mockImplementation(() => ({
    users: { delete: (...args: unknown[]) => usersDelete(...args) },
  })),
}));
// #endregion

// #region Test Data
const APP_ORIGIN = "http://localhost:3000";

const createMockRequest = (headers: Record<string, string> = {}) =>
  new NextRequest(`${APP_ORIGIN}/api/auth/delete-account`, {
    method: "POST",
    headers,
  });

const sameOriginRequest = () =>
  createMockRequest({ "sec-fetch-site": "same-origin" });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  usersDelete.mockResolvedValue(undefined);
  getSession.mockResolvedValue({ user: validSessionUser });
});

// #region Cross-site request rejection
// The session cookie is SameSite=Lax, so it rides along on any cross-site
// top-level navigation. These branches are what stops an attacker page from
// destroying a logged-in developer's Auth0 identity.
describe("/api/auth/delete-account [cross-site requests]", () => {
  it("rejects a request the browser reports as cross-site", async () => {
    const response = await deleteAccount(
      createMockRequest({ "sec-fetch-site": "cross-site" }),
    );

    expect(response.status).toEqual(403);
    expect((await response.json()).code).toEqual("cross_origin_request");
    expect(usersDelete).not.toHaveBeenCalled();
  });

  it("rejects a same-site request from a sibling subdomain", async () => {
    const response = await deleteAccount(
      createMockRequest({ "sec-fetch-site": "same-site" }),
    );

    expect(response.status).toEqual(403);
    expect(usersDelete).not.toHaveBeenCalled();
  });

  it("rejects a user-initiated top-level navigation", async () => {
    // `none` means the URL was typed/bookmarked rather than issued by our UI —
    // the shape a meta-refresh or `window.open` delivery lands as.
    const response = await deleteAccount(
      createMockRequest({ "sec-fetch-site": "none" }),
    );

    expect(response.status).toEqual(403);
    expect(usersDelete).not.toHaveBeenCalled();
  });

  it("fails closed when the request carries no origin metadata", async () => {
    const response = await deleteAccount(createMockRequest());

    expect(response.status).toEqual(403);
    expect(usersDelete).not.toHaveBeenCalled();
  });

  it("rejects a foreign Origin when Sec-Fetch-Site is absent", async () => {
    const response = await deleteAccount(
      createMockRequest({ origin: "https://evil.example" }),
    );

    expect(response.status).toEqual(403);
    expect(usersDelete).not.toHaveBeenCalled();
  });

  it("accepts a matching Origin when Sec-Fetch-Site is absent", async () => {
    const response = await deleteAccount(
      createMockRequest({ origin: APP_ORIGIN }),
    );

    expect(response.status).toEqual(204);
    expect(usersDelete).toHaveBeenCalledWith({ id: validSessionUser.sub });
  });
});
// #endregion

// #region Session and deletion outcomes
describe("/api/auth/delete-account [same-origin requests]", () => {
  it("returns 401 if session user id is not found", async () => {
    getSession.mockResolvedValue(null);

    const response = await deleteAccount(sameOriginRequest());

    expect(response.status).toEqual(401);
    expect((await response.json()).code).toEqual("unauthorized");
    expect(usersDelete).not.toHaveBeenCalled();
  });

  it("deletes the Auth0 identity and returns 204", async () => {
    const response = await deleteAccount(sameOriginRequest());

    expect(usersDelete).toHaveBeenCalledWith({ id: validSessionUser.sub });
    expect(response.status).toEqual(204);
    // The client, not the server, drives the logout navigation: a redirect here
    // would make the caller's fetch replay the POST against /api/auth/logout.
    expect(response.headers.get("location")).toBeNull();
  });

  it("surfaces a 500 when Auth0 rejects the deletion", async () => {
    usersDelete.mockRejectedValue(new Error("auth0 down"));

    const response = await deleteAccount(sameOriginRequest());

    expect(response.status).toEqual(500);
    expect((await response.json()).code).toEqual("internal_server_error");
  });
});
// #endregion
