import { NextRequest } from "next/server";

// #region Mocks
const getSession = jest.fn();
const InsertSandboxAccessRequest = jest.fn();
const GetSandboxAccessRequest = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSession(...args) },
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "../../../api/v2/sandbox-access-request/graphql/insert-sandbox-access-request.generated",
  () => ({
    getSdk: () => ({ InsertSandboxAccessRequest }),
  }),
);

jest.mock(
  "../../../api/v2/sandbox-access-request/graphql/get-sandbox-access-request.generated",
  () => ({
    getSdk: () => ({ GetSandboxAccessRequest }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { GET, POST } from "@/api/v2/sandbox-access-request";

// #region Test Data
const USER_ID = "usr_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const makeRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/v2/sandbox-access-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const validBody = {
  email: "tester@gmail.com",
};

const storedRequest = {
  google_email: "tester@gmail.com",
  accepted: false,
  created_at: "2026-07-23T00:00:00Z",
};

const authedSession = {
  user: {
    email: "dev@example.com",
    hasura: {
      id: USER_ID,
    },
  },
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  InsertSandboxAccessRequest.mockResolvedValue({
    insert_sandbox_access_request_one: {
      id: "sbxreq_abc123",
      google_email: storedRequest.google_email,
      accepted: false,
      created_at: storedRequest.created_at,
    },
  });
  GetSandboxAccessRequest.mockResolvedValue({
    sandbox_access_request: [storedRequest],
  });
});

// #region /api/v2/sandbox-access-request
describe("/api/v2/sandbox-access-request", () => {
  it("returns 401 when unauthenticated", async () => {
    getSession.mockResolvedValue(null);

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(401);
    expect(InsertSandboxAccessRequest).not.toHaveBeenCalled();
  });

  it("returns 401 when the session has no Hasura user id", async () => {
    getSession.mockResolvedValue({
      user: { email: "dev@example.com", hasura: {} },
    });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(401);
    expect(InsertSandboxAccessRequest).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email", async () => {
    getSession.mockResolvedValue(authedSession);

    await expect(
      POST(makeRequest({ email: "not-an-email" })),
    ).resolves.toMatchObject({ status: 400 });
    expect(InsertSandboxAccessRequest).not.toHaveBeenCalled();
  });

  it("records the request for the authenticated user", async () => {
    getSession.mockResolvedValue(authedSession);

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      request: {
        email: "tester@gmail.com",
        accepted: false,
        createdAt: "2026-07-23T00:00:00Z",
      },
    });
    expect(InsertSandboxAccessRequest).toHaveBeenCalledWith({
      google_email: "tester@gmail.com",
      user_id: USER_ID,
    });
  });

  it("returns the stored state without regressing a processed request", async () => {
    getSession.mockResolvedValue(authedSession);
    InsertSandboxAccessRequest.mockResolvedValue({
      insert_sandbox_access_request_one: null,
    });
    GetSandboxAccessRequest.mockResolvedValue({
      sandbox_access_request: [
        {
          google_email: "original@gmail.com",
          accepted: true,
          created_at: "2026-07-22T00:00:00Z",
        },
      ],
    });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      request: {
        email: "original@gmail.com",
        accepted: true,
        createdAt: "2026-07-22T00:00:00Z",
      },
    });
    expect(InsertSandboxAccessRequest).toHaveBeenCalledWith({
      google_email: "tester@gmail.com",
      user_id: USER_ID,
    });
  });

  it("returns 500 when the insert fails", async () => {
    getSession.mockResolvedValue(authedSession);
    InsertSandboxAccessRequest.mockRejectedValue(new Error("hasura down"));

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false });
  });
});
// #endregion

// #region GET /api/v2/sandbox-access-request
describe("GET /api/v2/sandbox-access-request", () => {
  it("returns 401 when unauthenticated", async () => {
    getSession.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(GetSandboxAccessRequest).not.toHaveBeenCalled();
  });

  it("returns 401 when the session has no Hasura user id", async () => {
    getSession.mockResolvedValue({
      user: { email: "dev@example.com", hasura: {} },
    });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(GetSandboxAccessRequest).not.toHaveBeenCalled();
  });

  it("returns the caller's existing request", async () => {
    getSession.mockResolvedValue(authedSession);
    GetSandboxAccessRequest.mockResolvedValue({
      sandbox_access_request: [
        {
          google_email: "tester@gmail.com",
          accepted: false,
          created_at: "2026-07-23T00:00:00Z",
        },
      ],
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      request: {
        email: "tester@gmail.com",
        accepted: false,
        createdAt: "2026-07-23T00:00:00Z",
      },
    });
    expect(GetSandboxAccessRequest).toHaveBeenCalledWith({
      user_id: USER_ID,
    });
  });

  it("returns request: null when the caller has not submitted one", async () => {
    getSession.mockResolvedValue(authedSession);
    GetSandboxAccessRequest.mockResolvedValue({ sandbox_access_request: [] });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, request: null });
  });

  it("returns 500 when the lookup fails", async () => {
    getSession.mockResolvedValue(authedSession);
    GetSandboxAccessRequest.mockRejectedValue(new Error("hasura down"));

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false });
  });
});
// #endregion
