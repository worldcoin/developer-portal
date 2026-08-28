import sendgrid from "@sendgrid/mail";
import type { ClientResponse } from "@sendgrid/mail";

import { sendEmail, sendEmailDetailed } from "@/api/helpers/send-email";

// #region Mocks
jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    send: jest.fn(),
    setApiKey: jest.fn(),
    setTimeout: jest.fn(),
  },
}));
// #endregion

const sendgridMock = sendgrid as jest.Mocked<typeof sendgrid>;

beforeEach(() => {
  jest.clearAllMocks();
  sendgridMock.send.mockResolvedValue([{} as ClientResponse, {}]);
});

// #region SendGrid transactional send settings
describe("sendEmail", () => {
  it("bypasses global unsubscribe management for transactional emails", async () => {
    await sendEmail({
      apiKey: "sendgrid-api-key",
      from: "noreply@example.com",
      to: "user@example.com",
      templateId: "d-team-invite",
      templateData: {
        inviteLink: "https://developer.worldcoin.org/join?invite_id=invite_1",
      },
    });

    expect(sendgridMock.setApiKey).toHaveBeenCalledWith("sendgrid-api-key");
    expect(sendgridMock.setTimeout).toHaveBeenCalledWith(15_000);
    expect(sendgridMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        mailSettings: {
          bypassUnsubscribeManagement: {
            enable: true,
          },
        },
      }),
    );
  });

  it("returns the sanitized SendGrid message id and attaches trace args", async () => {
    sendgridMock.send.mockResolvedValue([
      {
        headers: { "x-message-id": "sendgrid-message-123" },
      } as unknown as ClientResponse,
      {},
    ]);

    await expect(
      sendEmailDetailed({
        apiKey: "sendgrid-api-key",
        from: "noreply@example.com",
        to: "user@example.com",
        templateId: "d-review",
        templateData: { app_name: "Example" },
        customArgs: {
          review_notification_id: "22222222-2222-4222-8222-222222222222",
        },
      }),
    ).resolves.toEqual({ messageId: "sendgrid-message-123" });
    expect(sendgridMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        customArgs: {
          review_notification_id: "22222222-2222-4222-8222-222222222222",
        },
      }),
    );
  });

  it("treats an empty provider response as delivered without post-send parsing failure", async () => {
    sendgridMock.send.mockResolvedValue(
      undefined as unknown as Awaited<ReturnType<typeof sendgrid.send>>,
    );

    await expect(
      sendEmailDetailed({
        apiKey: "sendgrid-api-key",
        from: "noreply@example.com",
        to: "user@example.com",
        templateId: "d-review",
        templateData: { app_name: "Example" },
      }),
    ).resolves.toEqual({ messageId: null });
  });
});
// #endregion
