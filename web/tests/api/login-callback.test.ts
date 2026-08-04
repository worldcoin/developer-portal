import { NextRequest } from "next/server";

// #region Mocks
const getSession = jest.fn();
const updateSession = jest.fn();
const FetchEmailUser = jest.fn();
const FetchNullifierUser = jest.fn();
const Invite = jest.fn();
const AcceptTeamInvite = jest.fn();
const UpdateUser = jest.fn();

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

jest.mock("../../api/login-callback/graphql/fetch-invite.generated", () => ({
  getSdk: () => ({ Invite }),
}));

jest.mock(
  "../../api/login-callback/graphql/accept-team-invite.generated",
  () => ({
    getSdk: () => ({ AcceptTeamInvite }),
  }),
);

jest.mock("../../api/login-callback/graphql/update-user.generated", () => ({
  getSdk: () => ({ UpdateUser }),
}));

jest.mock("../../api/helpers/utils", () => ({
  getAppUrlFromRequest: jest.fn().mockResolvedValue("http://localhost:3000"),
}));

jest.mock("../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { loginCallback } from "@/api/login-callback";

// #region Test Data
const USER_ID = "usr_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const sessionUser = {
  sub: "email|ada",
  email: "ada@example.com",
  email_verified: true,
  // Auth0's `name` for email connections is the email address.
  name: "ada@example.com",
};

const makeDbUser = (overrides?: Record<string, unknown>) => ({
  id: USER_ID,
  email: "ada@example.com",
  name: "Ada Byron",
  auth0Id: "email|ada",
  posthog_id: null,
  is_allow_tracking: false,
  memberships: [],
  ...overrides,
});

const makeRequest = () =>
  ({
    nextUrl: new URL("/login-callback", "http://localhost:3000"),
  }) as unknown as NextRequest;

const setDbUser = (user: Record<string, unknown>) =>
  FetchEmailUser.mockResolvedValue({
    userByAuth0Id: [user],
    userByEmail: [user],
  });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getSession.mockResolvedValue({ user: sessionUser });
  updateSession.mockResolvedValue(undefined);
  UpdateUser.mockResolvedValue({ update_user_by_pk: makeDbUser() });
});

// #region Auth0 -> Hasura attribute sync
describe("login-callback [display name sync]", () => {
  it("keeps the user's display name when Auth0 sends a different name", async () => {
    setDbUser(makeDbUser());

    await loginCallback(makeRequest());

    expect(UpdateUser).not.toHaveBeenCalled();
  });

  it("seeds the name from Auth0 when the row has none", async () => {
    setDbUser(makeDbUser({ name: "" }));

    await loginCallback(makeRequest());

    expect(UpdateUser).toHaveBeenCalledWith({
      id: USER_ID,
      _set: { name: "ada@example.com" },
    });
  });

  it("syncs a changed email without touching the display name", async () => {
    setDbUser(makeDbUser({ email: "old@example.com" }));

    await loginCallback(makeRequest());

    expect(UpdateUser).toHaveBeenCalledWith({
      id: USER_ID,
      _set: { email: "ada@example.com" },
    });
  });
});
// #endregion
