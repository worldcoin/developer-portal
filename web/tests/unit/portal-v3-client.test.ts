import { isPortalV3Enabled } from "@/lib/feature-flags/portal-v3/client";

describe("isPortalV3Enabled (client)", () => {
  it("returns false before the config is fetched", () => {
    expect(
      isPortalV3Enabled(
        { isFetched: false, enabledTeams: ["team_123"] },
        "team_123",
      ),
    ).toBe(false);
  });

  it("returns false when teamId is missing", () => {
    expect(
      isPortalV3Enabled(
        { isFetched: true, enabledTeams: ["team_123"] },
        undefined,
      ),
    ).toBe(false);
  });

  it("returns true when fetched and the team is enabled", () => {
    expect(
      isPortalV3Enabled(
        { isFetched: true, enabledTeams: ["team_123"] },
        "team_123",
      ),
    ).toBe(true);
  });
});
