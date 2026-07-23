import { NextRequest } from "next/server";

// #region Mocks
const getSession = jest.fn();
const sandboxEnabled = jest.fn<boolean, []>();
const InsertSandboxAccessRequest = jest.fn();

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

// Getter so each test can flip the kill switch (a plain constant in prod).
jest.mock("@/lib/constants", () => ({
  ...jest.requireActual("@/lib/constants"),
  get WORLD_ID_SANDBOX_ENABLED() {
    return sandboxEnabled();
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/v2/sandbox-access-request";

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
  sandboxEnabled.mockReturnValue(true);
  InsertSandboxAccessRequest.mockResolvedValue({
    insert_sandbox_access_request_one: {
      id: "sandbox_request_abc123",
      status: "pending",
    },
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

  it("returns 403 when the sandbox kill switch is off", async () => {
    sandboxEnabled.mockReturnValue(false);
    getSession.mockResolvedValue(authedSession);

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(403);
    expect(InsertSandboxAccessRequest).not.toHaveBeenCalled();
  });

  it("records the request for the authenticated user", async () => {
    getSession.mockResolvedValue(authedSession);

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(InsertSandboxAccessRequest).toHaveBeenCalledWith({
      google_email: "tester@gmail.com",
      portal_email: "dev@example.com",
      user_id: USER_ID,
    });
  });

  it("treats a repeat request as success (upsert resets pending)", async () => {
    getSession.mockResolvedValue(authedSession);
    InsertSandboxAccessRequest.mockResolvedValue({
      insert_sandbox_access_request_one: {
        id: "sandbox_request_existing",
        status: "pending",
      },
    });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(InsertSandboxAccessRequest).toHaveBeenCalledWith({
      google_email: "tester@gmail.com",
      portal_email: "dev@example.com",
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
