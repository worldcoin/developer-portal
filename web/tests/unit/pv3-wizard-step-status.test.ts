import { AppStoreFormValues } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/types";
import {
  getWizardStepStatuses,
  WizardStep,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/wizard-steps";

const completeBasicInformationFieldSnapshot = {
  name: "Example Mini App",
  integration_url: "https://example.world.org",
  app_website_url: "https://example.com",
};

const completeMiniAppStoreFormValues: AppStoreFormValues = {
  category: "Utilities",
  support_type: "email",
  support_email: "support@example.com",
  support_link: "",
  is_android_only: false,
  is_for_humans_only: false,
  supported_countries: ["US"],
  supported_languages: ["en"],
  localisations: [
    {
      language: "en",
      name: "Example Mini App",
      short_name: "Example",
      world_app_description: "An example application",
      description_overview: "A complete description of this application.",
      meta_tag_image_url: "",
      showcase_img_urls: ["https://example.com/showcase.png"],
    },
  ],
};

const getStatuses = (
  overrides: Partial<Parameters<typeof getWizardStepStatuses>[0]> = {},
) =>
  getWizardStepStatuses({
    isMiniApp: true,
    basicInformationFieldSnapshot: completeBasicInformationFieldSnapshot,
    appStoreFieldSnapshot: completeMiniAppStoreFormValues,
    logoImageFieldSnapshot: "https://example.com/logo.png",
    contentCardImageFieldSnapshot: "https://example.com/content-card.png",
    showReviewValidationErrors: false,
    ...overrides,
  });

describe("wizard field-snapshot step statuses", () => {
  it("scores incomplete vs complete from field snapshots, and leaves permissions/review untracked", () => {
    const blank = getStatuses({
      basicInformationFieldSnapshot: {},
      appStoreFieldSnapshot: {} as AppStoreFormValues,
      logoImageFieldSnapshot: "",
      contentCardImageFieldSnapshot: "",
    });
    expect(blank[WizardStep.BASIC]).toBe("incomplete");
    expect(blank[WizardStep.STORE_LISTING]).toBe("incomplete");
    expect(blank[WizardStep.AVAILABILITY]).toBe("incomplete");
    expect(blank[WizardStep.LOCALISED_CONTENT]).toBe("incomplete");

    const ready = getStatuses();
    expect(ready[WizardStep.BASIC]).toBe("complete");
    expect(ready[WizardStep.STORE_LISTING]).toBe("complete");
    expect(ready[WizardStep.AVAILABILITY]).toBe("complete");
    expect(ready[WizardStep.LOCALISED_CONTENT]).toBe("complete");
    expect(ready[WizardStep.MINI_APP_PERMISSIONS]).toBe("untracked");
    expect(ready[WizardStep.REVIEW]).toBe("untracked");
  });

  it("surfaces errors only after a review submission attempt", () => {
    const statuses = getStatuses({
      basicInformationFieldSnapshot: {},
      logoImageFieldSnapshot: "",
      showReviewValidationErrors: true,
    });

    expect(statuses[WizardStep.BASIC]).toBe("error");
    expect(statuses[WizardStep.STORE_LISTING]).toBe("complete");
  });

  it("does not apply store-listing completion requirements to external apps", () => {
    const statuses = getStatuses({ isMiniApp: false });

    expect(statuses[WizardStep.STORE_LISTING]).toBe("untracked");
    expect(statuses[WizardStep.AVAILABILITY]).toBe("complete");
    expect(statuses[WizardStep.LOCALISED_CONTENT]).toBe("complete");
  });
});
