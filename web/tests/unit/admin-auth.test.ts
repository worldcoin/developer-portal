// #region Mocks
jest.mock("server-only", () => ({}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const jwtVerify = jest.fn();
const createRemoteJWKSet = jest.fn(
  (url: URL) => `mocked-jwks:${url.toString()}`,
);
jest.mock("jose", () => ({
  createRemoteJWKSet: (url: URL) => createRemoteJWKSet(url),
  jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}));

const headersMock = jest.fn();
jest.mock("next/headers", () => ({
  headers: () => headersMock(),
}));

const redirectError = new Error("NEXT_REDIRECT");
const redirectMock = jest.fn((_: string) => {
  throw redirectError;
});
jest.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href),
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
import { logger } from "@/lib/logger";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

// #region Test Data
const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

const findAdminPageFiles = (directory: string): string[] => {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return findAdminPageFiles(path);
    }

    return entry.name === "page.tsx" ? [path] : [];
  });
};

const httpMethodExportPattern =
  /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/;

// Route handlers under `api/admin` are the files Next.js's `route.ts` wrappers
// re-export from (see `app/api/admin/**/route.ts`), so this is where the real
// auth check has to live. Generated GraphQL SDKs and non-handler helpers are
// skipped since they don't export HTTP methods and would produce false
// positives.
const findAdminApiRouteFiles = (directory: string): string[] => {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return findAdminApiRouteFiles(path);
    }

    if (
      !entry.name.endsWith(".ts") ||
      entry.name.endsWith(".generated.ts") ||
      entry.name.endsWith(".test.ts")
    ) {
      return [];
    }

    const contents = readFileSync(path, "utf8");
    return httpMethodExportPattern.test(contents) ? [path] : [];
  });
};

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
  delete process.env.ADMIN_AUTH_DEV_EMAIL;
  delete process.env.ADMIN_AUTH_DEV_GROUPS;
  delete process.env.CF_ACCESS_TEAM_DOMAIN;
  delete process.env.CF_ACCESS_AUD;
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
  setNodeEnv(ORIGINAL_NODE_ENV ?? "test");
});

// #region Admin page guardrail
describe("admin page guardrail", () => {
  it("requires every /admin page to call requireAdminUser", () => {
    const adminPageFiles = findAdminPageFiles(join(process.cwd(), "app/admin"));

    expect(adminPageFiles).toContain(join(process.cwd(), "app/admin/page.tsx"));

    const unguardedPageFiles = adminPageFiles
      .filter(
        (pageFile) =>
          !readFileSync(pageFile, "utf8").includes("requireAdminUser"),
      )
      .map((pageFile) => relative(process.cwd(), pageFile));

    expect(unguardedPageFiles).toEqual([]);
  });
});
// #endregion

// #region Admin API route guardrail
describe("admin API route guardrail", () => {
  it("requires every /api/admin route handler to call authenticateAdminRequest", () => {
    const adminApiRouteFiles = findAdminApiRouteFiles(
      join(process.cwd(), "api/admin"),
    );

    expect(adminApiRouteFiles).toContain(
      join(process.cwd(), "api/admin/me/index.ts"),
    );

    const unguardedRouteFiles = adminApiRouteFiles
      .filter(
        (routeFile) =>
          !readFileSync(routeFile, "utf8").includes("authenticateAdminRequest"),
      )
      .map((routeFile) => relative(process.cwd(), routeFile));

    expect(unguardedRouteFiles).toEqual([]);
  });
});
// #endregion

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

  it("falls back to readonly when no group matches", () => {
    process.env.ADMIN_AUTH_GROUP_ROLES = JSON.stringify({
      "Dashboard Admins": "admin",
    });

    expect(resolveAdminRole(["Unmapped Group"])).toBe(AdminRole.Readonly);
  });

  it("falls back to readonly when no group mapping is configured", () => {
    expect(resolveAdminRole(["Unmapped Group"])).toBe(AdminRole.Readonly);
  });

  it("ignores invalid mapping JSON and invalid role values", () => {
    process.env.ADMIN_AUTH_GROUP_ROLES = "not-json";
    expect(resolveAdminRole(["Team All"])).toBe(AdminRole.Readonly);

    process.env.ADMIN_AUTH_GROUP_ROLES = JSON.stringify({
      "Team All": "superuser",
    });
    expect(resolveAdminRole(["Team All"])).toBe(AdminRole.Readonly);
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
    const error = new Error("bad signature");
    error.name = "JWTInvalid";
    Object.assign(error, { code: "ERR_JWT_INVALID" });
    jwtVerify.mockRejectedValue(error);

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "tampered-token" }),
    );

    expect(identity).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "Cloudflare Access JWT verification failed",
      {
        name: "JWTInvalid",
        message: "bad signature",
        code: "ERR_JWT_INVALID",
      },
    );
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
    expect(jwtVerify).toHaveBeenCalledWith(
      "valid-token",
      "mocked-jwks:https://example.cloudflareaccess.com/cdn-cgi/access/certs",
      {
        issuer: "https://example.cloudflareaccess.com",
        audience: "test-aud",
      },
    );
  });

  it("caches Cloudflare JWK sets per team domain", async () => {
    jwtVerify.mockResolvedValue({
      payload: { email: "user@example.com", sub: "user-1" },
    });

    process.env.CF_ACCESS_AUD = "test-aud";

    process.env.CF_ACCESS_TEAM_DOMAIN = "https://first.cloudflareaccess.com";
    await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "first-token" }),
    );

    process.env.CF_ACCESS_TEAM_DOMAIN = "https://second.cloudflareaccess.com";
    await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "second-token" }),
    );

    process.env.CF_ACCESS_TEAM_DOMAIN = "https://first.cloudflareaccess.com";
    await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "third-token" }),
    );

    expect(createRemoteJWKSet).toHaveBeenCalledWith(
      new URL("https://first.cloudflareaccess.com/cdn-cgi/access/certs"),
    );
    expect(createRemoteJWKSet).toHaveBeenCalledWith(
      new URL("https://second.cloudflareaccess.com/cdn-cgi/access/certs"),
    );
    expect(createRemoteJWKSet).toHaveBeenCalledTimes(2);
    expect(jwtVerify).toHaveBeenNthCalledWith(
      1,
      "first-token",
      "mocked-jwks:https://first.cloudflareaccess.com/cdn-cgi/access/certs",
      expect.any(Object),
    );
    expect(jwtVerify).toHaveBeenNthCalledWith(
      2,
      "second-token",
      "mocked-jwks:https://second.cloudflareaccess.com/cdn-cgi/access/certs",
      expect.any(Object),
    );
    expect(jwtVerify).toHaveBeenNthCalledWith(
      3,
      "third-token",
      "mocked-jwks:https://first.cloudflareaccess.com/cdn-cgi/access/certs",
      expect.any(Object),
    );
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

  it("returns empty groups when get-identity returns malformed group fields", async () => {
    cloudflareEnv();
    jwtVerify.mockResolvedValue({
      payload: { email: "user@example.com", sub: "user-1" },
    });
    mockIdentityResponse({
      email: "user@example.com",
      groups: "example-readers",
      idp: { type: "okta", groups: { name: "example-admins" } },
    });

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "valid-token" }),
    );

    expect(identity).toMatchObject({ groups: [] });
  });

  it("treats a successful empty get-identity response as authoritative over token groups", async () => {
    cloudflareEnv();
    jwtVerify.mockResolvedValue({
      payload: {
        email: "user@example.com",
        sub: "user-1",
        custom: { groups: ["example-admins"] },
      },
    });
    mockIdentityResponse({
      email: "user@example.com",
      groups: [],
      idp: { type: "okta", groups: [] },
    });

    const identity = await cloudflareAccessAdminAuthProvider.authenticate(
      new Headers({ "cf-access-jwt-assertion": "valid-token" }),
    );

    expect(identity).toMatchObject({ groups: [] });
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
    const user = await authenticateAdminRequest(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(user).toBeNull();
  });

  it("returns the admin user with the default readonly role", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";

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

  it("returns the admin user with a group-mapped role", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";
    process.env.ADMIN_AUTH_GROUP_ROLES = JSON.stringify({
      "Dashboard Admins": "admin",
    });
    process.env.ADMIN_AUTH_DEV_GROUPS = "Dashboard Admins";

    const user = await authenticateAdminRequest(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    expect(user).toEqual({
      email: "dev@example.com",
      subject: "dev:dev@example.com",
      groups: ["Dashboard Admins"],
      role: AdminRole.Admin,
    });
  });
});
// #endregion

// #region Page gate
describe("requireAdminUser", () => {
  it("redirects unauthenticated requests to /unauthorized", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";
    headersMock.mockResolvedValue(new Headers());

    await expect(requireAdminUser()).rejects.toThrow(redirectError);
    expect(redirectMock).toHaveBeenCalledWith("/unauthorized");
  });

  it("returns the admin user when the request is authenticated", async () => {
    process.env.ADMIN_AUTH_PROVIDER = "dev";
    process.env.ADMIN_AUTH_GROUP_ROLES = JSON.stringify({
      "Dashboard Admins": "admin",
    });
    process.env.ADMIN_AUTH_DEV_GROUPS = "Dashboard Admins";
    headersMock.mockResolvedValue(
      new Headers({ "x-admin-auth-debug-user": "dev@example.com" }),
    );

    await expect(requireAdminUser()).resolves.toEqual({
      email: "dev@example.com",
      subject: "dev:dev@example.com",
      groups: ["Dashboard Admins"],
      role: AdminRole.Admin,
    });
  });
});
// #endregion
