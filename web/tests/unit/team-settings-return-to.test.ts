import {
  getTeamSettingsHref,
  getTeamSettingsReturnTo,
} from "@/lib/team-settings-return-to";

// #region Test Data
const teamId = "team_1";
const overview = `/teams/${teamId}`;
// #endregion

// #region valid return destination
describe("team settings return destination [valid path]", () => {
  it("preserves an app route and its query parameters", () => {
    const returnTo = `/teams/${teamId}/apps/app_1/configuration?tab=store`;

    expect(getTeamSettingsReturnTo({ teamId, returnTo })).toBe(returnTo);
    expect(getTeamSettingsHref({ teamId, returnTo })).toBe(
      `/teams/${teamId}/settings?returnTo=%2Fteams%2F${teamId}%2Fapps%2Fapp_1%2Fconfiguration%3Ftab%3Dstore`,
    );
  });
});
// #endregion

// #region fallback return destination
describe("team settings return destination [fallbacks]", () => {
  it("falls back to the team overview without a return path", () => {
    expect(getTeamSettingsReturnTo({ teamId, returnTo: null })).toBe(overview);
  });

  it("keeps the overview as an explicit return destination", () => {
    expect(getTeamSettingsHref({ teamId, returnTo: overview })).toBe(
      `/teams/${teamId}/settings?returnTo=%2Fteams%2F${teamId}`,
    );
  });

  it.each(["https://example.com", "//example.com", "not-a-path"])(
    "rejects malformed or external return paths: %s",
    (returnTo) => {
      expect(getTeamSettingsReturnTo({ teamId, returnTo })).toBe(overview);
    },
  );

  it("rejects a return path for another team", () => {
    expect(
      getTeamSettingsReturnTo({
        teamId,
        returnTo: "/teams/team_2/apps/app_1/configuration",
      }),
    ).toBe(overview);
  });

  it("rejects Team Settings itself as a return path", () => {
    expect(
      getTeamSettingsReturnTo({
        teamId,
        returnTo: `/teams/${teamId}/settings/security`,
      }),
    ).toBe(overview);
  });
});
// #endregion
