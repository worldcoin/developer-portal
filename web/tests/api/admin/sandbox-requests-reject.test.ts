import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
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
    getSdk: () => ({ DeletePendingSandboxRequest }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

import { POST } from "@/api/admin/sandbox-requests/[id]/reject";
import { logger } from "@/lib/logger";

// #region Test Data
const REQUEST_ID = "sbxreq_abc123";
const GOOGLE_EMAIL = "tester@gmail.com";
const REASON = "The Google account is not eligible for sandbox access.";
const admin = {
  email: "admin@example.com",
  role: "internal_dashboard_readonly",
  subject: "admin-subject",
};

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

  authenticateAdminRequest.mockResolvedValue(admin);
  DeletePendingSandboxRequest.mockResolvedValue({
    delete_sandbox_access_request: {
      affected_rows: 1,
      returning: [
        {
          google_email: GOOGLE_EMAIL,
          user: {
            name: "Test Developer",
            email: "developer@example.com",
          },
        },
      ],
    },
  });
  sendEmail.mockResolvedValue(true);
});

// #region POST /api/admin/sandbox-requests/[id]/reject
describe("POST /api/admin/sandbox-requests/[id]/reject", () => {
  it("returns 401 without an authenticated dashboard user", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects an invalid sandbox request id", async () => {
    const response = await POST(
      createRequest(),
      createContext("not-a-request"),
    );

    expect(response.status).toBe(400);
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", {}],
    ["empty", { reason: "   " }],
  ])("rejects a %s reason", async (_description, body) => {
    const response = await POST(createRequest(body), createContext());

    expect(response.status).toBe(400);
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a reason longer than 1000 characters", async () => {
    const response = await POST(
      createRequest({ reason: "x".repeat(1001) }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 503 without deleting when rejection email is not configured", async () => {
    delete process.env.SENDGRID_SANDBOX_ACCESS_REJECTED_TEMPLATE_ID;

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Sandbox rejection email is not configured",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Sandbox rejection email is not configured",
      expect.objectContaining({ hasTemplateId: false }),
    );
    expect(DeletePendingSandboxRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("deletes a pending request and emails the Google account with the reason", async () => {
    const response = await POST(
      createRequest({ reason: `  ${REASON}  ` }),
      createContext(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: true });
    expect(DeletePendingSandboxRequest).toHaveBeenCalledWith({
      id: REQUEST_ID,
    });
    expect(sendEmail).toHaveBeenCalledWith({
      apiKey: "sg-test-key",
      from: "no-reply@worldcoin.org",
      to: GOOGLE_EMAIL,
      templateId: "d-sandbox-rejected",
      templateData: {
        username: "Test Developer",
        approved_email: GOOGLE_EMAIL,
        reason: REASON,
      },
    });
    expect(
      DeletePendingSandboxRequest.mock.invocationCallOrder[0],
    ).toBeLessThan(sendEmail.mock.invocationCallOrder[0]);
  });

  it("treats an accepted or missing request as an idempotent success", async () => {
    DeletePendingSandboxRequest.mockResolvedValue({
      delete_sandbox_access_request: { affected_rows: 0, returning: [] },
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: false });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 503 after deleting the request when SendGrid fails", async () => {
    sendEmail.mockRejectedValue(new Error("sendgrid down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to send sandbox rejection email",
    });
    expect(DeletePendingSandboxRequest).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to send sandbox rejection email",
      expect.objectContaining({ requestId: REQUEST_ID }),
    );
  });
});
// #endregion
