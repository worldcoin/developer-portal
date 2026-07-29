import { POST } from "@/api/update-session";
import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

// #region Mocks
const FetchUserForSession = jest.fn();

// Auth0 client (v4): the handler reads the session via `auth0.getSession` and
// writes it back via `auth0.updateSession`.
jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: jest.fn(),
    updateSession: jest.fn(),
  },
  toSessionRequest: (req: unknown) => req,
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock(
  "@/api/update-session/graphql/server/fetch-user-for-session.generated",
  () => ({
    getSdk: () => ({ FetchUserForSession }),
  }),
);

const getSession = auth0.getSession as jest.Mock;
const updateSession = auth0.updateSession as jest.Mock;
// #endregion

// #region Test Data
const DB_USER = {
  id: "123",
  name: "Real Name",
  email: "real@example.com",
  world_id_nullifier: "0xabc",
  posthog_id: "ph_123",
  is_allow_tracking: true,
  memberships: [
    { role: "OWNER", team: { id: "team_real", name: "Real Team" } },
  ],
};

const makeReq = (body: unknown) =>
  ({ json: () => Promise.resolve(body) }) as unknown as NextRequest;
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Server-authoritative session refresh
describe("/api/update-session [server-authoritative refresh]", () => {
  it("re-derives the session's hasura claims from the database, ignoring the request body", async () => {
    getSession.mockResolvedValue({ user: { hasura: { id: "123" } } });
    FetchUserForSession.mockResolvedValue({ user_by_pk: DB_USER });

    // Attacker posts a forged OWNER membership for a team they don't belong to.
    const response = await POST(
      makeReq({
        user: {
          id: "123",
          memberships: [
            { role: "OWNER", team: { id: "victim_team", name: "Victim" } },
          ],
        },
      }),
    );

    expect(FetchUserForSession).toHaveBeenCalledWith({ userId: "123" });
    expect(response.status).toBe(200);

    // The session is written with the DB-sourced claims, NOT the forged body.
    const writtenSession = updateSession.mock.calls[0][2];
    expect(writtenSession.user.hasura).toEqual(DB_USER);
    expect(writtenSession.user.hasura.memberships).toEqual(DB_USER.memberships);
  });

  it("authorizes by the verified session id, not the body's user.id", async () => {
    getSession.mockResolvedValue({ user: { hasura: { id: "123" } } });
    FetchUserForSession.mockResolvedValue({ user_by_pk: DB_USER });

    const response = await POST(makeReq({ user: { id: "someone_else" } }));

    expect(FetchUserForSession).toHaveBeenCalledWith({ userId: "123" });
    expect(response.status).toBe(200);
  });

  it("returns 401 when there is no session", async () => {
    getSession.mockResolvedValue(null);

    const response = await POST(makeReq({ user: { id: "123" } }));

    expect(response.status).toBe(401);
    expect(FetchUserForSession).not.toHaveBeenCalled();
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("returns 401 when no user row exists for the session id", async () => {
    getSession.mockResolvedValue({ user: { hasura: { id: "ghost" } } });
    FetchUserForSession.mockResolvedValue({ user_by_pk: null });

    const response = await POST(makeReq({ user: { id: "ghost" } }));

    expect(response.status).toBe(401);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("returns 500 when the database fetch fails", async () => {
    getSession.mockResolvedValue({ user: { hasura: { id: "123" } } });
    FetchUserForSession.mockRejectedValue(new Error("hasura down"));

    const response = await POST(makeReq({ user: { id: "123" } }));

    expect(response.status).toBe(500);
    expect(updateSession).not.toHaveBeenCalled();
  });
});
// #endregion
