import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const MarkSandboxInviteSent = jest.fn();

jest.mock("@/lib/admin-auth", () => ({
  authenticateAdminRequest: (...args: unknown[]) =>
    authenticateAdminRequest(...args),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClientForUser: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "../../../api/admin/sandbox-requests/[id]/accept/graphql/mark-sandbox-invite-sent.generated",
  () => ({
    getSdk: () => ({ MarkSandboxInviteSent }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/admin/sandbox-requests/[id]/accept";

// #region Test Data
const REQUEST_ID = "sbxreq_abc123";
const admin = {
  email: "admin@example.com",
  role: "internal_dashboard_readonly",
  subject: "admin-subject",
};

const createRequest = () =>
  new NextRequest(
    `http://localhost/api/admin/sandbox-requests/${REQUEST_ID}/accept`,
    { method: "POST" },
  );

const createContext = (id = REQUEST_ID) => ({
  params: Promise.resolve({ id }),
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  authenticateAdminRequest.mockResolvedValue(admin);
  MarkSandboxInviteSent.mockResolvedValue({
    update_sandbox_access_request: { affected_rows: 1 },
  });
});

// #region POST /api/admin/sandbox-requests/[id]/accept
describe("POST /api/admin/sandbox-requests/[id]/accept", () => {
  it("returns 401 without an authenticated dashboard user", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
  });

  it("rejects an invalid sandbox request id", async () => {
    const response = await POST(
      createRequest(),
      createContext("not-a-request"),
    );

    expect(response.status).toBe(400);
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
  });

  it("allows an authenticated dashboard reader to approve a pending request", async () => {
    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: true });
    expect(MarkSandboxInviteSent).toHaveBeenCalledWith({
      id: REQUEST_ID,
      processed_at: expect.any(String),
    });
  });

  it("treats an already processed request as an idempotent success", async () => {
    MarkSandboxInviteSent.mockResolvedValue({
      update_sandbox_access_request: { affected_rows: 0 },
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: false });
  });

  it("returns 503 when the backend update fails", async () => {
    MarkSandboxInviteSent.mockRejectedValue(new Error("hasura down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update sandbox request",
    });
  });
});
// #endregion
