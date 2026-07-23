import { featureFlags } from "@/lib/feature-flags";
import { getFlagClient } from "@/lib/feature-flags/openfeature/provider";

const { getSandboxTeamIds } = featureFlags.worldIdSandbox;

beforeEach(() => {
  process.env.WORLD_ID_SANDBOX_TEAM_IDS = "team_allowed_a, team_allowed_b";
  delete process.env.LOCAL_DEV_WORLD_ID_SANDBOX_ENABLED;
});

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

  it("denies everyone when the env var is unset", async () => {
    delete process.env.WORLD_ID_SANDBOX_TEAM_IDS;
    expect(
      await getSandboxTeamIds(["team_allowed_a"], "dev@example.com"),
    ).toEqual([]);
  });

  it("returns every membership when the local/dev switch is on", async () => {
    process.env.LOCAL_DEV_WORLD_ID_SANDBOX_ENABLED = "true";
    delete process.env.WORLD_ID_SANDBOX_TEAM_IDS;

    await expect(
      getSandboxTeamIds(["team_allowed_a", "team_other"], "dev@example.com"),
    ).resolves.toEqual(["team_allowed_a", "team_other"]);
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
