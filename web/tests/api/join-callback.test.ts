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

// #region Invite membership checks
describe("/api/join-callback [invite membership checks]", () => {
  it.each(["MEMBER", "ADMIN", "OWNER"])(
    "rejects a World ID user who is already a team %s",
    async (role) => {
      getSession.mockResolvedValue({ user: { sub: "oauth2|worldcoin|0x123" } });
      FetchNullifierUser.mockResolvedValue({
        user: [{ ...portalUser, memberships: [{ team, role }] }],
      });

      const response = await POST(createMockRequest());

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual(
        expect.objectContaining({ code: "already_in_team", team_id: TEAM_ID }),
      );
      expectNoJoinSideEffects();
    },
  );

  it.each(["email|invitee", "auth0|invitee"])(
    "rejects an existing membership for %s",
    async (sub) => {
      getSession.mockResolvedValue({ user: { ...sessionUser, sub } });
      FetchEmailUser.mockResolvedValue({
        userByAuth0Id: [
          { ...portalUser, memberships: [{ team, role: "MEMBER" }] },
        ],
        userByEmail: [],
      });

      const response = await POST(createMockRequest());

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual(
        expect.objectContaining({ code: "already_in_team" }),
      );
      expectNoJoinSideEffects();
    },
  );

  it("allows a World ID user in another team despite stale session memberships", async () => {
    getSession.mockResolvedValue({
      user: {
        sub: "oauth2|worldcoin|0x123",
        hasura: { ...portalUser, memberships: [{ team, role: "OWNER" }] },
      },
    });
    FetchNullifierUser.mockResolvedValue({
      user: [
        {
          ...portalUser,
          memberships: [
            {
              team: { id: "team_cccccccccccccccccccccccccccccccc" },
              role: "OWNER",
            },
          ],
        },
      ],
    });

    const response = await POST(createMockRequest());

    expect(response.status).toBe(200);
    expect(AcceptTeamInvite).toHaveBeenCalledWith({
      team_id: TEAM_ID,
      user_id: USER_ID,
      invite_id: INVITE_ID,
    });
    expect(InsertUser).not.toHaveBeenCalled();
    expect(updateSession).toHaveBeenCalledTimes(1);
  });

  it("does not consume the invite if the membership lookup fails", async () => {
    FetchEmailUser.mockRejectedValueOnce(new Error("GraphQL unavailable"));

    const response = await POST(createMockRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "server_error" }),
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
