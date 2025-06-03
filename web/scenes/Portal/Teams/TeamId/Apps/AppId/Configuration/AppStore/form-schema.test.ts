import {
  schema,
  updateAppSupportInfoInitialSchema,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/form-schema";

describe("App Store Form Schema", () => {
  const baseValidData = {
    name: "Test App",
    short_name: "TestApp",
    category: "social",
    world_app_description: "Test description",
    world_app_button_text: "Open App",
    app_website_url: "https://example.com",
    description_overview: "Overview",
    description_how_it_works: "How it works",
    description_connect: "Connect description",
    is_android_only: false,
    is_for_humans_only: true,
    supported_countries: ["US"],
    supported_languages: ["en"],
  };

  describe("support contact validation", () => {
    test("passes when support_link is provided", async () => {
      const data = {
        ...baseValidData,
        support_link: "https://support.example.com",
        support_email: "",
      };

      await expect(schema.validate(data)).resolves.toBeDefined();
    });

    test("passes when support_email is provided", async () => {
      const data = {
        ...baseValidData,
        support_link: "",
        support_email: "support@example.com",
      };

      await expect(schema.validate(data)).resolves.toBeDefined();
    });

    test("fails when both support_link and support_email are provided", async () => {
      const data = {
        ...baseValidData,
        support_link: "https://support.example.com",
        support_email: "support@example.com",
      };

      await expect(schema.validate(data)).rejects.toThrow(
        "Either support link or support email must be provided",
      );
    });

    test("passes when support_link is a valid miniapp deeplink", async () => {
      const data = {
        ...baseValidData,
        support_link: "worldapp://mini-app?app_id=app_test_123",
        support_email: "",
      };

      await expect(schema.validate(data)).resolves.toBeDefined();
    });

    test("fails when neither support_link nor support_email is provided", async () => {
      const data = {
        ...baseValidData,
        support_link: "",
        support_email: "",
      };

      await expect(schema.validate(data)).rejects.toThrow(
        "Either support link or support email must be provided",
      );
    });

    test("fails when both fields are undefined", async () => {
      const data = {
        ...baseValidData,
        support_link: undefined,
        support_email: undefined,
      };

      await expect(schema.validate(data)).rejects.toThrow(
        "Either support link or support email must be provided",
      );
    });

    test("fails when support_link is invalid but support_email is empty", async () => {
      const data = {
        ...baseValidData,
        support_link: "invalid-url",
        support_email: "",
      };

      await expect(schema.validate(data)).rejects.toThrow();
    });

    test("fails when support_email is invalid but support_link is empty", async () => {
      const data = {
        ...baseValidData,
        support_link: "",
        support_email: "invalid-email",
      };

      await expect(schema.validate(data)).rejects.toThrow();
    });
  });

  describe("updateAppSupportInfoInitialSchema", () => {
    const baseSupportData = {
      app_metadata_id: "test-id",
      is_support_email: false,
      app_website_url: "https://example.com",
      supported_countries: ["US"],
      category: "social",
      is_android_only: false,
      is_for_humans_only: true,
    };

    test("passes when support_link is provided", async () => {
      const data = {
        ...baseSupportData,
        support_link: "https://support.example.com",
        support_email: "",
      };

      await expect(
        updateAppSupportInfoInitialSchema.validate(data),
      ).resolves.toBeDefined();
    });

    test("passes when support_email is provided", async () => {
      const data = {
        ...baseSupportData,
        support_link: "",
        support_email: "support@example.com",
      };

      await expect(
        updateAppSupportInfoInitialSchema.validate(data),
      ).resolves.toBeDefined();
    });

    test("fails when neither support contact method is provided", async () => {
      const data = {
        ...baseSupportData,
        support_link: "",
        support_email: "",
      };

      await expect(
        updateAppSupportInfoInitialSchema.validate(data),
      ).rejects.toThrow(
        "Either support link or support email must be provided",
      );
    });
  });
});
