import {
  getPortalV3RouteMode,
  shouldRenderPortalV3Page,
  shouldRenderPortalV3Shell,
} from "@/lib/feature-flags/portal-v3/route-mode";

describe("portal v3 route mode", () => {
  it.each([
    ["/teams/team_1", "v3-active"],
    ["/teams/team_1/apps", "v3-active"],
    ["/teams/team_1/apps/app_1", "v3-active"],
    ["/teams/team_1/apps/app_1/configuration", "v3-active"],
    ["/teams/team_1/apps/app_1/mini-app/permissions", "v3-active"],
    ["/teams/team_1/apps/app_1/world-id-4-0", "v3-active"],
    ["/teams/team_1/apps/app_1/world-id-actions", "v3-active"],
    ["/profile", "v3-active"],
    ["/profile/teams", "v3-active"],
    ["/teams/team_1/apps/app_1/actions", "v2-compat"],
    ["/teams/team_1/apps/app_1/actions/action_1/settings", "v2-compat"],
    ["/teams/team_1/apps/app_1/sign-in-with-world-id", "v2-compat"],
    [
      "/teams/team_1/apps/app_1/sign-in-with-world-id/proof-debugging",
      "v2-compat",
    ],
    ["/kiosk/app_1/action_1", "public-exempt"],
    ["/teams/team_1/apps/app_1/transactions", "redirect-alias"],
    ["/teams/team_1/apps/app_1/transactions/permissions", "redirect-alias"],
    ["/teams/team_1/apps/app_1/notifications", "redirect-alias"],
    ["/teams", "unbranched"],
    ["/api/auth/login", "unbranched"],
  ] as const)("classifies %s as %s", (pathname, expected) => {
    expect(getPortalV3RouteMode(pathname)).toBe(expected);
  });

  it("ignores query strings", () => {
    expect(
      getPortalV3RouteMode("/teams/team_1/apps/app_1?enableWorldId4=true"),
    ).toBe("v3-active");
  });

  it("classifies structurally without validating ids", () => {
    expect(getPortalV3RouteMode("/teams/not-a-team/apps/not-an-app")).toBe(
      "v3-active",
    );
  });

  it("renders the v3 shell for active and compatibility routes only", () => {
    expect(shouldRenderPortalV3Shell("/teams/team_1/apps/app_1")).toBe(true);
    expect(shouldRenderPortalV3Shell("/teams/team_1/apps/app_1/actions")).toBe(
      true,
    );
    expect(shouldRenderPortalV3Shell("/kiosk/app_1/action_1")).toBe(false);
    expect(shouldRenderPortalV3Shell("/teams")).toBe(false);
  });

  it("renders v3 page bodies only for v3-active routes", () => {
    expect(shouldRenderPortalV3Page("/teams/team_1/apps/app_1")).toBe(true);
    expect(shouldRenderPortalV3Page("/teams/team_1/apps/app_1/actions")).toBe(
      false,
    );
  });
});
