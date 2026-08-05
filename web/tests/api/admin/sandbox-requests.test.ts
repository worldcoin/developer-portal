import { NextRequest } from "next/server";

// #region Mocks
const authenticateAdminRequest = jest.fn();
const GetSandboxAccessRequest = jest.fn();
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
  "../../../api/admin/sandbox-requests/[id]/accept/graphql/get-sandbox-access-request.generated",
  () => ({
    getSdk: () => ({ GetSandboxAccessRequest }),
  }),
);

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

const pendingRequest = {
  id: REQUEST_ID,
  google_email: GOOGLE_EMAIL,
  accepted: false,
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SENDGRID_API_KEY = "sg-test-key";
  process.env.SENDGRID_EMAIL_FROM = "no-reply@worldcoin.org";
  process.env.NEXT_PUBLIC_ANDROID_INTERNAL_TEST_URL =
    "https://play.google.com/apps/internaltest/example";

  authenticateAdminRequest.mockResolvedValue(admin);
  GetSandboxAccessRequest.mockResolvedValue({
    sandbox_access_request: [pendingRequest],
  });
  MarkSandboxInviteSent.mockResolvedValue({
    update_sandbox_access_request: { affected_rows: 1 },
  });
  sendEmail.mockResolvedValue(true);
});

// #region POST /api/admin/sandbox-requests/[id]/accept
describe("POST /api/admin/sandbox-requests/[id]/accept", () => {
  it("returns 401 without an authenticated dashboard user", async () => {
    authenticateAdminRequest.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(401);
    expect(GetSandboxAccessRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
  });

  it("rejects an invalid sandbox request id", async () => {
    const response = await POST(
      createRequest(),
      createContext("not-a-request"),
    );

    expect(response.status).toBe(400);
    expect(GetSandboxAccessRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
  });

  it("returns 503 when no-reply email env is missing", async () => {
    delete process.env.SENDGRID_EMAIL_FROM;

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Sandbox invite email is not configured",
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
  });

  it("returns 404 when the sandbox request does not exist", async () => {
    GetSandboxAccessRequest.mockResolvedValue({
      sandbox_access_request: [],
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(404);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
  });

  it("sends the invite from no-reply then marks a pending request accepted", async () => {
    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: true });
    expect(sendEmail).toHaveBeenCalledWith({
      apiKey: "sg-test-key",
      from: "no-reply@worldcoin.org",
      to: GOOGLE_EMAIL,
      subject: "Your World ID Sandbox invite",
      text: expect.stringContaining(
        "https://play.google.com/apps/internaltest/example",
      ),
    });
    expect(MarkSandboxInviteSent).toHaveBeenCalledWith({
      id: REQUEST_ID,
      processed_at: expect.any(String),
    });
  });

  it("skips email for an already accepted request", async () => {
    GetSandboxAccessRequest.mockResolvedValue({
      sandbox_access_request: [{ ...pendingRequest, accepted: true }],
    });

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, changed: false });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
  });

  it("does not mark accepted when the invite email fails", async () => {
    sendEmail.mockRejectedValue(new Error("sendgrid down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to send sandbox invite email",
    });
    expect(MarkSandboxInviteSent).not.toHaveBeenCalled();
  });

  it("returns 503 when the backend update fails after email send", async () => {
    MarkSandboxInviteSent.mockRejectedValue(new Error("hasura down"));

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Unable to update sandbox request",
    });
    expect(sendEmail).toHaveBeenCalled();
  });
});
// #endregion
