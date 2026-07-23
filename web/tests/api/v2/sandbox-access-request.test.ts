import { NextRequest } from "next/server";

// #region Mocks
const getSession = jest.fn();
const sendEmail = jest.fn();
const getSandboxTeamIds = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSession(...args) },
}));

jest.mock("@/api/helpers/send-email", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

jest.mock("@/lib/feature-flags", () => ({
  featureFlags: {
    worldIdSandbox: {
      getSandboxTeamIds: (...args: unknown[]) => getSandboxTeamIds(...args),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/v2/sandbox-access-request";

// #region Test Data
const TEAM_ALLOWED = "team_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TEAM_OTHER = "team_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const makeRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/v2/sandbox-access-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const validBody = {
  email: "tester@gmail.com",
  teamId: TEAM_ALLOWED,
};

const multiTeamSession = {
  user: {
    email: "dev@example.com",
    hasura: {
      memberships: [
        { team: { id: TEAM_ALLOWED } },
        { team: { id: TEAM_OTHER } },
      ],
    },
  },
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SENDGRID_API_KEY = "test-key";
  process.env.SENDGRID_EMAIL_FROM = "noreply@example.com";
  getSandboxTeamIds.mockImplementation(async (teamIds: string[]) =>
    teamIds.filter((id) => id === TEAM_ALLOWED),
  );
  sendEmail.mockResolvedValue(true);
});

// #region /api/v2/sandbox-access-request
describe("/api/v2/sandbox-access-request", () => {
  it("returns 401 when unauthenticated", async () => {
    getSession.mockResolvedValue(null);

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email or teamId", async () => {
    getSession.mockResolvedValue(multiTeamSession);

    await expect(
      POST(makeRequest({ email: "not-an-email", teamId: TEAM_ALLOWED })),
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      POST(makeRequest({ email: "tester@gmail.com", teamId: "team_nope" })),
    ).resolves.toMatchObject({ status: 400 });
    expect(getSandboxTeamIds).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 403 when the teamId is not one of the user's memberships", async () => {
    getSession.mockResolvedValue({
      user: {
        email: "dev@example.com",
        hasura: { memberships: [{ team: { id: TEAM_OTHER } }] },
      },
    });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(403);
    expect(getSandboxTeamIds).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 403 when the requested team is not sandbox-allowlisted", async () => {
    getSession.mockResolvedValue(multiTeamSession);

    const res = await POST(
      makeRequest({ email: "tester@gmail.com", teamId: TEAM_OTHER }),
    );

    expect(res.status).toBe(403);
    expect(getSandboxTeamIds).toHaveBeenCalledWith(
      [TEAM_OTHER],
      "dev@example.com",
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("relays the request only for the allowlisted team currently requested", async () => {
    getSession.mockResolvedValue(multiTeamSession);

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(getSandboxTeamIds).toHaveBeenCalledWith(
      [TEAM_ALLOWED],
      "dev@example.com",
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(TEAM_ALLOWED),
      }),
    );
  });
});
// #endregion
