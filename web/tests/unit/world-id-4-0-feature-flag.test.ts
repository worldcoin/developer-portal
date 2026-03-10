import {
  WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN,
  isLegacyActionsEditableForTeam,
  isWorldId40EnabledForTeam,
} from "@/lib/feature-flags/world-id-4-0/common";

describe("World ID 4.0 feature flag team gating", () => {
  const originalAppEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const originalLegacyActionsEditableTeamIds =
    process.env.NEXT_PUBLIC_LEGACY_ACTIONS_EDITABLE_TEAM_IDS;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_ENV = originalAppEnv;
    process.env.NEXT_PUBLIC_LEGACY_ACTIONS_EDITABLE_TEAM_IDS =
      originalLegacyActionsEditableTeamIds;
  });

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

  test("returns true when the team is on the legacy edit env allowlist", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "dev";
    process.env.NEXT_PUBLIC_LEGACY_ACTIONS_EDITABLE_TEAM_IDS =
      "team_legacy_edit";

    expect(isLegacyActionsEditableForTeam("team_legacy_edit")).toBe(true);
  });

  test("returns false when the team is not on the legacy edit env allowlist", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "dev";
    process.env.NEXT_PUBLIC_LEGACY_ACTIONS_EDITABLE_TEAM_IDS = "team_other";

    expect(isLegacyActionsEditableForTeam("team_not_allowlisted")).toBe(false);
  });
});
