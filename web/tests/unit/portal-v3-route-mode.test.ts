import {
  getPortalV3RouteMode,
  shouldRenderPortalV3Page,
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

    // unbranched: API + anything outside the branched trees
    ["/api/v2/something", "unbranched"],
    ["/api", "unbranched"],
    ["/", "unbranched"],
    ["/login", "unbranched"],

    // v2-compat: v2 body inside the v3 shell
    [`/teams/${TEAM}/apps/${APP}/actions`, "v2-compat"],
    [`/teams/${TEAM}/apps/${APP}/actions/create`, "v2-compat"],
    [`/teams/${TEAM}/apps/${APP}/sign-in-with-world-id`, "v2-compat"],

    // redirect-alias: old paths that will redirect into v3
    [`/teams/${TEAM}/apps/${APP}/transactions`, "redirect-alias"],
    [`/teams/${TEAM}/apps/${APP}/notifications`, "redirect-alias"],

    // v3-active: the new shell + new pages
    [`/teams/${TEAM}`, "v3-active"],
    [`/teams/${TEAM}/apps/${APP}`, "v3-active"],
    [`/teams/${TEAM}/apps/${APP}/world-id-actions`, "v3-active"],

    // /profile/** renders v2 account pages inside the minimal v3 chrome
    // (ProfileLayoutV3, a close-X back to the app), so it mounts the v3 shell.
    [`/profile`, "v3-active"],
    [`/profile/teams`, "v3-active"],
  ];

  it.each(cases)("classifies %s as %s", (pathname, expected) => {
    expect(getPortalV3RouteMode(pathname)).toBe(expected);
  });

  // The load-bearing trap: /world-id-actions ends in "actions" but is a v3
  // page, NOT v2-compat. /actions must only match the standalone segment.
  it("does NOT classify /world-id-actions as v2-compat", () => {
    expect(
      getPortalV3RouteMode(`/teams/${TEAM}/apps/${APP}/world-id-actions`),
    ).toBe("v3-active");
    expect(
      getPortalV3RouteMode(
        `/teams/${TEAM}/apps/${APP}/world-id-actions/action_1`,
      ),
    ).toBe("v3-active");
  });

  // Purity: the query string is irrelevant to the mode.
  it("ignores the query string", () => {
    expect(
      getPortalV3RouteMode(
        `/teams/${TEAM}/apps/${APP}/actions?createAction=true`,
      ),
    ).toBe("v2-compat");
    expect(getPortalV3RouteMode(`/teams/${TEAM}?foo=bar`)).toBe("v3-active");
    expect(getPortalV3RouteMode(`/kiosk/${APP}/a_1?x=1`)).toBe("public-exempt");
  });
});

describe("shouldRenderPortalV3Shell", () => {
  it("is true for v3-active and v2-compat", () => {
    expect(shouldRenderPortalV3Shell(`/teams/${TEAM}`)).toBe(true);
    expect(
      shouldRenderPortalV3Shell(`/teams/${TEAM}/apps/${APP}/actions`),
    ).toBe(true);
    // /profile mounts the minimal v3 account chrome.
    expect(shouldRenderPortalV3Shell("/profile")).toBe(true);
  });

  it("is false for public-exempt, redirect-alias, and unbranched", () => {
    expect(shouldRenderPortalV3Shell(`/kiosk/${APP}/a_1`)).toBe(false);
    expect(
      shouldRenderPortalV3Shell(`/teams/${TEAM}/apps/${APP}/transactions`),
    ).toBe(false);
    expect(shouldRenderPortalV3Shell("/api/v2/x")).toBe(false);
  });
});

describe("shouldRenderPortalV3Page", () => {
  it("is true only for v3-active", () => {
    expect(shouldRenderPortalV3Page(`/teams/${TEAM}/apps/${APP}`)).toBe(true);
  });

  it("is false for v2-compat (shell yes, page no)", () => {
    expect(shouldRenderPortalV3Page(`/teams/${TEAM}/apps/${APP}/actions`)).toBe(
      false,
    );
  });

  it("is false for public-exempt / redirect-alias / unbranched", () => {
    expect(shouldRenderPortalV3Page(`/kiosk/${APP}/a_1`)).toBe(false);
    expect(
      shouldRenderPortalV3Page(`/teams/${TEAM}/apps/${APP}/notifications`),
    ).toBe(false);
    expect(shouldRenderPortalV3Page("/api/x")).toBe(false);
  });
});
