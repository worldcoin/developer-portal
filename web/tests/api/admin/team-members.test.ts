import { AdminHasuraRole } from "@/lib/admin-auth/types";
import { logger } from "@/lib/logger";
import { GraphQLError } from "graphql";
import { ClientError } from "graphql-request";
import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const GetAddTeamMemberContext = jest.fn();
const AddTeamMember = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClientForUser: jest.fn().mockResolvedValue({}),
  getInternalDashboardWriteGraphqlClientForUser: jest
    .fn()
    .mockResolvedValue({}),
}));

jest.mock(
  "../../../api/admin/teams/[id]/members/graphql/get-add-team-member-context.generated",
  () => ({ getSdk: () => ({ GetAddTeamMemberContext }) }),
);

jest.mock(
  "../../../api/admin/teams/[id]/members/graphql/add-team-member.generated",
  () => ({ getSdk: () => ({ AddTeamMember }) }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/admin/teams/[id]/members";

// #region Test Data
const TEAM_ID = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const USER_ID = "usr_4b1f9c2e8d7a6b5c4d3e2f1a0b9c8d7e";
const EMAIL = "dev_user@example.com";
const admin = {
  email: "admin@example.com",
  role: AdminHasuraRole.Write,
  subject: "admin-subject",
};

const createRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/admin/teams/${TEAM_ID}/members`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const createContext = (id = TEAM_ID) => ({
  params: Promise.resolve({ id }),
});

const makeContext = (overrides: Record<string, unknown> = {}) => ({
  team: { id: TEAM_ID, deleted_at: null },
  user: [{ id: USER_ID, memberships: [] }],
  ...overrides,
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  authenticateAdminRequest.mockResolvedValue(admin);
  GetAddTeamMemberContext.mockResolvedValue(makeContext());
  AddTeamMember.mockResolvedValue({
    insert_membership: { affected_rows: 1 },
  });
});

// #region Success
describe("POST /api/admin/teams/[id]/members [success]", () => {
  it("adds the matching account with the requested role", async () => {
    const response = await POST(
      createRequest({ email: "  Dev_User@Example.com ", role: "ADMIN" }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, role: "ADMIN" });
    // Case is ignored, but `_` must match literally rather than as a wildcard.
    expect(GetAddTeamMemberContext).toHaveBeenCalledWith({
      team_id: TEAM_ID,
      email_pattern: "Dev\\_User@Example.com",
    });
    expect(AddTeamMember).toHaveBeenCalledWith({
      object: { team_id: TEAM_ID, user_id: USER_ID, role: "ADMIN" },
    });
  });
});
// #endregion

// #region Request validation
describe("POST /api/admin/teams/[id]/members [validation]", () => {
  it("rejects unauthenticated requests", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(GetAddTeamMemberContext).not.toHaveBeenCalled();
  });

  it("rejects dashboard readers before looking up the account", async () => {
    authenticateAdminRequest.mockResolvedValue({
      ...admin,
      role: AdminHasuraRole.Readonly,
    });

    const response = await POST(
      createRequest({ email: EMAIL, role: "ADMIN" }),
      createContext(),
    );

    expect(response.status).toBe(403);
    expect(GetAddTeamMemberContext).not.toHaveBeenCalled();
    expect(AddTeamMember).not.toHaveBeenCalled();
  });

  it("rejects unexpected request fields without logging the request", async () => {
    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER", extra: true }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      detail: "Unexpected request fields",
    });
    expect(GetAddTeamMemberContext).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("rejects a malformed team id", async () => {
    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext("team_bad-id;drop"),
    );

    expect(response.status).toBe(400);
    expect(GetAddTeamMemberContext).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(createRequest("not json"), createContext());

    expect(response.status).toBe(400);
    expect(GetAddTeamMemberContext).not.toHaveBeenCalled();
  });

  it("refuses to add anyone as OWNER", async () => {
    const response = await POST(
      createRequest({ email: EMAIL, role: "OWNER" }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "validation_error",
      attribute: "role",
    });
    expect(AddTeamMember).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const response = await POST(
      createRequest({ email: "not-an-email", role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ attribute: "email" });
    expect(GetAddTeamMemberContext).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Lookup outcomes
describe("POST /api/admin/teams/[id]/members [lookup outcomes]", () => {
  it("returns 404 when the team does not exist", async () => {
    GetAddTeamMemberContext.mockResolvedValue(makeContext({ team: null }));

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Team not found" });
    expect(AddTeamMember).not.toHaveBeenCalled();
  });

  it("refuses to add members to a deleted team", async () => {
    GetAddTeamMemberContext.mockResolvedValue(
      makeContext({
        team: { id: TEAM_ID, deleted_at: "2026-01-01T00:00:00.000Z" },
      }),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(AddTeamMember).not.toHaveBeenCalled();
  });

  it("returns 404 when no account uses the email", async () => {
    GetAddTeamMemberContext.mockResolvedValue(makeContext({ user: [] }));

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "No Developer Portal account uses this email",
    });
    expect(AddTeamMember).not.toHaveBeenCalled();
  });

  it("refuses when case variants of the email match more than one account", async () => {
    GetAddTeamMemberContext.mockResolvedValue(
      makeContext({
        user: [
          { id: USER_ID, memberships: [] },
          { id: "usr_other", memberships: [] },
        ],
      }),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "ADMIN" }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(AddTeamMember).not.toHaveBeenCalled();
  });

  it("refuses to add an account that is already a member", async () => {
    GetAddTeamMemberContext.mockResolvedValue(
      makeContext({ user: [{ id: USER_ID, memberships: [{ id: "memb_1" }] }] }),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "ADMIN" }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(AddTeamMember).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Dependency failures
describe("POST /api/admin/teams/[id]/members [dependency failures]", () => {
  it("returns 503 without logging the lookup's GraphQL variables", async () => {
    GetAddTeamMemberContext.mockRejectedValue(
      new ClientError(
        { status: 503, errors: [new GraphQLError("Hasura unavailable")] },
        {
          query: "GetAddTeamMemberContext",
          variables: { email_pattern: EMAIL },
        },
      ),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(AddTeamMember).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Admin add team member failed: lookup error",
      {
        adminSubject: admin.subject,
        teamId: TEAM_ID,
        role: "MEMBER",
        stage: "lookup",
        errorKind: "graphql",
      },
    );
  });

  it("returns 409 when another request inserts the membership first", async () => {
    AddTeamMember.mockRejectedValue(
      new ClientError(
        {
          status: 200,
          errors: [
            new GraphQLError(
              'Uniqueness violation. duplicate key value violates unique constraint "membership_team_id_user_id_key"',
              { extensions: { code: "constraint-violation" } },
            ),
          ],
        },
        { query: "AddTeamMember" },
      ),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "This account is already a member of the team",
    });
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("returns 503 when the insert is rejected", async () => {
    AddTeamMember.mockRejectedValue(
      new Error("check constraint of an insert/update permission has failed"),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(503);
  });

  it("returns 503 when the insert returns no membership", async () => {
    AddTeamMember.mockResolvedValue({
      insert_membership: { affected_rows: 0 },
    });

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(503);
  });
});
// #endregion
