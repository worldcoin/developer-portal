import {
  getWizardStepForField,
  getWizardSteps,
  WizardStep,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/Stepper";

describe("getWizardSteps", () => {
  it("includes Store listing only for mini apps", () => {
    expect(getWizardSteps(true).map((step) => step.id)).toEqual([
      WizardStep.BASIC,
      WizardStep.STORE_LISTING,
      WizardStep.AVAILABILITY,
      WizardStep.LOCALISED_CONTENT,
      WizardStep.REVIEW,
    ]);
    expect(getWizardSteps(false).map((step) => step.id)).toEqual([
      WizardStep.BASIC,
      WizardStep.AVAILABILITY,
      WizardStep.LOCALISED_CONTENT,
      WizardStep.REVIEW,
    ]);
  });
});

describe("getWizardStepForField", () => {
  it("routes basic-info and logo failures to the first step", () => {
    expect(getWizardStepForField(true, undefined)).toBe(WizardStep.BASIC);
    expect(getWizardStepForField(true, "basic_information")).toBe(
      WizardStep.BASIC,
    );
    expect(getWizardStepForField(true, "logo_img_url")).toBe(WizardStep.BASIC);
  });

  it("routes availability fields", () => {
    expect(getWizardStepForField(true, "supported_countries")).toBe(
      WizardStep.AVAILABILITY,
    );
    expect(getWizardStepForField(false, "supported_languages.0")).toBe(
      WizardStep.AVAILABILITY,
    );
  });

  it("routes localisation paths", () => {
    expect(getWizardStepForField(true, "localisations.1.short_name")).toBe(
      WizardStep.LOCALISED_CONTENT,
    );
    expect(
      getWizardStepForField(false, "localisations.0.showcase_img_urls"),
    ).toBe(WizardStep.LOCALISED_CONTENT);
  });

  it("routes store fields to Store listing for mini apps, Basic otherwise", () => {
    // External apps never render the store-listing step, so its fields must
    // not route to a step that doesn't exist.
    expect(getWizardStepForField(true, "category")).toBe(
      WizardStep.STORE_LISTING,
    );
    expect(getWizardStepForField(true, "support_link")).toBe(
      WizardStep.STORE_LISTING,
    );
    expect(getWizardStepForField(false, "category")).toBe(WizardStep.BASIC);
  });
});
