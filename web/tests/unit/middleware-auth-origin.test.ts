import { NextRequest, NextResponse } from "next/server";
import { InvalidConfigurationError } from "@auth0/nextjs-auth0/errors";

// #region Mocks
// The Auth0 SDK ships ESM-only, which jest (ts-jest, node_modules untransformed)
// can't load — so mock the errors entrypoint with a minimal class (defined inside
// the factory, since jest forbids out-of-scope references). The import above and
// middleware.ts both resolve to this same mock, so `new InvalidConfigurationError()`
// and middleware's `instanceof` check agree — as they do in production, where the
// SDK throws the very class it re-exports from this entrypoint.
jest.mock("@auth0/nextjs-auth0/errors", () => {
  class InvalidConfigurationError extends Error {}
  return { InvalidConfigurationError };
});

// Mock the Auth0 client so the real Auth0Client (server-only, env-dependent) is
// never constructed and we can drive auth0.middleware()'s outcome per test.
const auth0Middleware = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: {
    middleware: (...args: unknown[]) => auth0Middleware(...args),
    getSession: jest.fn(),
  },
}));

import { middleware } from "../../middleware";
// #endregion

const CANONICAL = "https://developer.worldcoin.org";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.APP_BASE_URL = CANONICAL;
});

// #region appBaseUrl allow-list miss → graceful canonical redirect
describe("middleware [auth route on a non-allow-listed origin]", () => {
  it("redirects /api/auth/* to the canonical host instead of 500ing", async () => {
    auth0Middleware.mockRejectedValue(
      new InvalidConfigurationError(
        "APP_BASE_URL configuration does not contain a match for the current request origin.",
      ),
    );

    const req = new NextRequest(
      "https://developer.staging-internal.worldcoin.org/api/auth/login?returnTo=%2Fteams",
    );
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      `${CANONICAL}/api/auth/login?returnTo=%2Fteams`,
    );
  });

  it("re-throws InvalidConfigurationError for a non-auth path (no silent swallow)", async () => {
    auth0Middleware.mockRejectedValue(
      new InvalidConfigurationError("does not contain a match"),
    );

    const req = new NextRequest(
      "https://developer.staging-internal.worldcoin.org/teams/abc",
    );
    await expect(middleware(req)).rejects.toThrow(InvalidConfigurationError);
  });

  it("re-throws unrelated errors on auth paths", async () => {
    auth0Middleware.mockRejectedValue(new Error("boom"));

    const req = new NextRequest(`${CANONICAL}/api/auth/login`);
    await expect(middleware(req)).rejects.toThrow("boom");
  });

  it("re-throws when APP_BASE_URL is unset (no canonical target to redirect to)", async () => {
    delete process.env.APP_BASE_URL;
    auth0Middleware.mockRejectedValue(
      new InvalidConfigurationError("does not contain a match"),
    );

    const req = new NextRequest(`${CANONICAL}/api/auth/login`);
    await expect(middleware(req)).rejects.toThrow(InvalidConfigurationError);
  });

  it("re-throws (no self-redirect) when the request is already on the canonical origin", async () => {
    // A throw on the canonical origin can't be the origin-mismatch case the
    // redirect targets, so surface it rather than redirecting canonical->canonical.
    auth0Middleware.mockRejectedValue(
      new InvalidConfigurationError("does not contain a match"),
    );

    const req = new NextRequest(`${CANONICAL}/api/auth/login`);
    await expect(middleware(req)).rejects.toThrow(InvalidConfigurationError);
  });

  it("does not redirect to an attacker host when the path escapes /api/auth/", async () => {
    // A host-escaping URL yields a pathname that does NOT start with /api/auth/,
    // so the guard re-throws instead of emitting a Location on the attacker origin.
    auth0Middleware.mockRejectedValue(
      new InvalidConfigurationError("does not contain a match"),
    );

    const req = new NextRequest(
      "https://developer.staging-internal.worldcoin.org//evil.com/api/auth/login",
    );
    await expect(middleware(req)).rejects.toThrow(InvalidConfigurationError);
  });
});
// #endregion

// #region proxy header normalization (so legitimate public-host logins match)
describe("middleware [forwarded-header normalization in allow-list mode]", () => {
  it("forces https and strips :80 so a sibling-host login matches the allow-list", async () => {
    const sdkRes = NextResponse.json({ ok: true });
    auth0Middleware.mockResolvedValue(sdkRes);

    // The proxy forwards http + a :80-suffixed host on otherwise-HTTPS traffic.
    const req = new NextRequest("https://developer.world.org/api/auth/login", {
      headers: {
        "x-forwarded-proto": "http",
        "x-forwarded-host": "developer.world.org:80",
      },
    });
    const res = await middleware(req);

    // No redirect: the SDK accepted the normalized request.
    expect(res).toBe(sdkRes);
    const handed = auth0Middleware.mock.calls[0][0] as NextRequest;
    expect(handed.headers.get("x-forwarded-proto")).toBe("https");
    expect(handed.headers.get("x-forwarded-host")).toBe("developer.world.org");
  });

  it("uses only the first forwarded host when a proxy appends to X-Forwarded-Host", async () => {
    const sdkRes = NextResponse.json({ ok: true });
    auth0Middleware.mockResolvedValue(sdkRes);

    const req = new NextRequest("https://developer.world.org/api/auth/login", {
      headers: {
        "x-forwarded-proto": "http",
        "x-forwarded-host": "developer.world.org:80, proxy.internal",
      },
    });
    const res = await middleware(req);

    expect(res).toBe(sdkRes);
    const handed = auth0Middleware.mock.calls[0][0] as NextRequest;
    expect(handed.headers.get("x-forwarded-proto")).toBe("https");
    // First value, trimmed, port-stripped — matches the allow-list entry the SDK reads.
    expect(handed.headers.get("x-forwarded-host")).toBe("developer.world.org");
  });
});
// #endregion

// #region happy path passthrough
describe("middleware [auth route, allow-listed origin]", () => {
  it("returns the SDK auth response directly for /api/auth/*", async () => {
    const sdkRes = NextResponse.json({ ok: true });
    auth0Middleware.mockResolvedValue(sdkRes);

    const req = new NextRequest(`${CANONICAL}/api/auth/login`);
    const res = await middleware(req);

    expect(res).toBe(sdkRes);
    expect(auth0Middleware).toHaveBeenCalledTimes(1);
  });
});
// #endregion
