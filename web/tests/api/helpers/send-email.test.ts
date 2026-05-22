import sendgrid from "@sendgrid/mail";
import type { ClientResponse } from "@sendgrid/mail";

import { sendEmail } from "@/api/helpers/send-email";

// #region Mocks
jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    send: jest.fn(),
    setApiKey: jest.fn(),
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
});
// #endregion
