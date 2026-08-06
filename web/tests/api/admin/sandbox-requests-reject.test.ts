import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const GetPendingSandboxRequest = jest.fn();
const DeletePendingSandboxRequest = jest.fn();
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
  "../../../api/admin/sandbox-requests/[id]/reject/graphql/delete-pending-sandbox-request.generated",
  () => ({
    getSdk: () => ({ GetPendingSandboxRequest, DeletePendingSandboxRequest }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/admin/sandbox-requests/[id]/reject";

// #region Test Data
const REQUEST_ID = "sbxreq_abc123";
const GOOGLE_EMAIL = "tester@gmail.com";
const REQUESTER_EMAIL = "developer@example.com";
const REASON = "Not eligible for sandbox access.";

const createRequest = (body: unknown = { reason: REASON }) =>
  new NextRequest(
    `http://localhost/api/admin/sandbox-requests/${REQUEST_ID}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

const createContext = (id = REQUEST_ID) => ({
  params: Promise.resolve({ id }),
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SENDGRID_API_KEY = "sg-test-key";
  process.env.SENDGRID_EMAIL_FROM = "no-reply@worldcoin.org";
  process.env.SENDGRID_SANDBOX_ACCESS_REJECTED_TEMPLATE_ID =
    "d-sandbox-rejected";

  authenticateAdminRequest.mockResolvedValue({
    email: "admin@example.com",
    role: "internal_dashboard_readonly",
    subject: "admin-subject",
  });
  GetPendingSandboxRequest.mockResolvedValue({
    sandbox_access_request: [
      {
        google_email: GOOGLE_EMAIL,
        user: { name: "Test Developer", email: REQUESTER_EMAIL },
      },
    ],
  });
  DeletePendingSandboxRequest.mockResolvedValue({
    delete_sandbox_access_request: { affected_rows: 1 },
  });
  sendEmail.mockResolvedValue(true);
});

// #region POST /api/admin/sandbox-requests/[id]/reject
describe("POST /api/admin/sandbox-requests/[id]/reject", () => {
  it("returns 401 without an authenticated dashboard user", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(GetPendingSandboxRequest).not.toHaveBeenCalled();
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid id", { reason: REASON }, "bad-id"],
    ["missing reason", {}, REQUEST_ID],
    ["empty reason", { reason: "   " }, REQUEST_ID],
  ])("returns 400 for %s", async (_label, body, id) => {
    const response = await POST(createRequest(body), createContext(id));

    expect(response.status).toBe(400);
    expect(GetPendingSandboxRequest).not.toHaveBeenCalled();
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 503 when rejection email is not configured", async () => {
    delete process.env.SENDGRID_SANDBOX_ACCESS_REJECTED_TEMPLATE_ID;

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(GetPendingSandboxRequest).not.toHaveBeenCalled();
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("emails the requester before deleting the pending request", async () => {
    const response = await POST(
      createRequest({ reason: `  ${REASON}  ` }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: true });
    expect(GetPendingSandboxRequest).toHaveBeenCalledWith({ id: REQUEST_ID });
    expect(DeletePendingSandboxRequest).toHaveBeenCalledWith({
      id: REQUEST_ID,
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: REQUESTER_EMAIL,
        templateId: "d-sandbox-rejected",
        templateData: {
          username: "Test Developer",
          approved_email: GOOGLE_EMAIL,
          reason: REASON,
        },
      }),
    );
    expect(sendEmail.mock.invocationCallOrder[0]).toBeLessThan(
      DeletePendingSandboxRequest.mock.invocationCallOrder[0],
    );
  });

  it("is a no-op when the request is missing or already accepted", async () => {
    GetPendingSandboxRequest.mockResolvedValue({ sandbox_access_request: [] });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: false });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
  });

  it("keeps the request retryable when SendGrid fails", async () => {
    sendEmail.mockRejectedValue(new Error("sendgrid down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(GetPendingSandboxRequest).toHaveBeenCalled();
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
  });

  it("keeps the request when the requester has no email address", async () => {
    GetPendingSandboxRequest.mockResolvedValue({
      sandbox_access_request: [
        {
          google_email: GOOGLE_EMAIL,
          user: { name: "Test Developer", email: null },
        },
      ],
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
  });
});
// #endregion
