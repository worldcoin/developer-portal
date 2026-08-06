import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const MarkSandboxInviteSent = jest.fn();
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
const GOOGLE_EMAIL = "tester@gmail.com";
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
  process.env.SENDGRID_API_KEY = "sg-test-key";
  process.env.SENDGRID_EMAIL_FROM = "no-reply@worldcoin.org";
  process.env.SENDGRID_SANDBOX_ACCESS_APPROVED_TEMPLATE_ID =
    "d-sandbox-approved";

  authenticateAdminRequest.mockResolvedValue(admin);
  MarkSandboxInviteSent.mockResolvedValue({
    update_sandbox_access_request: {
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

// #region POST /api/admin/sandbox-requests/[id]/accept
describe("POST /api/admin/sandbox-requests/[id]/accept", () => {
  it("returns 401 without an authenticated dashboard user", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects an invalid sandbox request id", async () => {
    const response = await POST(
      createRequest(),
      createContext("not-a-request"),
    );

    expect(response.status).toBe(400);
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 503 without changing the request when email is not configured", async () => {
    delete process.env.SENDGRID_SANDBOX_ACCESS_APPROVED_TEMPLATE_ID;

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Sandbox approval email is not configured",
    });
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("approves a pending request and emails the approved Google account", async () => {
    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: true });
    expect(MarkSandboxInviteSent).toHaveBeenCalledWith({
      id: REQUEST_ID,
      processed_at: expect.any(String),
    });
    expect(sendEmail).toHaveBeenCalledWith({
      apiKey: "sg-test-key",
      from: "no-reply@worldcoin.org",
      to: GOOGLE_EMAIL,
      templateId: "d-sandbox-approved",
      templateData: {
        username: "Test Developer",
        approved_email: GOOGLE_EMAIL,
      },
    });
    expect(MarkSandboxInviteSent.mock.invocationCallOrder[0]).toBeLessThan(
      sendEmail.mock.invocationCallOrder[0],
    );
  });

  it("treats an already processed request as an idempotent success", async () => {
    MarkSandboxInviteSent.mockResolvedValue({
      update_sandbox_access_request: { affected_rows: 0, returning: [] },
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: false });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("uses the portal login email when the user name is blank", async () => {
    MarkSandboxInviteSent.mockResolvedValue({
      update_sandbox_access_request: {
        affected_rows: 1,
        returning: [
          {
            google_email: GOOGLE_EMAIL,
            user: { name: " ", email: "developer@example.com" },
          },
        ],
      },
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateData: {
          username: "developer@example.com",
          approved_email: GOOGLE_EMAIL,
        },
      }),
    );
  });

  it("returns 503 after claiming the request when SendGrid fails", async () => {
    sendEmail.mockRejectedValue(new Error("sendgrid down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to send sandbox approval email",
    });
    expect(MarkSandboxInviteSent).toHaveBeenCalled();
  });

  it("returns 503 when the backend update fails", async () => {
    MarkSandboxInviteSent.mockRejectedValue(new Error("hasura down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update sandbox request",
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
// #endregion
