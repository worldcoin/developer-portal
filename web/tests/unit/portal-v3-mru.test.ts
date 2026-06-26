import {
  mruAppForTeam,
  parseMruCookie,
  resolveLandingApp,
  withMruApp,
} from "@/lib/portal-v3/mru";

// #region resolveLandingApp
describe("resolveLandingApp", () => {
  const apps = [
    { id: "app_old", created_at: "2026-01-01T00:00:00Z" },
    { id: "app_new", created_at: "2026-06-01T00:00:00Z" },
  ];

  it("lands on the MRU app when it still exists in the team", () => {
    expect(resolveLandingApp({ apps, mruAppId: "app_old" })).toEqual({
      type: "app",
      appId: "app_old",
    });
  });

  it("falls back to the most-recently-created app when the MRU is stale", () => {
    expect(resolveLandingApp({ apps, mruAppId: "app_deleted" })).toEqual({
      type: "app",
      appId: "app_new",
    });
  });

  it("falls back to most-recently-created when there is no MRU", () => {
    expect(resolveLandingApp({ apps })).toEqual({
      type: "app",
      appId: "app_new",
    });
  });

  it("lands on the grid when the team has no apps", () => {
    expect(resolveLandingApp({ apps: [], mruAppId: "app_old" })).toEqual({
      type: "grid",
    });
  });
});
// #endregion

// #region cookie helpers
describe("MRU cookie helpers", () => {
  it("returns an empty map for missing or garbage cookies", () => {
    expect(parseMruCookie(undefined)).toEqual({});
    expect(parseMruCookie("not json")).toEqual({});
    expect(parseMruCookie("[1,2,3]")).toEqual({});
  });

  it("keeps only string values", () => {
    expect(parseMruCookie('{"team_1":"app_1","team_2":5}')).toEqual({
      team_1: "app_1",
    });
  });

  it("reads the MRU app for a team", () => {
    const raw = '{"team_1":"app_1"}';
    expect(mruAppForTeam(raw, "team_1")).toBe("app_1");
    expect(mruAppForTeam(raw, "team_2")).toBeUndefined();
  });

  it("sets a team's MRU app without dropping other teams", () => {
    const next = withMruApp('{"team_1":"app_1"}', "team_2", "app_2");
    expect(JSON.parse(next)).toEqual({ team_1: "app_1", team_2: "app_2" });
  });

  it("overwrites the same team's MRU app", () => {
    const next = withMruApp('{"team_1":"app_1"}', "team_1", "app_x");
    expect(JSON.parse(next)).toEqual({ team_1: "app_x" });
  });
});
// #endregion
