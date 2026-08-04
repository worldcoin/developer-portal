import {
  BasicInformationFormValues,
  reviewSchema as basicInformationReviewSchema,
} from "../BasicInformation/form-schema";
import { mainAppStoreFormReviewSubmitSchema } from "../AppStore/FormSchema/form-schema";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";
import { WizardStep, WizardStepStatus } from "./Stepper";

type WizardReviewValidationValues = AppStoreFormValues & {
  content_card_image_url?: string | null;
};

export type WizardStepStatusInputs = {
  isMiniApp: boolean;
  basicInformationDraftValues: Partial<BasicInformationFormValues>;
  appStoreFormValues: AppStoreFormValues;
  resolvedLogoImageUrl?: string | null;
  resolvedContentCardImageUrl?: string | null;
  shouldShowIncompleteReviewStepsAsErrors: boolean;
};

const isNonEmptyString = (value?: string | null) => Boolean(value?.trim());

const isReviewSchemaPathValid = (
  wizardReviewValidationValues: WizardReviewValidationValues,
  fieldPath: string,
  isMiniApp: boolean,
) => {
  try {
    mainAppStoreFormReviewSubmitSchema.validateSyncAt(
      fieldPath,
      wizardReviewValidationValues,
      {
        strict: true,
        context: { isMiniApp },
      },
    );
    return true;
  } catch {
    return false;
  }
};

const isBasicInformationComplete = (
  basicInformationDraftValues: Partial<BasicInformationFormValues>,
  resolvedLogoImageUrl?: string | null,
) => {
  try {
    basicInformationReviewSchema.validateSync(basicInformationDraftValues, {
      abortEarly: false,
      strict: true,
    });
    return isNonEmptyString(resolvedLogoImageUrl);
  } catch {
    return false;
  }
};

const isStoreListingComplete = (
  wizardReviewValidationValues: WizardReviewValidationValues,
) => {
  const currentSupportType = wizardReviewValidationValues.support_type;
  const supportContactFieldPath =
    currentSupportType === "link" ? "support_link" : "support_email";

  return [
    "category",
    "content_card_image_url",
    "support_type",
    supportContactFieldPath,
    "is_android_only",
    "is_for_humans_only",
  ].every((fieldPath) =>
    isReviewSchemaPathValid(wizardReviewValidationValues, fieldPath, true),
  );
};

const isAvailabilityComplete = (
  wizardReviewValidationValues: WizardReviewValidationValues,
  isMiniApp: boolean,
) =>
  ["supported_countries", "supported_languages"].every((fieldPath) =>
    isReviewSchemaPathValid(wizardReviewValidationValues, fieldPath, isMiniApp),
  );

const isLocalisedContentComplete = (
  wizardReviewValidationValues: WizardReviewValidationValues,
  isMiniApp: boolean,
) =>
  isReviewSchemaPathValid(
    wizardReviewValidationValues,
    "localisations",
    isMiniApp,
  );

const getRequiredStepStatus = (
  isStepComplete: boolean,
  shouldShowIncompleteReviewStepsAsErrors: boolean,
): WizardStepStatus => {
  if (isStepComplete) return "complete";
  return shouldShowIncompleteReviewStepsAsErrors ? "error" : "incomplete";
};

/**
 * Computes readiness from persisted values instead of navigation history.
 * This is intentionally side-effect free: the stepper needs a truthful status
 * without creating form errors just because a user navigated through the
 * wizard.
 */
export const getWizardStepStatuses = (
  inputs: WizardStepStatusInputs,
): Record<WizardStep, WizardStepStatus> => {
  const wizardReviewValidationValues: WizardReviewValidationValues = {
    ...inputs.appStoreFormValues,
    content_card_image_url: inputs.resolvedContentCardImageUrl,
  };

  return {
    [WizardStep.BASIC]: getRequiredStepStatus(
      isBasicInformationComplete(
        inputs.basicInformationDraftValues,
        inputs.resolvedLogoImageUrl,
      ),
      inputs.shouldShowIncompleteReviewStepsAsErrors,
    ),
    [WizardStep.STORE_LISTING]: inputs.isMiniApp
      ? getRequiredStepStatus(
          isStoreListingComplete(wizardReviewValidationValues),
          inputs.shouldShowIncompleteReviewStepsAsErrors,
        )
      : "neutral",
    // Permissions are useful configuration but currently have no submission
    // requirement. A checkmark would incorrectly imply a user completed it.
    [WizardStep.MINI_APP_PERMISSIONS]: "neutral",
    [WizardStep.AVAILABILITY]: getRequiredStepStatus(
      isAvailabilityComplete(wizardReviewValidationValues, inputs.isMiniApp),
      inputs.shouldShowIncompleteReviewStepsAsErrors,
    ),
    [WizardStep.LOCALISED_CONTENT]: getRequiredStepStatus(
      isLocalisedContentComplete(
        wizardReviewValidationValues,
        inputs.isMiniApp,
      ),
      inputs.shouldShowIncompleteReviewStepsAsErrors,
    ),
    // This is the destination where the user submits; opening it is not an
    // accomplishment, so it remains a numbered navigation step.
    [WizardStep.REVIEW]: "neutral",
  };
};
