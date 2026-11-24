import {
  getPortalAppContext,
  getPortalReturnTo,
  isTeamSettingsPath,
  resolvePortalReturnTo,
  resolveTeamSettingsTab,
  TEAM_SETTINGS_TABS,
} from "@/lib/team-settings";
import { urls } from "@/lib/urls";

// #region return_to validation
describe("Team settings return_to validation", () => {
  it("accepts and normalizes a Developer Portal path", () => {
    expect(
      getPortalReturnTo("/teams/team_1/apps/app_1/../app_2?tab=actions#top"),
    ).toBe("/teams/team_1/apps/app_2?tab=actions#top");
  });

  it.each([
    undefined,
    ["/teams/team_1"],
    "https://evil.example/teams/team_1",
    "//evil.example/teams/team_1",
    "/\\evil.example/teams/team_1",
    "javascript:alert(1)",
  ])("rejects a non-portal return target: %p", (returnTo) => {
    expect(getPortalReturnTo(returnTo)).toBeNull();
    expect(resolvePortalReturnTo(returnTo)).toBe("/dashboard");
  });

  it("recovers app context only for a validated matching-team app route", () => {
    expect(
      getPortalAppContext(
        "/teams/team_1/apps/app_1/configuration?view=review",
        "team_1",
      ),
    ).toEqual({ teamId: "team_1", appId: "app_1" });
    expect(
      getPortalAppContext("/teams/team_2/apps/app_1/configuration", "team_1"),
    ).toBeNull();
    expect(
      getPortalAppContext("/teams/team_1/apps/%E0%A4%A/configuration"),
    ).toBeNull();
  });
});
// #endregion

// #region route and tab helpers
describe("Team settings route helpers", () => {
  it("builds one settings route with encoded return and tab parameters", () => {
    expect(
      urls.teamSettings({
        team_id: "team_1",
        return_to: "/teams/team_1/apps/app_1?tab=actions",
        tab: TEAM_SETTINGS_TABS.Members,
      }),
    ).toBe(
      "/teams/team_1/settings?return_to=%2Fteams%2Fteam_1%2Fapps%2Fapp_1%3Ftab%3Dactions&tab=members",
    );
  });

  it.each([
    ["/teams/team_1/settings", true],
    ["/teams/team_1/settings/", true],
    ["/teams/team_1", false],
    ["/profile/settings", false],
  ])("classifies %s as team settings: %s", (pathname, expected) => {
    expect(isTeamSettingsPath(pathname)).toBe(expected);
  });

  it("keeps credentials owner/admin-only and defaults unknown tabs to General", () => {
    expect(resolveTeamSettingsTab(TEAM_SETTINGS_TABS.ApiKeys, true)).toBe(
      TEAM_SETTINGS_TABS.ApiKeys,
    );
    expect(resolveTeamSettingsTab(TEAM_SETTINGS_TABS.ApiKeys, false)).toBe(
      TEAM_SETTINGS_TABS.General,
    );
    expect(resolveTeamSettingsTab("unknown", true)).toBe(
      TEAM_SETTINGS_TABS.General,
    );
  });
});
// #endregion
