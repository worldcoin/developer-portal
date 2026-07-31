import { getStepForField } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/PageComponents/AppStoreWizard";

describe("getStepForField", () => {
  it("routes basic-info and logo failures to the first step", () => {
    expect(getStepForField(undefined)).toBe("basic");
    expect(getStepForField("basic_information")).toBe("basic");
    expect(getStepForField("logo_img_url")).toBe("basic");
  });

  it("routes availability fields", () => {
    expect(getStepForField("supported_countries")).toBe("availability");
    expect(getStepForField("supported_languages.0")).toBe("availability");
  });

  it("routes localisation paths", () => {
    // Row-shaped aliases (top-level short_name etc.) are translated to
    // localisations.{en}.* by AppStoreActionsButton before this mapping
    // ever sees them, so the prefix check is the single localized branch.
    expect(getStepForField("localisations.1.short_name")).toBe(
      "localized-content",
    );
    expect(getStepForField("localisations.0.showcase_img_urls")).toBe(
      "localized-content",
    );
  });

  it("defaults the remaining store fields to Store listing", () => {
    expect(getStepForField("category")).toBe("store-listing");
    expect(getStepForField("support_link")).toBe("store-listing");
  });
});
