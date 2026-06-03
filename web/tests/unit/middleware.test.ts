import { NextRequest } from "next/server";

// #region Mocks
// Mock the Auth0 edge module at the I/O boundary so the middleware module can
// be imported in a node test env and so `withMiddlewareAuthRequired` becomes a
// transparent passthrough we can assert against. We only care about the
// dispatcher + stale-action interceptor logic here, not the real auth flow.
//
// The factory creates the spy lazily on first call (the middleware module
// invokes `withMiddlewareAuthRequired()` at import time), and stores it on the
// mocked module so tests can read it back via `getAuthMiddlewareSpy()`.
jest.mock("@auth0/nextjs-auth0/edge", () => {
  const spy = jest.fn(async () => undefined);
  return {
    withMiddlewareAuthRequired: () => spy,
    getSession: jest.fn().mockResolvedValue(null),
    __authMiddlewareSpy: spy,
  };
});
// #endregion

// Import after mocks are registered.
import middleware from "../../middleware";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const authMiddlewareSpy: jest.Mock = (
  require("@auth0/nextjs-auth0/edge") as { __authMiddlewareSpy: jest.Mock }
).__authMiddlewareSpy;

// #region Test Data
const EVENT = {} as any;

const makeRequest = (
  url: string,
  init?: { method?: string; headers?: Record<string, string> },
) =>
  new NextRequest(new URL(url, "https://developer.worldcoin.org").toString(), {
    method: init?.method ?? "GET",
    headers: init?.headers,
  });

const MULTIPART = "multipart/form-data; boundary=----x";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region stale / bot Server-Action POSTs that would otherwise 500
describe("middleware [stale/bot Server-Action POSTs]", () => {
  it("short-circuits a multipart POST to an unmatched path with a clean 409", async () => {
    const res = await middleware(
      makeRequest("/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: { "content-type": MULTIPART },
      }),
      EVENT,
    );

    expect(res).toBeDefined();
    expect(res!.status).toBe(409);
    expect(res!.headers.get("x-stale-deployment")).toBe("1");
    expect(res!.headers.get("cache-control")).toBe("no-store");
    // Must not have invoked the auth machinery for a bot path.
    expect(authMiddlewareSpy).not.toHaveBeenCalled();
  });

  it("short-circuits a POST carrying a next-action header to an unmatched path", async () => {
    const res = await middleware(
      makeRequest("/index.php", {
        method: "POST",
        headers: { "next-action": "abc123", "content-type": "text/plain" },
      }),
      EVENT,
    );

    expect(res!.status).toBe(409);
    expect(res!.headers.get("x-stale-deployment")).toBe("1");
  });

  it("short-circuits even when the path starts with a real prefix (e.g. /api/...) but is a multipart bot probe", async () => {
    const res = await middleware(
      makeRequest("/api/files/extract-text", {
        method: "POST",
        headers: { "content-type": MULTIPART },
      }),
      EVENT,
    );

    expect(res!.status).toBe(409);
    expect(authMiddlewareSpy).not.toHaveBeenCalled();
  });
});
// #endregion

// #region real Server Actions must NOT be intercepted
describe("middleware [real Server Actions are not intercepted]", () => {
  it("passes through a real fetch Server Action POST (has next-router-state-tree) on a protected page", async () => {
    await middleware(
      makeRequest("/teams/team_123/apps/app_456/configuration", {
        method: "POST",
        headers: {
          "next-action": "realActionId",
          "next-router-state-tree": "%5B%22%22%2C...%5D",
          "content-type": "text/plain;charset=UTF-8",
        },
      }),
      EVENT,
    );

    // Not short-circuited (interceptor returns a 409 only for stale/bot POSTs);
    // instead the protected-path branch delegates to the auth middleware.
    expect(authMiddlewareSpy).toHaveBeenCalledTimes(1);
  });

  it("passes through a multipart POST that carries next-router-state-tree (defensive exemption)", async () => {
    await middleware(
      makeRequest("/teams/team_123/apps/app_456/configuration", {
        method: "POST",
        headers: {
          "content-type": MULTIPART,
          "next-router-state-tree": "%5B%22%22%5D",
        },
      }),
      EVENT,
    );

    // The router-state-tree header exempts it from interception; it reaches the
    // protected-path auth branch instead of getting a 409.
    expect(authMiddlewareSpy).toHaveBeenCalledTimes(1);
  });
});
// #endregion

// #region requests that should flow through untouched
describe("middleware [pass-through behaviour]", () => {
  it("does not intercept a GET to an unmatched path (genuine 404 page for browsers)", async () => {
    const res = await middleware(
      makeRequest("/some/random/path", { method: "GET" }),
      EVENT,
    );

    expect(res?.headers.get("x-stale-deployment")).toBeNull();
    expect(authMiddlewareSpy).not.toHaveBeenCalled();
  });

  it("does not intercept a bare urlencoded POST (Next serves a clean 404, not a 500)", async () => {
    const res = await middleware(
      makeRequest("/user/register", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
      EVENT,
    );

    expect(res?.headers.get("x-stale-deployment")).toBeNull();
    expect(authMiddlewareSpy).not.toHaveBeenCalled();
  });

  it("delegates a GET on a protected path to the auth middleware", async () => {
    await middleware(makeRequest("/teams/team_123", { method: "GET" }), EVENT);

    expect(authMiddlewareSpy).toHaveBeenCalledTimes(1);
  });

  it("does not run auth for a GET on a public path", async () => {
    await middleware(makeRequest("/login", { method: "GET" }), EVENT);

    expect(authMiddlewareSpy).not.toHaveBeenCalled();
  });
});
// #endregion
