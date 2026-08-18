import {
  getWizardStepForField,
  getWizardSteps,
  WizardStep,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/wizard-steps";

describe("getWizardSteps", () => {
  it("includes Store listing and permissions only for mini apps", () => {
    expect(getWizardSteps(true).map((step) => step.id)).toEqual([
      WizardStep.BASIC,
      WizardStep.STORE_LISTING,
      WizardStep.AVAILABILITY,
      WizardStep.LOCALISED_CONTENT,
      WizardStep.MINI_APP_PERMISSIONS,
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
  it("routes owned fields to their step and falls back by app type", () => {
    expect(getWizardStepForField(true, undefined)).toBe(WizardStep.BASIC);
    expect(getWizardStepForField(true, "logo_img_url")).toBe(WizardStep.BASIC);
    expect(getWizardStepForField(true, "supported_countries")).toBe(
      WizardStep.AVAILABILITY,
    );
    expect(getWizardStepForField(true, "localisations.1.short_name")).toBe(
      WizardStep.LOCALISED_CONTENT,
    );
    // Unowned store fields: Store listing for mini apps, Basic otherwise
    // (external apps never render that step).
    expect(getWizardStepForField(true, "category")).toBe(
      WizardStep.STORE_LISTING,
    );
    expect(getWizardStepForField(false, "category")).toBe(WizardStep.BASIC);
  });
});
