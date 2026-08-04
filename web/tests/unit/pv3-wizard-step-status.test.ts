import { AppStoreFormValues } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/types";
import { getWizardStepStatuses } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/step-status";
import { WizardStep } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/Stepper";

const completeBasicInformationDraftValues = {
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
    basicInformationDraftValues: completeBasicInformationDraftValues,
    appStoreFormValues: completeMiniAppStoreFormValues,
    resolvedLogoImageUrl: "https://example.com/logo.png",
    resolvedContentCardImageUrl: "https://example.com/content-card.png",
    shouldShowIncompleteReviewStepsAsErrors: false,
    ...overrides,
  });

describe("Get Verified reactive step statuses", () => {
  it("does not mark blank earlier steps complete merely because navigation advanced", () => {
    const statuses = getStatuses({
      basicInformationDraftValues: {},
      appStoreFormValues: {} as AppStoreFormValues,
      resolvedLogoImageUrl: "",
      resolvedContentCardImageUrl: "",
    });

    expect(statuses[WizardStep.BASIC]).toBe("incomplete");
    expect(statuses[WizardStep.STORE_LISTING]).toBe("incomplete");
    expect(statuses[WizardStep.AVAILABILITY]).toBe("incomplete");
    expect(statuses[WizardStep.LOCALISED_CONTENT]).toBe("incomplete");
  });

  it("marks only genuinely review-ready sections complete", () => {
    const statuses = getStatuses();

    expect(statuses[WizardStep.BASIC]).toBe("complete");
    expect(statuses[WizardStep.STORE_LISTING]).toBe("complete");
    expect(statuses[WizardStep.AVAILABILITY]).toBe("complete");
    expect(statuses[WizardStep.LOCALISED_CONTENT]).toBe("complete");
    expect(statuses[WizardStep.MINI_APP_PERMISSIONS]).toBe("neutral");
    expect(statuses[WizardStep.REVIEW]).toBe("neutral");
  });

  it("reacts to a previously complete section becoming incomplete", () => {
    const statuses = getStatuses({
      appStoreFormValues: {
        ...completeMiniAppStoreFormValues,
        supported_countries: [],
      },
    });

    expect(statuses[WizardStep.AVAILABILITY]).toBe("incomplete");
    expect(statuses[WizardStep.BASIC]).toBe("complete");
  });

  it("shows errors only after a review submission attempt", () => {
    const statuses = getStatuses({
      basicInformationDraftValues: {},
      resolvedLogoImageUrl: "",
      shouldShowIncompleteReviewStepsAsErrors: true,
    });

    expect(statuses[WizardStep.BASIC]).toBe("error");
    expect(statuses[WizardStep.STORE_LISTING]).toBe("complete");
  });

  it("does not apply store-listing completion requirements to external apps", () => {
    const statuses = getStatuses({ isMiniApp: false });

    expect(statuses[WizardStep.STORE_LISTING]).toBe("neutral");
    expect(statuses[WizardStep.AVAILABILITY]).toBe("complete");
    expect(statuses[WizardStep.LOCALISED_CONTENT]).toBe("complete");
  });
});
