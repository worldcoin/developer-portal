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
