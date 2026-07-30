import {
  parsePortalContext,
  selectPreferredAppId,
  selectPreferredTeamId,
  serializePortalContext,
} from "@/lib/portal-context";

// #region Test Data
const USER_ID = "usr_11111111111111111111111111111111";
const OTHER_USER_ID = "usr_22222222222222222222222222222222";
const TEAM_A_ID = "team_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TEAM_B_ID = "team_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const APP_ID = "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
// #endregion

// #region Cookie parsing
describe("portal context serialization", () => {
  it("round-trips a valid context", () => {
    const context = {
      userId: USER_ID,
      teamId: TEAM_B_ID,
      appId: APP_ID,
    };

    expect(parsePortalContext(serializePortalContext(context))).toEqual(
      context,
    );
  });

  it("ignores malformed or incomplete cookie values", () => {
    expect(parsePortalContext("%not-json")).toBeUndefined();
    expect(
      parsePortalContext(
        encodeURIComponent(JSON.stringify({ teamId: TEAM_A_ID })),
      ),
    ).toBeUndefined();
  });
});
// #endregion

// #region User and membership boundaries
describe("portal context selection", () => {
  it("selects the remembered team only for the same user and membership", () => {
    const context = {
      userId: USER_ID,
      teamId: TEAM_B_ID,
      appId: APP_ID,
    };

    expect(
      selectPreferredTeamId({
        context,
        userId: USER_ID,
        teamIds: [TEAM_A_ID, TEAM_B_ID],
      }),
    ).toBe(TEAM_B_ID);
    expect(
      selectPreferredTeamId({
        context,
        userId: OTHER_USER_ID,
        teamIds: [TEAM_A_ID, TEAM_B_ID],
      }),
    ).toBe(TEAM_A_ID);
    expect(
      selectPreferredTeamId({
        context,
        userId: USER_ID,
        teamIds: [TEAM_A_ID],
      }),
    ).toBe(TEAM_A_ID);
  });

  it("returns the remembered app only for its user and team", () => {
    const context = {
      userId: USER_ID,
      teamId: TEAM_B_ID,
      appId: APP_ID,
    };

    expect(
      selectPreferredAppId({
        context,
        userId: USER_ID,
        teamId: TEAM_B_ID,
      }),
    ).toBe(APP_ID);
    expect(
      selectPreferredAppId({
        context,
        userId: USER_ID,
        teamId: TEAM_A_ID,
      }),
    ).toBeUndefined();
  });
});
// #endregion
