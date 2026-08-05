import { buildSandboxAccessEmail } from "@/api/admin/sandbox-requests/[id]/accept/sandbox-access-email";

describe("buildSandboxAccessEmail", () => {
  it("includes the Android install URL in the plaintext body", () => {
    const email = buildSandboxAccessEmail({
      androidInstallUrl: "https://play.google.com/apps/internaltest/example",
    });

    expect(email.subject).toBe("Your World ID Sandbox invite");
    expect(email.text).toContain(
      "https://play.google.com/apps/internaltest/example",
    );
    expect(email.text).toContain("approved");
  });

  it("falls back when the install URL is missing", () => {
    const email = buildSandboxAccessEmail({ androidInstallUrl: null });

    expect(email.text).toContain("developer portal");
  });
});
