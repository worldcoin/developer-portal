import { NextRequest } from "next/server";

// #region Mocks
const getSession = jest.fn();
const updateSession = jest.fn();
const GetInviteById = jest.fn();
const FetchEmailUser = jest.fn();
const FetchNullifierUser = jest.fn();
const AcceptTeamInvite = jest.fn();
const InsertUser = jest.fn();
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
  "../../api/join-callback/graphql/accept-team-invite.generated",
  () => ({
    getSdk: () => ({ AcceptTeamInvite }),
  }),
);

jest.mock("../../api/join-callback/graphql/insert-user.generated", () => ({
  getSdk: () => ({ InsertUser }),
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

jest.mock("../../lib/ironclad-activity-api", () => ({
  IroncladActivityApi: jest.fn().mockImplementation(() => ({
    sendAcceptance: (...args: unknown[]) => sendAcceptance(...args),
  })),
}));

jest.mock("../../services/posthogClient", () => ({
  captureEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../api/helpers/utils", () => ({
  getAppUrlFromRequest: jest.fn().mockResolvedValue("http://localhost:3000"),
}));

jest.mock("next/headers", () => ({
  headers: () => ({
    [Symbol.iterator]: function* () {
      yield* [];
    },
    forEach: jest.fn(),
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock("../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/join-callback";

// #region Test Data
const TEAM_ID = "team_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const USER_ID = "usr_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const INVITE_ID = "inv_cccccccccccccccccccccccccccccccc";
const INVITED_EMAIL = "invited@world.org";

const createMockRequest = (body: unknown = { invite_id: INVITE_ID }) =>
  new NextRequest("http://localhost:3000/api/join-callback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify(body),
  });

/** An email-OTP session (`email|` sub) — the ordinary invitee. */
const emailSession = (overrides: Record<string, unknown> = {}) => ({
  user: {
    sub: "email|invited",
    name: "Invited User",
    email: INVITED_EMAIL,
    email_verified: true,
    ...overrides,
  },
});

/** A legacy username/password session (`auth0|` sub). */
const passwordSession = (overrides: Record<string, unknown> = {}) => ({
  user: {
    sub: "auth0|legacy-invited",
    name: "Legacy User",
    email: INVITED_EMAIL,
    email_verified: true,
    ...overrides,
  },
});

/** A Sign-in-with-World-ID (wallet) session — carries no email claim at all. */
const worldIdSession = () => ({
  user: {
    sub: "oauth2|worldcoin|0xdeadbeef",
    name: "Wallet User",
  },
});

const validInvite = {
  id: INVITE_ID,
  email: INVITED_EMAIL,
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  team: { id: TEAM_ID, name: "Target Team" },
};

const acceptedMembership = {
  team_id: TEAM_ID,
  role: "MEMBER",
  team: { id: TEAM_ID, name: "Target Team" },
  user: {
    id: USER_ID,
    email: INVITED_EMAIL,
    name: "Invited User",
    auth0Id: "email|invited",
    posthog_id: "ph_1",
    is_allow_tracking: true,
    memberships: [],
  },
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();

  GetInviteById.mockResolvedValue({ invite: validInvite });
  FetchEmailUser.mockResolvedValue({
    userByAuth0Id: [{ id: USER_ID }],
    userByEmail: [],
  });
  FetchNullifierUser.mockResolvedValue({ user: [{ id: USER_ID }] });
  AcceptTeamInvite.mockResolvedValue({
    accept_team_invite: [acceptedMembership],
  });
  updateSession.mockResolvedValue(undefined);
});

// #region Email-ownership guard (HackerOne #3967911)
describe("/api/join-callback [invite email ownership]", () => {
  it("accepts when the session holds the verified invited email", async () => {
    getSession.mockResolvedValue(emailSession());

    const response = await POST(createMockRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ returnTo: `/teams/${TEAM_ID}` });
    expect(AcceptTeamInvite).toHaveBeenCalledWith({
      team_id: TEAM_ID,
      user_id: USER_ID,
      invite_id: INVITE_ID,
    });
  });

  it("keeps working for a legacy username/password identity", async () => {
    getSession.mockResolvedValue(passwordSession());
    FetchEmailUser.mockResolvedValue({
      userByAuth0Id: [],
      userByEmail: [{ id: USER_ID }],
    });

    const response = await POST(createMockRequest());

    expect(response.status).toBe(200);
    expect(AcceptTeamInvite).toHaveBeenCalledTimes(1);
  });

  it("matches the invited email case- and whitespace-insensitively", async () => {
    getSession.mockResolvedValue(
      emailSession({ email: `  ${INVITED_EMAIL.toUpperCase()}  ` }),
    );

    const response = await POST(createMockRequest());

    expect(response.status).toBe(200);
    expect(AcceptTeamInvite).toHaveBeenCalledTimes(1);
  });

  it("refuses when the verified email is not the invited one", async () => {
    getSession.mockResolvedValue(emailSession({ email: "someone@else.org" }));

    const response = await POST(createMockRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invite_email_mismatch" }),
    );
    expect(AcceptTeamInvite).not.toHaveBeenCalled();
    expect(updateSession).not.toHaveBeenCalled();
  });

  // The reported bug: a wallet session has no email claim, so the old guard's
  // `auth0User.email && ...` conjunction was never reached and the join went
  // through unchecked.
  it("refuses a Sign-in-with-World-ID session, which has no email to prove", async () => {
    getSession.mockResolvedValue(worldIdSession());

    const response = await POST(createMockRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invite_requires_verified_email" }),
    );
    expect(AcceptTeamInvite).not.toHaveBeenCalled();
    expect(InsertUser).not.toHaveBeenCalled();
    expect(updateSession).not.toHaveBeenCalled();
  });

  // The same fail-open shape: an email identity Auth0 has not verified proves
  // nothing about who controls the address.
  it("refuses an email identity whose address Auth0 has not verified", async () => {
    getSession.mockResolvedValue(emailSession({ email_verified: false }));

    const response = await POST(createMockRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invite_requires_verified_email" }),
    );
    expect(AcceptTeamInvite).not.toHaveBeenCalled();
  });

  it("refuses an email identity carrying no address at all", async () => {
    getSession.mockResolvedValue(emailSession({ email: undefined }));

    const response = await POST(createMockRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invite_requires_verified_email" }),
    );
    expect(AcceptTeamInvite).not.toHaveBeenCalled();
  });

  // The ownership check must not become a way to probe which invites exist:
  // an expired or unknown invite is rejected before the session is inspected.
  it("rejects an expired invite before reaching the ownership check", async () => {
    getSession.mockResolvedValue(worldIdSession());
    GetInviteById.mockResolvedValue({
      invite: {
        ...validInvite,
        expires_at: new Date(Date.now() - 1000).toISOString(),
      },
    });

    const response = await POST(createMockRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invalid_invite" }),
    );
  });
});
// #endregion

// #region Guards that must keep holding around the new check
describe("/api/join-callback [request guards]", () => {
  it("rejects a cross-site request before touching the invite", async () => {
    getSession.mockResolvedValue(emailSession());

    const request = new NextRequest("http://localhost:3000/api/join-callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({ invite_id: INVITE_ID }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "cross_origin_request" }),
    );
    expect(GetInviteById).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    getSession.mockResolvedValue(null);

    const response = await POST(createMockRequest());

    expect(response.status).toBe(401);
    expect(GetInviteById).not.toHaveBeenCalled();
  });

  it("reports the invite as already used when it was consumed concurrently", async () => {
    getSession.mockResolvedValue(emailSession());
    AcceptTeamInvite.mockResolvedValue({ accept_team_invite: [] });

    const response = await POST(createMockRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ code: "invalid_invite" }),
    );
    expect(updateSession).not.toHaveBeenCalled();
  });
});
// #endregion
