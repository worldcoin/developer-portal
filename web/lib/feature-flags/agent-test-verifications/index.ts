export const isAgentTestVerificationsEnabled = (): boolean =>
  process.env.ENABLE_AGENT_TEST_VERIFICATIONS === "true";
