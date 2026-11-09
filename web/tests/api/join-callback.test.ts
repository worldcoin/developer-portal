import { POST } from "@/api/join-callback";
import { NextRequest } from "next/server";

// #region Mocks
const getSession = jest.fn();
const updateSession = jest.fn();
const GetInviteById = jest.fn();
const FetchEmailUser = jest.fn();
const FetchNullifierUser = jest.fn();
const InsertUser = jest.fn();
const AcceptTeamInvite = jest.fn();
const sendAcceptance = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: (...args: unknown[]) => getSession(...args),
    updateSession: (...args: unknown[]) => updateSession(...args),
  },
  toSessionRequest: (req: unknown) => req,
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../api/join-callback/graphql/get-invite-by-id.generated", () => ({
  getSdk: () => ({ GetInviteById }),
}));

jest.mock(
  "../../api/login-callback/graphql/fetch-email-user.generated",
  () => ({
    getSdk: () => ({ FetchEmailUser }),
  }),
);

jest.mock(
  "../../api/login-callback/graphql/fetch-nullifier-user.generated",
  () => ({
    getSdk: () => ({ FetchNullifierUser }),
  }),
);

jest.mock("../../api/join-callback/graphql/insert-user.generated", () => ({
  getSdk: () => ({ InsertUser }),
}));

jest.mock(
  "../../api/join-callback/graphql/accept-team-invite.generated",
  () => ({
    getSdk: () => ({ AcceptTeamInvite }),
  }),
);

jest.mock("../../lib/ironclad-activity-api", () => ({
  IroncladActivityApi: jest.fn().mockImplementation(() => ({
    sendAcceptance: (...args: unknown[]) => sendAcceptance(...args),
  })),
}));

jest.mock("../../services/posthogClient", () => ({
  captureEvent: jest.fn(),
}));

jest.mock("../../api/helpers/utils", () => ({
  getAppUrlFromRequest: jest.fn().mockResolvedValue("http://localhost:3000"),
}));

jest.mock("../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const TEAM_ID = "team_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const USER_ID = "usr_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const INVITE_ID = `inv_${"a".repeat(43)}`;
const EMAIL = "invitee@example.com";
const sessionUser = {
  sub: "email|invitee",
  email: EMAIL,
  email_verified: true,
  name: "Invitee",
};
const portalUser = {
  id: USER_ID,
  email: EMAIL,
  auth0Id: sessionUser.sub,
  memberships: [],
};
const team = { id: TEAM_ID, name: "Inviting team" };

const createMockRequest = () =>
  new NextRequest("http://localhost:3000/api/join-callback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ invite_id: INVITE_ID }),
  });

const expectNoJoinSideEffects = () => {
  expect(FetchEmailUser).not.toHaveBeenCalled();
  expect(FetchNullifierUser).not.toHaveBeenCalled();
  expect(sendAcceptance).not.toHaveBeenCalled();
  expect(InsertUser).not.toHaveBeenCalled();
  expect(AcceptTeamInvite).not.toHaveBeenCalled();
  expect(updateSession).not.toHaveBeenCalled();
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getSession.mockResolvedValue({ user: sessionUser });
  GetInviteById.mockResolvedValue({
    invite: {
      id: INVITE_ID,
      email: EMAIL,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      team,
    },
  });
  FetchEmailUser.mockResolvedValue({
    userByAuth0Id: [portalUser],
    userByEmail: [],
  });
  AcceptTeamInvite.mockResolvedValue({
    accept_team_invite: [
      { team_id: TEAM_ID, role: "MEMBER", team, user: portalUser },
    ],
  });
});

// #region Invite email authorization
describe("/api/join-callback [invite email authorization]", () => {
  it.each([
    ["World ID session", { sub: "oauth2|worldcoin|0x123" }],
    ["unverified email", { ...sessionUser, email_verified: false }],
    [
      "missing verification claim",
      { ...sessionUser, email_verified: undefined },
    ],
    ["missing email", { ...sessionUser, email: undefined }],
    ["blank email", { ...sessionUser, email: "  " }],
  ])("rejects a %s before any join side effects", async (_, user) => {
    getSession.mockResolvedValue({ user });

    const response = await POST(createMockRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invite_email_verification_required" }),
    );
    expectNoJoinSideEffects();
  });

  it("rejects a verified email belonging to a different recipient", async () => {
    getSession.mockResolvedValue({
      user: { ...sessionUser, email: "someone-else@example.com" },
    });

    const response = await POST(createMockRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invite_email_mismatch" }),
    );
    expectNoJoinSideEffects();
  });

  it.each(["email|invitee", "auth0|invitee"])(
    "accepts a matching verified email for %s ignoring case and whitespace",
    async (sub) => {
      getSession.mockResolvedValue({
        user: { ...sessionUser, sub, email: "  INVITEE@EXAMPLE.COM  " },
      });

      const response = await POST(createMockRequest());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ returnTo: `/teams/${TEAM_ID}` });
      expect(AcceptTeamInvite).toHaveBeenCalledWith({
        team_id: TEAM_ID,
        user_id: USER_ID,
        invite_id: INVITE_ID,
      });
      expect(updateSession).toHaveBeenCalledTimes(1);
    },
  );
});
// #endregion
