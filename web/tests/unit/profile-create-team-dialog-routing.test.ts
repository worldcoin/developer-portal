import {
  CREATE_TEAM_DIALOG_URL,
  getCreateTeamDialogStateUrl,
} from "@/scenes/PortalV3/Profile/page/CreateTeamDialog/dialogRouting";

// #region Dialog URL state
describe("profile create-team dialog routing", () => {
  it("opens on the consolidated profile route", () => {
    expect(CREATE_TEAM_DIALOG_URL).toBe("/profile?createTeam=true");
  });

  it("preserves unrelated query parameters when opening and closing", () => {
    const searchParams = new URLSearchParams("source=sidebar");

    expect(getCreateTeamDialogStateUrl("/profile", searchParams, true)).toBe(
      "/profile?source=sidebar&createTeam=true",
    );

    searchParams.set("createTeam", "true");
    expect(getCreateTeamDialogStateUrl("/profile", searchParams, false)).toBe(
      "/profile?source=sidebar",
    );
  });
});
// #endregion
