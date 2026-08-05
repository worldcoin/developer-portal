type SandboxAccessEmail = {
  subject: string;
  text: string;
};

/**
 * Plaintext invite sent after an admin approves a sandbox request and the
 * Google account has been allowlisted in Play Console.
 */
export const buildSandboxAccessEmail = (params: {
  androidInstallUrl?: string | null;
}): SandboxAccessEmail => {
  const installUrl =
    params.androidInstallUrl?.trim() ||
    "the Android internal testing link in the developer portal";

  return {
    subject: "Your World ID Sandbox invite",
    text: [
      "Your request for World ID Sandbox access has been approved.",
      "",
      "Your Google account has been added to the Android internal testing list.",
      "Install the sandbox build here:",
      installUrl,
      "",
      "Open the link while signed into that same Google account, then install",
      "World ID Sandbox from the Play testing page.",
      "",
      "If you did not request sandbox access, you can ignore this email.",
      "",
      "— Tools for Humanity",
    ].join("\n"),
  };
};
