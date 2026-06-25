import {
  PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN,
  isPortalV3EnabledForTeam,
} from "@/lib/feature-flags/portal-v3/common";

describe("portal-v3 team gating", () => {
  it("returns false when teamId is missing", () => {
    expect(isPortalV3EnabledForTeam(["team_123"], undefined)).toBe(false);
  });

  it("returns false when the enabled-teams list is empty", () => {
    expect(isPortalV3EnabledForTeam([], "team_123")).toBe(false);
  });

  it("returns false when the list is undefined (fail-closed)", () => {
    expect(isPortalV3EnabledForTeam(undefined, "team_123")).toBe(false);
  });

  it("returns true when the team id is explicitly enabled", () => {
    expect(isPortalV3EnabledForTeam(["team_123"], "team_123")).toBe(true);
  });

  it("trims whitespace on entries", () => {
    expect(isPortalV3EnabledForTeam([" team_123 "], "team_123")).toBe(true);
  });

  it("returns true when the enable_all_teams token is present", () => {
    expect(
      isPortalV3EnabledForTeam([PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN], "team_123"),
    ).toBe(true);
  });
});
