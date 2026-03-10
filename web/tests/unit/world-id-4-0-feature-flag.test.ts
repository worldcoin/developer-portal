import {
  WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN,
  isWorldId40EnabledForTeam,
} from "@/lib/feature-flags/world-id-4-0/common";

describe("World ID 4.0 feature flag team gating", () => {
  test("returns false when teamId is missing", () => {
    expect(isWorldId40EnabledForTeam(["team_123"], undefined)).toBe(false);
  });

  test("returns false when enabled teams list is empty", () => {
    expect(isWorldId40EnabledForTeam([], "team_123")).toBe(false);
  });

  test("returns true when team id is explicitly enabled", () => {
    expect(isWorldId40EnabledForTeam(["team_123"], "team_123")).toBe(true);
  });

  test("returns true when enable_all_teams token is present", () => {
    expect(
      isWorldId40EnabledForTeam(
        [WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN],
        "team_123",
      ),
    ).toBe(true);
  });

  test("supports whitespace around list entries", () => {
    expect(
      isWorldId40EnabledForTeam(
        [" team_abc ", ` ${WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN} `],
        "team_999",
      ),
    ).toBe(true);
  });
});
