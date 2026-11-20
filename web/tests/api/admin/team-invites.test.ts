import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const GetTeamInviteContext = jest.fn();
const CreateTeamInvite = jest.fn();
const RefreshTeamInvites = jest.fn();
const sendEmail = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClientForUser: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/api/helpers/send-email", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

jest.mock(
  "../../../api/admin/teams/[id]/invites/graphql/get-team-invite-context.generated",
  () => ({ getSdk: () => ({ GetTeamInviteContext }) }),
);

jest.mock(
  "../../../api/admin/teams/[id]/invites/graphql/create-team-invite.generated",
  () => ({ getSdk: () => ({ CreateTeamInvite }) }),
);

jest.mock(
  "../../../api/admin/teams/[id]/invites/graphql/refresh-team-invites.generated",
  () => ({ getSdk: () => ({ RefreshTeamInvites }) }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/admin/teams/[id]/invites";

// #region Test Data
const TEAM_ID = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const INVITE_ID = "inv_kQ3x9mZpL2vR8tY1wB6nC4dF7gH0jK5sA2eU9iO3qXc";
const EMAIL = "new.member@example.com";
const admin = {
  email: "admin@example.com",
  role: "internal_dashboard_readonly",
  subject: "admin-subject",
};

const createRequest = (body: unknown) =>
  new NextRequest(`http://localhost/api/admin/teams/${TEAM_ID}/invites`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const createContext = (id = TEAM_ID) => ({
  params: Promise.resolve({ id }),
});

const makeInviteContext = (overrides: Record<string, unknown> = {}) => ({
  team: { id: TEAM_ID, name: "Acme <b>Labs</b>", deleted_at: null },
  membership: [],
  invite: [],
  ...overrides,
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SENDGRID_API_KEY = "sg-test-key";
  process.env.SENDGRID_EMAIL_FROM = "no-reply@worldcoin.org";
  process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID = "d-team-invite";
  process.env.NEXT_PUBLIC_APP_URL = "https://developer.world.org";

  authenticateAdminRequest.mockResolvedValue(admin);
  GetTeamInviteContext.mockResolvedValue(makeInviteContext());
  CreateTeamInvite.mockResolvedValue({
    insert_invite_one: { id: INVITE_ID, email: EMAIL, role: "MEMBER" },
  });
  RefreshTeamInvites.mockResolvedValue({
    update_invite: {
      returning: [{ id: INVITE_ID, email: EMAIL, role: "ADMIN" }],
    },
  });
  sendEmail.mockResolvedValue(true);
});

// #region Success cases
describe("POST /api/admin/teams/[id]/invites [success cases]", () => {
  it("creates an invite with the requested role and emails a public join link", async () => {
    const response = await POST(
      createRequest({ email: "  New.Member@Example.com ", role: "ADMIN" }),
      createContext(),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      email: EMAIL,
      role: "ADMIN",
      refreshed: false,
    });
    // The invite id is the join credential and must not reach the dashboard.
    expect(JSON.stringify(body)).not.toContain(INVITE_ID);

    expect(GetTeamInviteContext).toHaveBeenCalledWith({
      team_id: TEAM_ID,
      email: EMAIL,
    });
    expect(CreateTeamInvite).toHaveBeenCalledWith({
      object: { email: EMAIL, team_id: TEAM_ID, role: "ADMIN" },
    });
    expect(RefreshTeamInvites).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith({
      apiKey: "sg-test-key",
      from: "no-reply@worldcoin.org",
      to: EMAIL,
      templateId: "d-team-invite",
      templateData: {
        inviter: "World Developer Portal support",
        team: "Acme Labs",
        inviteLink: `https://developer.world.org/join?invite_id=${INVITE_ID}`,
      },
    });
  });

  it("refreshes and resends an existing invite instead of creating a duplicate", async () => {
    GetTeamInviteContext.mockResolvedValue(
      makeInviteContext({ invite: [{ id: INVITE_ID }] }),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "ADMIN" }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ refreshed: true });
    expect(CreateTeamInvite).not.toHaveBeenCalled();
    expect(RefreshTeamInvites).toHaveBeenCalledWith({
      ids: [INVITE_ID],
      expires_at: expect.any(String),
      role: "ADMIN",
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
// #endregion

// #region Request validation
describe("POST /api/admin/teams/[id]/invites [validation]", () => {
  it("rejects unauthenticated requests", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(401);
    expect(GetTeamInviteContext).not.toHaveBeenCalled();
  });

  it("rejects a malformed team id", async () => {
    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext("team_bad-id;drop"),
    );

    expect(response.status).toBe(400);
    expect(GetTeamInviteContext).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(createRequest("not json"), createContext());

    expect(response.status).toBe(400);
    expect(GetTeamInviteContext).not.toHaveBeenCalled();
  });

  it("refuses to invite anyone as OWNER", async () => {
    const response = await POST(
      createRequest({ email: EMAIL, role: "OWNER" }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "validation_error",
      attribute: "role",
    });
    expect(CreateTeamInvite).not.toHaveBeenCalled();
    expect(RefreshTeamInvites).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const response = await POST(
      createRequest({ email: "not-an-email", role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ attribute: "email" });
    expect(GetTeamInviteContext).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Team state guards
describe("POST /api/admin/teams/[id]/invites [team state]", () => {
  it("returns 404 when the team does not exist", async () => {
    GetTeamInviteContext.mockResolvedValue(makeInviteContext({ team: null }));

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(404);
    expect(CreateTeamInvite).not.toHaveBeenCalled();
  });

  it("refuses to invite into a deleted team", async () => {
    GetTeamInviteContext.mockResolvedValue(
      makeInviteContext({
        team: {
          id: TEAM_ID,
          name: "Acme",
          deleted_at: "2026-01-01T00:00:00.000Z",
        },
      }),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(CreateTeamInvite).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("refuses to invite someone who is already a member", async () => {
    GetTeamInviteContext.mockResolvedValue(
      makeInviteContext({ membership: [{ id: "memb_123" }] }),
    );

    const response = await POST(
      createRequest({ email: EMAIL, role: "ADMIN" }),
      createContext(),
    );

    expect(response.status).toBe(409);
    expect(CreateTeamInvite).not.toHaveBeenCalled();
    expect(RefreshTeamInvites).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Dependency failures
describe("POST /api/admin/teams/[id]/invites [dependency failures]", () => {
  it("fails fast with 503 when invite email is not configured", async () => {
    delete process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID;

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(GetTeamInviteContext).not.toHaveBeenCalled();
    expect(CreateTeamInvite).not.toHaveBeenCalled();
  });

  it("returns 503 when the team lookup fails", async () => {
    GetTeamInviteContext.mockRejectedValue(new Error("hasura timeout"));

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(CreateTeamInvite).not.toHaveBeenCalled();
  });

  it("returns 503 without emailing when the invite is not saved", async () => {
    CreateTeamInvite.mockResolvedValue({ insert_invite_one: null });

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 503 telling the admin to resend when the email fails after saving", async () => {
    sendEmail.mockRejectedValue(new Error("sendgrid down"));

    const response = await POST(
      createRequest({ email: EMAIL, role: "MEMBER" }),
      createContext(),
    );

    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/Submit again to resend/);
    expect(CreateTeamInvite).toHaveBeenCalledTimes(1);
  });
});
// #endregion
