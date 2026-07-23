import {
  localisationFormSchema,
  mainAppStoreFormReviewSubmitSchema as portalReviewSubmitSchema,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/form-schema";
import { mainAppStoreFormReviewSubmitSchema as portalV3ReviewSubmitSchema } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/form-schema";
import {
  reviewSchema as basicReviewSchema,
  schema as basicSchema,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/BasicInformation/form-schema";
import {
  reviewSchema as basicV3ReviewSchema,
  schema as basicV3Schema,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/BasicInformation/form-schema";

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

describe("PortalV3 BasicInformation tagline schema", () => {
  it("allows an empty tagline while autosaving a draft", () => {
    expect(
      basicV3Schema.isValidSync({
        name: "",
        world_app_description: "",
        integration_url: "",
        app_website_url: "",
      }),
    ).toBe(true);
  });

  it("requires a tagline for Mini App review only", () => {
    const values = {
      name: "Example",
      world_app_description: "",
      integration_url: "https://example.com/app",
      app_website_url: "https://example.com",
    };

    expect(
      basicV3ReviewSchema.isValidSync(values, {
        context: { isMiniApp: true },
      }),
    ).toBe(false);
    expect(
      basicV3ReviewSchema.isValidSync(values, {
        context: { isMiniApp: false },
      }),
    ).toBe(true);
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

// The Portal and PortalV3 review schemas are duplicated copies; test both so
// they can't silently drift apart.
describe.each([
  ["Portal", portalReviewSubmitSchema],
  ["PortalV3", portalV3ReviewSubmitSchema],
])("%s review submit schema — category vs mini app", (_name, schema) => {
  const validateCategory = (category: string | undefined, isMiniApp: boolean) =>
    schema.validateSyncAt("category", { category }, { context: { isMiniApp } });

  it("rejects the External category for mini apps", () => {
    expect(() => validateCategory("External", true)).toThrow();
  });

  it("rejects External case-insensitively for mini apps", () => {
    expect(() => validateCategory("external", true)).toThrow();
  });

  it("accepts a normal category for mini apps", () => {
    expect(() => validateCategory("Social", true)).not.toThrow();
  });

  it("does not require a category for non-mini apps", () => {
    expect(() => validateCategory(undefined, false)).not.toThrow();
  });
});
