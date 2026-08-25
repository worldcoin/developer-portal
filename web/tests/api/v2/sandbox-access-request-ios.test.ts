import { NextRequest } from "next/server";

// #region Mocks
const getSession = jest.fn();
const InsertSandboxAccessRequestIos = jest.fn();
const GetSandboxAccessRequestIos = jest.fn();
const getAPIServiceGraphqlClient = jest.fn();
const getAPIServiceGraphqlClientForUser = jest.fn();

jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: () => getSession() },
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: (...args: unknown[]) =>
    getAPIServiceGraphqlClient(...args),
  getAPIServiceGraphqlClientForUser: (...args: unknown[]) =>
    getAPIServiceGraphqlClientForUser(...args),
}));

jest.mock(
  "../../../api/v2/sandbox-access-request-ios/graphql/insert-sandbox-access-request-ios.generated",
  () => ({
    getSdk: () => ({ InsertSandboxAccessRequestIos }),
  }),
);

jest.mock(
  "../../../api/v2/sandbox-access-request-ios/graphql/get-sandbox-access-request-ios.generated",
  () => ({
    getSdk: () => ({ GetSandboxAccessRequestIos }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { GET, POST } from "@/api/v2/sandbox-access-request-ios";

// #region Test Data
const USER_ID = "usr_1234567890abcdef";
const TEAM_ID = "team_1234567890abcdef1234567890abcdef";
const authedSession = {
  user: {
    email: "portal@example.com",
    hasura: {
      id: USER_ID,
      memberships: [{ team: { id: TEAM_ID } }],
    },
  },
};
const storedRequest = {
  asc_email: "asc@example.com",
  status: "pending",
};

const makeRequest = (body: string) =>
  new NextRequest("http://localhost/api/v2/sandbox-access-request-ios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

const makeJsonRequest = (body: unknown) => makeRequest(JSON.stringify(body));
const validBody = { asc_email: "asc@example.com", team_id: TEAM_ID };
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getAPIServiceGraphqlClient.mockResolvedValue({});
  getAPIServiceGraphqlClientForUser.mockResolvedValue({});
  getSession.mockResolvedValue(authedSession);
  InsertSandboxAccessRequestIos.mockResolvedValue({
    insert_sandbox_access_request_ios_one: { id: "sbx_req_abc123" },
  });
  GetSandboxAccessRequestIos.mockResolvedValue({
    sandbox_access_request_ios: [storedRequest],
  });
});

// #region POST /api/v2/sandbox-access-request-ios
describe("POST /api/v2/sandbox-access-request-ios", () => {
  it("returns 401 without an authenticated Hasura user", async () => {
    getSession.mockResolvedValue(null);

    const response = await POST(makeJsonRequest(validBody));

    expect(response.status).toBe(401);
    expect(InsertSandboxAccessRequestIos).not.toHaveBeenCalled();
  });

  it("rejects a session without a portal email", async () => {
    getSession.mockResolvedValue({ user: { hasura: { id: USER_ID } } });

    const response = await POST(makeJsonRequest(validBody));

    expect(response.status).toBe(400);
    expect(InsertSandboxAccessRequestIos).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(makeRequest("{"));

    expect(response.status).toBe(400);
    expect(InsertSandboxAccessRequestIos).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid ASC email", async () => {
    const response = await POST(
      makeJsonRequest({ ...validBody, asc_email: "not-an-email" }),
    );

    expect(response.status).toBe(400);
    expect(InsertSandboxAccessRequestIos).not.toHaveBeenCalled();
  });

  it("returns 400 without a team affiliation", async () => {
    const response = await POST(
      makeJsonRequest({ asc_email: "asc@example.com" }),
    );

    expect(response.status).toBe(400);
    expect(InsertSandboxAccessRequestIos).not.toHaveBeenCalled();
  });

  it("returns 403 when the team does not belong to the user", async () => {
    const response = await POST(
      makeJsonRequest({
        ...validBody,
        team_id: "team_ffffffffffffffffffffffffffffffff",
      }),
    );

    expect(response.status).toBe(403);
    expect(InsertSandboxAccessRequestIos).not.toHaveBeenCalled();
  });

  it("stores the ASC email with session-owned identity and team fields", async () => {
    const response = await POST(
      makeJsonRequest({ ...validBody, asc_email: "  ASC@Example.COM  " }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      request: {
        ascEmail: "asc@example.com",
        status: "pending",
      },
    });
    expect(getAPIServiceGraphqlClientForUser).toHaveBeenCalledWith(USER_ID);
    expect(InsertSandboxAccessRequestIos).toHaveBeenCalledWith({
      asc_email: "asc@example.com",
      portal_email: "portal@example.com",
      team_id: TEAM_ID,
      user_id: USER_ID,
    });
    expect(GetSandboxAccessRequestIos).toHaveBeenCalledWith({
      user_id: USER_ID,
    });
  });

  it("returns the existing request unchanged when it is not rejected", async () => {
    InsertSandboxAccessRequestIos.mockResolvedValue({
      insert_sandbox_access_request_ios_one: null,
    });
    GetSandboxAccessRequestIos.mockResolvedValue({
      sandbox_access_request_ios: [
        {
          ...storedRequest,
          asc_email: "original@example.com",
          status: "approved",
        },
      ],
    });

    const response = await POST(
      makeJsonRequest({ ...validBody, asc_email: "replacement@example.com" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      request: expect.objectContaining({
        ascEmail: "original@example.com",
        status: "approved",
      }),
    });
  });

  it("returns 500 when Hasura does not persist a request", async () => {
    GetSandboxAccessRequestIos.mockResolvedValue({
      sandbox_access_request_ios: [],
    });

    const response = await POST(makeJsonRequest(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false });
  });

  it("returns 409 when another user already requested the ASC email", async () => {
    InsertSandboxAccessRequestIos.mockRejectedValue({
      response: {
        errors: [
          {
            message:
              'Uniqueness violation. duplicate key value violates unique constraint "unique_sandbox_access_request_ios_asc_email"',
          },
        ],
      },
    });

    const response = await POST(makeJsonRequest(validBody));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ success: false });
    expect(GetSandboxAccessRequestIos).not.toHaveBeenCalled();
  });

  it("keeps unknown Hasura failures as server errors", async () => {
    InsertSandboxAccessRequestIos.mockRejectedValue(new Error("hasura down"));

    const response = await POST(makeJsonRequest(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false });
  });
});
// #endregion

// #region GET /api/v2/sandbox-access-request-ios
describe("GET /api/v2/sandbox-access-request-ios", () => {
  it("returns 401 without an authenticated Hasura user", async () => {
    getSession.mockResolvedValue({ user: { email: "portal@example.com" } });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(GetSandboxAccessRequestIos).not.toHaveBeenCalled();
  });

  it("returns the caller's current request", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      request: {
        ascEmail: "asc@example.com",
        status: "pending",
      },
    });
    expect(getAPIServiceGraphqlClient).toHaveBeenCalled();
    expect(getAPIServiceGraphqlClientForUser).not.toHaveBeenCalled();
  });

  it("returns request null when the caller has not submitted one", async () => {
    GetSandboxAccessRequestIos.mockResolvedValue({
      sandbox_access_request_ios: [],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, request: null });
  });

  it("returns revoked as a distinct terminal state", async () => {
    GetSandboxAccessRequestIos.mockResolvedValue({
      sandbox_access_request_ios: [{ ...storedRequest, status: "revoked" }],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      request: expect.objectContaining({ status: "revoked" }),
    });
  });

  it("keeps the partner-facing state approved while revocation is unfinished", async () => {
    GetSandboxAccessRequestIos.mockResolvedValue({
      sandbox_access_request_ios: [{ ...storedRequest, status: "revoking" }],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      request: { ascEmail: "asc@example.com", status: "approved" },
    });
  });

  it("keeps the partner-facing state pending while approval is unfinished", async () => {
    GetSandboxAccessRequestIos.mockResolvedValue({
      sandbox_access_request_ios: [{ ...storedRequest, status: "approving" }],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      request: { ascEmail: "asc@example.com", status: "pending" },
    });
  });

  it("returns 500 for an unexpected stored status", async () => {
    GetSandboxAccessRequestIos.mockResolvedValue({
      sandbox_access_request_ios: [{ ...storedRequest, status: "unknown" }],
    });

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false });
  });
});
// #endregion
