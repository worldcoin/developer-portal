import { localisationFormSchema } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/form-schema";
import {
  reviewSchema as basicReviewSchema,
  schema as basicSchema,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/BasicInformation/form-schema";

describe("BasicInformation editing schema", () => {
  it("accepts empty strings for all fields (autosave-friendly)", () => {
    expect(
      basicSchema.isValidSync({
        name: "",
        integration_url: "",
        app_website_url: "",
      }),
    ).toBe(true);
  });

  it("still rejects malformed integration_url", () => {
    expect(
      basicSchema.isValidSync({
        name: "ok",
        integration_url: "not a url",
        app_website_url: "",
      }),
    ).toBe(false);
  });

  it("review schema still rejects empty required fields", () => {
    expect(
      basicReviewSchema.isValidSync({
        name: "",
        integration_url: "",
        app_website_url: "",
      }),
    ).toBe(false);
  });
});

describe("AppStore localisationFormSchema", () => {
  it("accepts a freshly-added localisation with empty fields", () => {
    expect(
      localisationFormSchema.isValidSync(
        {
          language: "fr",
          name: "",
          short_name: "",
          world_app_description: "",
          description_overview: "",
          meta_tag_image_url: "",
          showcase_img_urls: [],
        },
        { context: { isMiniApp: true } },
      ),
    ).toBe(true);
  });

  it("rejects unknown keys via .noUnknown()", () => {
    expect(
      localisationFormSchema.isValidSync(
        {
          language: "en",
          something_else: "x",
        },
        { strict: true },
      ),
    ).toBe(false);
  });

  it("still rejects too-long values", () => {
    expect(
      localisationFormSchema.isValidSync({
        language: "en",
        name: "x".repeat(60),
      }),
    ).toBe(false);
  });
});
