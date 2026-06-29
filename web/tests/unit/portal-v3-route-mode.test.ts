import {
  getPortalV3RouteMode,
  shouldRenderPortalV3Shell,
  type PortalV3RouteMode,
} from "@/lib/feature-flags/portal-v3/route-mode";

const TEAM = "team_abc";
const APP = "app_0123456789abcdef0123456789abcdef";

describe("getPortalV3RouteMode", () => {
  const cases: Array<[string, PortalV3RouteMode]> = [
    // public-exempt: kiosk is unauthenticated and must never mount v3
    [`/kiosk/${APP}/action_xyz`, "public-exempt"],
    [`/kiosk/${APP}`, "public-exempt"],

    // v2: API + anything outside the v3 migration
    ["/api/v2/something", "v2"],
    ["/api", "v2"],
    ["/", "v2"],
    ["/login", "v2"],

    // v3: every authenticated /teams route mounts the v3 shell. Compat
    // pages (actions, sign-in-with-world-id) and the legacy redirect aliases
    // (transactions, notifications) all fall through here; the v2-vs-v3 page
    // body is chosen by the per-route page shim, not by this classifier.
    [`/teams/${TEAM}`, "v3"],
    [`/teams/${TEAM}/apps/${APP}`, "v3"],
    [`/teams/${TEAM}/apps/${APP}/world-id-actions`, "v3"],
    [`/teams/${TEAM}/apps/${APP}/actions`, "v3"],
    [`/teams/${TEAM}/apps/${APP}/actions/create`, "v3"],
    [`/teams/${TEAM}/apps/${APP}/sign-in-with-world-id`, "v3"],
    [`/teams/${TEAM}/apps/${APP}/transactions`, "v3"],
    [`/teams/${TEAM}/apps/${APP}/notifications`, "v3"],

    // /profile/** renders v2 account pages inside the minimal v3 chrome
    // (ProfileLayoutV3, a close-X back to the app), so it mounts the v3 shell.
    [`/profile`, "v3"],
    [`/profile/teams`, "v3"],
  ];

  it.each(cases)("classifies %s as %s", (pathname, expected) => {
    expect(getPortalV3RouteMode(pathname)).toBe(expected);
  });

  // Purity: the query string is irrelevant to the mode.
  it("ignores the query string", () => {
    expect(
      getPortalV3RouteMode(
        `/teams/${TEAM}/apps/${APP}/actions?createAction=true`,
      ),
    ).toBe("v3");
    expect(getPortalV3RouteMode(`/teams/${TEAM}?foo=bar`)).toBe("v3");
    expect(getPortalV3RouteMode(`/kiosk/${APP}/a_1?x=1`)).toBe("public-exempt");
  });
});

describe("shouldRenderPortalV3Shell", () => {
  it("is true for every v3 route (incl. compat pages)", () => {
    expect(shouldRenderPortalV3Shell(`/teams/${TEAM}`)).toBe(true);
    // Compat pages still mount the shell; only the page body stays v2.
    expect(
      shouldRenderPortalV3Shell(`/teams/${TEAM}/apps/${APP}/actions`),
    ).toBe(true);
    // /profile mounts the minimal v3 account chrome.
    expect(shouldRenderPortalV3Shell("/profile")).toBe(true);
  });

  it("is false for public-exempt and v2 routes", () => {
    expect(shouldRenderPortalV3Shell(`/kiosk/${APP}/a_1`)).toBe(false);
    expect(shouldRenderPortalV3Shell("/api/v2/x")).toBe(false);
    expect(shouldRenderPortalV3Shell("/login")).toBe(false);
  });
});
