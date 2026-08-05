import { buildSandboxAccessRequestNotifyEmail } from "@/api/v2/sandbox-access-request/sandbox-access-request-notify-email";

describe("buildSandboxAccessRequestNotifyEmail", () => {
  it("includes the request details for the ops inbox", () => {
    const email = buildSandboxAccessRequestNotifyEmail({
      googleEmail: "tester@gmail.com",
      userId: "usr_abc",
      requestId: "sbxreq_abc123",
      requesterEmail: "dev@example.com",
    });

    expect(email.subject).toBe("New World ID Sandbox access request");
    expect(email.text).toContain("tester@gmail.com");
    expect(email.text).toContain("sbxreq_abc123");
    expect(email.text).toContain("dev@example.com");
  });
});
