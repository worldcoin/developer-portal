// #region Mocks
jest.mock("server-only", () => ({}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const jwtVerify = jest.fn();
jest.mock("jose", () => ({
  createRemoteJWKSet: jest.fn(() => "mocked-jwks"),
  jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}));

const headersMock = jest.fn();
jest.mock("next/headers", () => ({
  headers: () => headersMock(),
}));

const notFoundError = new Error("NEXT_HTTP_ERROR_FALLBACK;404");
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw notFoundError;
  }),
}));
// #endregion

import {
  AdminRole,
  authenticateAdminRequest,
  requireAdminUser,
  resolveAdminAuthProvider,
  resolveAdminRole,
} from "@/lib/admin-auth";
import { cloudflareAccessAdminAuthProvider } from "@/lib/admin-auth/providers/cloudflare-access";
import { devAdminAuthProvider } from "@/lib/admin-auth/providers/dev";

// #region Test Data
const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

const setNodeEnv = (value: string) => {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
  });
};

const cloudflareEnv = () => {
  process.env.CF_ACCESS_TEAM_DOMAIN = "https://example.cloudflareaccess.com";
  process.env.CF_ACCESS_AUD = "test-aud";
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  setNodeEnv(ORIGINAL_NODE_ENV ?? "test");
  delete process.env.ADMIN_AUTH_PROVIDER;
  delete process.env.ADMIN_AUTH_GROUP_ROLES;
  delete process.env.ADMIN_AUTH_DEFAULT_ROLE;
  delete process.env.ADMIN_AUTH_DEV_EMAIL;
  delete process.env.ADMIN_AUTH_DEV_GROUPS;
  delete process.env.CF_ACCESS_TEAM_DOMAIN;
  delete process.env.CF_ACCESS_AUD;
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
  setNodeEnv(ORIGINAL_NODE_ENV ?? "test");
});

// #region Provider selection
describe("resolveAdminAuthProvider", () => {
  it("returns null when ADMIN_AUTH_PROVIDER is unset (fail closed)", () => {
    expect(resolveAdminAuthProvider()).toBeNull();
  });

  it("returns null for an unknown provider name", () => {
    process.env.ADMIN_AUTH_PROVIDER = "something-else";
    expect(resolveAdminAuthProvider()).toBeNull();
  });

  it("selects the configured provider by name", () => {
    process.env.ADMIN_AUTH_PROVIDER = "cloudflare-access";
    expect(resolveAdminAuthProvider()?.name).toBe("cloudflare-access");

    process.env.ADMIN_AUTH_PROVIDER = "dev";
    expect(resolveAdminAuthProvider()?.name).toBe("dev");
  });
});
// #endregion

// #region Role resolution
describe("resolveAdminRole", () => {
  it("maps a group to its configured role", () => {
    process.env.ADMIN_AUTH_GROUP_ROLES = JSON.stringify({
      "Team All": "readonly",
    });

    expect(resolveAdminRole(["Team All"])).toBe(AdminRole.Readonly);
  });

  it("picks the most privileged role when several groups match", () => {
    process.env.ADMIN_AUTH_GROUP_ROLES = JSON.stringify({
      "Team All": "readonly",
      "Dashboard Admins": "admin",
    });

    expect(resolveAdminRole(["Team All", "Dashboard Admins"])).toBe(
      AdminRole.Admin,
    );
  });

  it("falls back to ADMIN_AUTH_DEFAULT_ROLE when no group matches", () => {
    process.env.ADMIN_AUTH_GROUP_ROLES = JSON.stringify({
      "Dashboard Admins": "admin",
    });
    process.env.ADMIN_AUTH_DEFAULT_ROLE = "readonly";

    expect(resolveAdminRole(["Unmapped Group"])).toBe(AdminRole.Readonly);
  });

  it("denies when no group matches and there is no default role", () => {
    expect(resolveAdminRole(["Unmapped Group"])).toBeNull();
  });

  it("ignores invalid mapping JSON and invalid role values", () => {
    process.env.ADMIN_AUTH_GROUP_ROLES = "not-json";
    expect(resolveAdminRole(["Team All"])).toBeNull();

    process.env.ADMIN_AUTH_GROUP_ROLES = JSON.stringify({
      "Team All": "superuser",
    });
    expect(resolveAdminRole(["Team All"])).toBeNull();
  });

  it("denies when ADMIN_AUTH_DEFAULT_ROLE is not a known role", () => {
    process.env.ADMIN_AUTH_DEFAULT_ROLE = "root";
    expect(resolveAdminRole([])).toBeNull();
  });
});
// #endregion

// #region Cloudflare Access provider
describe("cloudflare-access provider", () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  const mockIdentityResponse = (body: unknown, ok = true) => {
    fetchMock.mockResolvedValue({
      ok,
      status: ok ? 200 : 403,
      json: async () => body,
    });
  };

  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    // Default: get-identity unavailable, provider falls back to token groups
    fetchMock.mockRejectedValue(new Error("get-identity unavailable"));
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("returns null when the assertion header is missing", async () => {
    cloudflareEnv();

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers(),
    );

    expect(identity).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("returns null when CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD are not configured", async () => {
    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "some-token" }),
    );

    expect(identity).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("returns null when JWT verification fails", async () => {
    cloudflareEnv();
    jwtVerify.mockRejectedValue(new Error("bad signature"));

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "tampered-token" }),
    );

    expect(identity).toBeNull();
  });

  it("returns null when the verified payload has no email/sub", async () => {
    cloudflareEnv();
    jwtVerify.mockResolvedValue({ payload: { sub: "user-1" } });

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "valid-token" }),
    );

    expect(identity).toBeNull();
  });

  it("returns the identity for a valid token and passes iss/aud constraints", async () => {
    cloudflareEnv();
    jwtVerify.mockResolvedValue({
      payload: {
        email: "user@example.com",
        sub: "user-1",
        groups: ["example-readers", 42],
      },
    });

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "valid-token" }),
    );

    expect(identity).toEqual({
      email: "user@example.com",
      subject: "user-1",
      groups: ["example-readers"],
    });
    expect(jwtVerify).toHaveBeenCalledWith("valid-token", "mocked-jwks", {
      issuer: "https://example.cloudflareaccess.com",
      audience: "test-aud",
    });
  });

  it("prefers full group membership from the get-identity endpoint", async () => {
    cloudflareEnv();
    jwtVerify.mockResolvedValue({
      payload: { email: "user@example.com", sub: "user-1" },
    });
    mockIdentityResponse({
      email: "user@example.com",
      groups: ["example-readers"],
      idp: { type: "okta", groups: ["example-readers", "example-admins"] },
    });

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "valid-token" }),
    );

    expect(identity).toMatchObject({
      groups: ["example-readers", "example-admins"],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.cloudflareaccess.com/cdn-cgi/access/get-identity",
      expect.objectContaining({
        headers: { cookie: "CF_Authorization=valid-token" },
      }),
    );
  });

  it("falls back to the token's custom claim groups when get-identity fails", async () => {
    cloudflareEnv();
    jwtVerify.mockResolvedValue({
      payload: {
        email: "user@example.com",
        sub: "user-1",
        custom: { groups: ["example-admins"] },
      },
    });

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "valid-token" }),
    );

    expect(identity).toMatchObject({ groups: ["example-admins"] });
  });

  it("falls back to token groups when get-identity returns a non-OK status", async () => {
    cloudflareEnv();
    jwtVerify.mockResolvedValue({
      payload: { email: "user@example.com", sub: "user-1" },
    });
    mockIdentityResponse({ error: "forbidden" }, false);

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "valid-token" }),
    );

    expect(identity).toMatchObject({ groups: [] });
  });

  it("returns empty groups when neither get-identity nor the token carry any", async () => {
    cloudflareEnv();
    jwtVerify.mockResolvedValue({
      payload: { email: "user@example.com", sub: "user-1" },
    });

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "valid-token" }),
    );

    expect(identity).toMatchObject({ groups: [] });
  });
});
// #endregion

// #region Dev provider
describe("dev provider", () => {
  it("authenticates from the debug header outside production", async () => {
    const identity = await devAdminAuthProvider.authenticate(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(identity).toEqual({
      email: "dev@example.com",
      subject: "dev:dev@example.com",
      groups: [],
    });
  });

  it("falls back to ADMIN_AUTH_DEV_EMAIL and returns null without any email", async () => {
    process.env.ADMIN_AUTH_DEV_EMAIL = "env@example.com";
    expect(
      (await devAdminAuthProvider.authenticate(new Headers()))?.email,
    ).toBe("env@example.com");

    delete process.env.ADMIN_AUTH_DEV_EMAIL;
    delete process.env.ADMIN_AUTH_DEV_GROUPS;
    expect(await devAdminAuthProvider.authenticate(new Headers())).toBeNull();
  });

  it("reads group membership from ADMIN_AUTH_DEV_GROUPS", async () => {
    process.env.ADMIN_AUTH_DEV_EMAIL = "dev@example.com";
    process.env.ADMIN_AUTH_DEV_GROUPS = "Team All";

    expect(
      await devAdminAuthProvider.authenticate(new Headers()),
    ).toMatchObject({
      groups: ["Team All"],
    });
  });

  it("is hard-disabled in production even when configured", async () => {
    setNodeEnv("production");
    process.env.ADMIN_AUTH_DEV_EMAIL = "env@example.com";

    const identity = await devAdminAuthProvider.authenticate(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(identity).toBeNull();
  });
});
// #endregion

// #region End-to-end authentication
describe("authenticateAdminRequest", () => {
  it("denies when no provider is configured", async () => {
    process.env.ADMIN_AUTH_DEFAULT_ROLE = "admin";

    const user = await authenticateAdminRequest(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(user).toBeNull();
  });

  it("denies an authenticated identity that resolves no role", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";

    const user = await authenticateAdminRequest(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(user).toBeNull();
  });

  it("returns the admin user with the resolved role", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";
    process.env.ADMIN_AUTH_DEFAULT_ROLE = "readonly";

    const user = await authenticateAdminRequest(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(user).toEqual({
      email: "dev@example.com",
      subject: "dev:dev@example.com",
      groups: [],
      role: AdminRole.Readonly,
    });
  });
});
// #endregion

// #region Page gate
describe("requireAdminUser", () => {
  it("throws notFound() for unauthenticated requests", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";
    headersMock.mockResolvedValue(new Headers());

    await expect(requireAdminUser()).rejects.toThrow(notFoundError);
  });

  it("returns the admin user when the request is authenticated", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";
    process.env.ADMIN_AUTH_DEFAULT_ROLE = "admin";
    headersMock.mockResolvedValue(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    await expect(requireAdminUser()).resolves.toEqual({
      email: "dev@example.com",
      subject: "dev:dev@example.com",
      groups: [],
      role: AdminRole.Admin,
    });
  });
});
// #endregion
