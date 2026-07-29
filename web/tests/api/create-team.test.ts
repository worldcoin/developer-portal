import { NextRequest } from "next/server";

// #region Mocks
const getSession = jest.fn();
const updateSession = jest.fn();
const GetUserByAuth0Id = jest.fn();
const InsertTeam = jest.fn();
const InsertUser = jest.fn();
const InsertMembership = jest.fn();
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

jest.mock("../../api/create-team/graphql/get-user-by-auth0id.generated", () => ({
  getSdk: () => ({ GetUserByAuth0Id }),
}));

jest.mock("../../api/create-team/graphql/insert-team.generated", () => ({
  getSdk: () => ({ InsertTeam }),
}));

jest.mock("../../api/create-team/graphql/insert-user.generated", () => ({
  getSdk: () => ({ InsertUser }),
}));

jest.mock("../../api/create-team/graphql/insert-membership.generated", () => ({
  getSdk: () => ({ InsertMembership }),
}));

jest.mock("../../lib/ironclad-activity-api", () => ({
  IroncladActivityApi: jest.fn().mockImplementation(() => ({
    sendAcceptance: (...args: unknown[]) => sendAcceptance(...args),
  })),
}));

jest.mock("../../services/posthogClient", () => ({
  captureEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../api/helpers/utils", () => ({
  getAppUrlFromRequest: jest
    .fn()
    .mockResolvedValue("http://localhost:3000"),
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

import { POST } from "@/api/create-team";

// #region Test Data
const TEAM_ID = "team_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const USER_ID = "usr_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const makeRequest = (body: unknown) =>
  ({
    json: () => Promise.resolve(body),
  }) as unknown as NextRequest;

const sessionUser = {
  email: "new@world.org",
  email_verified: true,
  sub: "email|new-user",
  name: "New User",
};

const membershipUser = {
  id: USER_ID,
  email: "new@world.org",
  name: "New User",
  auth0Id: "email|new-user",
  posthog_id: "ph_1",
  is_allow_tracking: null,
  memberships: [{ team: { id: TEAM_ID, name: "Acme" }, role: "OWNER" }],
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getSession.mockResolvedValue({ user: sessionUser });
  updateSession.mockResolvedValue(undefined);
  sendAcceptance.mockResolvedValue(undefined);
  GetUserByAuth0Id.mockResolvedValue({ user: [] });
  InsertTeam.mockResolvedValue({
    insert_team_one: { id: TEAM_ID, name: "Acme" },
  });
  InsertUser.mockResolvedValue({
    insert_user_one: { id: USER_ID, posthog_id: "ph_1" },
  });
  InsertMembership.mockResolvedValue({
    insert_membership_one: {
      team_id: TEAM_ID,
      role: "OWNER",
      user: membershipUser,
    },
  });
});

// #region /api/create-team [hasUser ignored]
describe("/api/create-team [hasUser ignored]", () => {
  it("creates the Hasura user when the client claims hasUser true but none exists", async () => {
    const res = await POST(
      makeRequest({ team_name: "Acme", hasUser: true }),
    );

    expect(res.status).toBe(200);
    expect(sendAcceptance).toHaveBeenCalled();
    expect(InsertUser).toHaveBeenCalled();
    expect(InsertMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        team_id: TEAM_ID,
        user_id: USER_ID,
      }),
    );
  });

  it("skips InsertUser when Hasura already has the auth0 user", async () => {
    GetUserByAuth0Id.mockResolvedValue({
      user: [{ id: USER_ID, auth0Id: "email|new-user" }],
    });
    getSession.mockResolvedValue({
      user: { ...sessionUser, hasura: { id: USER_ID } },
    });

    const res = await POST(
      makeRequest({ team_name: "Acme", hasUser: false }),
    );

    expect(res.status).toBe(200);
    expect(sendAcceptance).not.toHaveBeenCalled();
    expect(InsertUser).not.toHaveBeenCalled();
    expect(InsertMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        team_id: TEAM_ID,
        user_id: USER_ID,
      }),
    );
  });
});
// #endregion
