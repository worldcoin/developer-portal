import {
  getPortalV3RouteMode,
  shouldRenderPortalV3Shell,
  type PortalV3RouteMode,
} from "@/lib/feature-flags/portal-v3/route-mode";

const TEAM = "team_abc";
const APP = "app_0123456789abcdef0123456789abcdef";

describe("getPortalV3RouteMode", () => {
  // One representative path per branch — not an exhaustive matrix.
  const cases: Array<[string, PortalV3RouteMode]> = [
    [`/kiosk/${APP}/action_xyz`, "public-exempt"], // kiosk: never v3
    ["/api/v2/something", "v2"], // API: never UI-branched
    ["/login", "v2"], // outside the v3 trees
    ["/teams", "v2"], // bare teams index (no team id) stays v2
    [`/teams/${TEAM}/apps/${APP}`, "v3"], // a team page mounts the shell
    [`/teams/${TEAM}/apps/${APP}/actions`, "v3"], // compat page falls through to v3
    ["/profile", "v3"], // account chrome
  ];

  it.each(cases)("classifies %s as %s", (pathname, expected) => {
    expect(getPortalV3RouteMode(pathname)).toBe(expected);
  });

  it("ignores the query string", () => {
    expect(getPortalV3RouteMode(`/teams/${TEAM}?foo=bar`)).toBe("v3");
    expect(getPortalV3RouteMode(`/kiosk/${APP}?x=1`)).toBe("public-exempt");
  });
});

describe("shouldRenderPortalV3Shell", () => {
  it("is true for v3 routes, false for kiosk/v2 routes", () => {
    expect(shouldRenderPortalV3Shell(`/teams/${TEAM}`)).toBe(true);
    expect(shouldRenderPortalV3Shell("/profile")).toBe(true);
    expect(shouldRenderPortalV3Shell(`/kiosk/${APP}`)).toBe(false);
    expect(shouldRenderPortalV3Shell("/api/v2/x")).toBe(false);
  });
});
