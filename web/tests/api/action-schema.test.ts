import { createActionSchema } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page/CreateActionModal/server/form-schema";

const baseValues = {
  name: "Test action",
  description: "Test description",
  action: "test-action",
  app_flow_on_complete: "NONE" as const,
  max_verifications: 1,
};

describe("createActionSchema post-action deep links", () => {
  test("rejects invalid schemes in production", async () => {
    const schema = createActionSchema({ isProduction: true });
    await expect(
      schema.validate({
        ...baseValues,
        post_action_deep_link_android: "javascript:alert(1)",
        post_action_deep_link_ios: "intent://malicious",
      }),
    ).rejects.toBeTruthy();
  });

  test("rejects invalid schemes in staging", async () => {
    const schema = createActionSchema({ isProduction: false });
    await expect(
      schema.validate({
        ...baseValues,
        post_action_deep_link_android: "javascript:alert(1)",
        post_action_deep_link_ios: "intent://malicious",
      }),
    ).rejects.toBeTruthy();
  });

  test("accepts valid https and custom schemes", async () => {
    const schema = createActionSchema({ isProduction: true });
    await expect(
      schema.validate({
        ...baseValues,
        post_action_deep_link_android: "https://example.com/android",
        post_action_deep_link_ios: "worldapp://callback",
      }),
    ).resolves.toBeTruthy();
  });
});

// Regression for VULN-6369 / CE25-C014: the create/update action schema must
// reject SSRF-prone webhook_uri values (loopback, private, link-local, cloud
// metadata, non-HTTPS) so app-backend never fetches an internal target. The
// field-level webhook_uri test runs regardless of app_flow_on_complete, and —
// unlike the old behavior — is no longer skipped on the staging deployment.
describe("createActionSchema webhook_uri SSRF validation", () => {
  const withWebhook = (webhook_uri: string) => ({ ...baseValues, webhook_uri });

  test("rejects a cloud-metadata webhook_uri in production", async () => {
    const schema = createActionSchema({ isProduction: true });
    await expect(
      schema.validate(withWebhook("https://169.254.169.254/latest/meta-data/")),
    ).rejects.toBeTruthy();
  });

  test("rejects a loopback webhook_uri in staging (validation not skipped)", async () => {
    const schema = createActionSchema({ isProduction: false });
    await expect(
      schema.validate(withWebhook("https://127.0.0.1/hook")),
    ).rejects.toBeTruthy();
  });

  test("rejects a non-HTTPS webhook_uri", async () => {
    const schema = createActionSchema({ isProduction: true });
    await expect(
      schema.validate(withWebhook("http://collector.example.com/hook")),
    ).rejects.toBeTruthy();
  });

  test("accepts a public HTTPS webhook_uri", async () => {
    const schema = createActionSchema({ isProduction: true });
    await expect(
      schema.validate(withWebhook("https://collector.example.com/ce25")),
    ).resolves.toBeTruthy();
  });
});
