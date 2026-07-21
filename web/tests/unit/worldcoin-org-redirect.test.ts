// Exercises the real `redirects()` from next.config.mjs against Next's own
// route-matching internals (source regex + host `has` + destination building),
// so the worldcoin.org -> world.org sunset redirect is validated end-to-end
// without spinning up a server. The key guarantees under test: UI paths move to
// world.org while /api/* and /.well-known/* stay on worldcoin.org (so API and
// OIDC consumers keep working), host matching is anchored per env, and there is
// no redirect loop back from world.org.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pathToRegexp } = require("next/dist/compiled/path-to-regexp");
const {
  matchHas,
  prepareDestination,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require("next/dist/shared/lib/router/utils/prepare-destination");

type Redirect = {
  source: string;
  destination: string;
  permanent?: boolean;
  has?: Array<{ type: string; key?: string; value?: string }>;
};

type Resolved = {
  status: number;
  location: string;
};

let redirects: Redirect[];

beforeAll(async () => {
  const mod = await import("../../next.config.mjs");
  redirects = (await (mod as any).default.redirects()) as Redirect[];
});

// Applies the configured redirects to a request the way Next does: first rule
// whose source path AND `has` conditions match wins. Returns undefined when no
// rule matches (i.e. the request is served normally).
const resolve = (
  host: string,
  pathname: string,
  query: Record<string, string> = {},
): Resolved | undefined => {
  for (const rule of redirects) {
    const keys: Array<{ name: string | number }> = [];
    const re = pathToRegexp(rule.source, keys);
    const match = re.exec(pathname);
    if (!match) continue;

    const pathParams: Record<string, string> = {};
    keys.forEach((key, i) => {
      const value = match[i + 1];
      if (value !== undefined) pathParams[String(key.name)] = value;
    });

    let hasParams: Record<string, string> = {};
    if (rule.has) {
      const req = { headers: { host } } as any;
      const res = matchHas(req, query, rule.has);
      if (!res) continue;
      hasParams = res;
    }

    const { parsedDestination } = prepareDestination({
      appDir: true,
      destination: rule.destination,
      params: { ...pathParams, ...hasParams },
      query,
    });

    const search = new URLSearchParams(query).toString();
    const location = `${parsedDestination.protocol}//${parsedDestination.hostname}${parsedDestination.pathname}${search ? `?${search}` : ""}`;

    return { status: rule.permanent ? 308 : 307, location };
  }

  return undefined;
};

// #region UI paths redirect to world.org
describe("worldcoin.org portal sunset [UI paths]", () => {
  it("redirects the root with a permanent 308", () => {
    expect(resolve("developer.worldcoin.org", "/")).toEqual({
      status: 308,
      location: "https://developer.world.org/",
    });
  });

  it("redirects a deep multi-segment UI path, preserving the path", () => {
    expect(
      resolve("developer.worldcoin.org", "/teams/abc/apps/def/configuration"),
    ).toEqual({
      status: 308,
      location: "https://developer.world.org/teams/abc/apps/def/configuration",
    });
  });

  it("preserves the query string", () => {
    expect(
      resolve("developer.worldcoin.org", "/join", { invite_id: "xyz" }),
    ).toEqual({
      status: 308,
      location: "https://developer.world.org/join?invite_id=xyz",
    });
  });

  it("maps the staging host to its own world.org sibling (anchored)", () => {
    expect(resolve("staging-developer.worldcoin.org", "/login")).toEqual({
      status: 308,
      location: "https://staging-developer.world.org/login",
    });
  });
});
// #endregion

// #region API and OIDC stay on worldcoin.org
describe("worldcoin.org portal sunset [API/OIDC excluded]", () => {
  it("does not redirect /api/* (POST verify etc. keep working)", () => {
    expect(
      resolve("developer.worldcoin.org", "/api/v4/verify/app_123"),
    ).toBeUndefined();
  });

  it("does not redirect the API health endpoint", () => {
    expect(
      resolve("developer.worldcoin.org", "/api/health"),
    ).toBeUndefined();
  });

  it("does not redirect /.well-known/* (OIDC discovery)", () => {
    expect(
      resolve(
        "developer.worldcoin.org",
        "/.well-known/openid-configuration",
      ),
    ).toBeUndefined();
  });
});
// #endregion

// #region hosts that must not be touched
describe("worldcoin.org portal sunset [non-matching hosts]", () => {
  it("does not redirect the already-migrated world.org host (no loop)", () => {
    expect(resolve("developer.world.org", "/teams/abc")).toBeUndefined();
  });

  it("does not redirect internal *.staging-internal.worldcoin.org hosts", () => {
    expect(
      resolve("developer.staging-internal.worldcoin.org", "/"),
    ).toBeUndefined();
  });

  it("does not redirect the retired dev-developer host", () => {
    expect(resolve("dev-developer.worldcoin.org", "/login")).toBeUndefined();
  });
});
// #endregion
