// #region Mocks
jest.mock("@/lib/feature-flags/openfeature/sandbox-teams", () => ({
  SANDBOX_TEAMS: ["team_allowed_a", "team_allowed_b"],
}));
// #endregion

import {
  getFlagClient,
  getSandboxTeamIds,
} from "@/lib/feature-flags/openfeature/provider";

// #region sandbox-distribution flag resolution
describe("sandbox-distribution flag", () => {
  it("keeps only allowlisted teams", async () => {
    const result = await getSandboxTeamIds(
      ["team_allowed_a", "team_other", "team_allowed_b"],
      "dev@example.com",
    );
    expect(result).toEqual(["team_allowed_a", "team_allowed_b"]);
  });

  it("returns empty for a user with no allowlisted memberships", async () => {
    expect(await getSandboxTeamIds(["team_other"], "dev@example.com")).toEqual(
      [],
    );
    expect(await getSandboxTeamIds([], null)).toEqual([]);
  });

  it("denies when teamId context is missing", async () => {
    const value = await getFlagClient().getBooleanValue(
      "sandbox-distribution",
      false,
      { targetingKey: "dev@example.com" },
    );
    expect(value).toBe(false);
  });

  it("returns the caller default for unknown flag keys", async () => {
    const value = await getFlagClient().getBooleanValue(
      "does-not-exist",
      true,
      {
        targetingKey: "dev@example.com",
      },
    );
    expect(value).toBe(true);
  });
});
// #endregion
