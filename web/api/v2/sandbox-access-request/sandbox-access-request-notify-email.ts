type SandboxAccessRequestNotifyEmail = {
  subject: string;
  text: string;
};

/**
 * Internal plaintext alert to the sandbox ops inbox when a developer requests
 * Android sandbox access from the portal.
 */
export const buildSandboxAccessRequestNotifyEmail = (params: {
  googleEmail: string;
  userId: string;
  requestId: string;
  requesterEmail?: string | null;
}): SandboxAccessRequestNotifyEmail => ({
  subject: "New World ID Sandbox access request",
  text: [
    "A developer requested World ID Sandbox Android access.",
    "",
    `Request id: ${params.requestId}`,
    `Google Play account: ${params.googleEmail}`,
    `Portal user id: ${params.userId}`,
    ...(params.requesterEmail
      ? [`Portal login email: ${params.requesterEmail}`]
      : []),
    "",
    "Allowlist this Google account in Play Console, then Approve the request",
    "in the developer admin dashboard so the invite email is sent.",
  ].join("\n"),
});
