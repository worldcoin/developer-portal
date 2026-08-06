import {
  BasicInformationFormValues,
  reviewSchema as basicInformationReviewSchema,
} from "../BasicInformation/form-schema";
import { mainAppStoreFormReviewSubmitSchema } from "../AppStore/FormSchema/form-schema";
import { AppStoreFormValues } from "../AppStore/FormSchema/types";

export enum WizardStep {
  BASIC = "basic-information",
  STORE_LISTING = "store-listing",
  MINI_APP_PERMISSIONS = "mini-app-permissions",
  AVAILABILITY = "availability",
  LOCALISED_CONTENT = "localised-content",
  REVIEW = "review-and-confirm",
}

export type WizardStepConfig = {
  id: WizardStep;
  label: string;
};

export type WizardStepStatus =
  | "complete"
  | "incomplete"
  | "error"
  | "untracked";

type AppStoreReviewValues = AppStoreFormValues & {
  content_card_image_url?: string | null;
};

export type WizardStepStatusInputs = {
  isMiniApp: boolean;
  basicInformationFieldSnapshot: Partial<BasicInformationFormValues>;
  appStoreFieldSnapshot: AppStoreFormValues;
  logoImageFieldSnapshot?: string | null;
  contentCardImageFieldSnapshot?: string | null;
  showReviewValidationErrors: boolean;
};

type ValidationField = {
  path: string;
  isRequired?: (values: AppStoreReviewValues) => boolean;
};

type StepCompletion =
  | { kind: "untracked" }
  | {
      kind: "custom";
      isComplete: (inputs: WizardStepStatusInputs) => boolean;
    }
  | { kind: "app-store-review-fields" };

type WizardStepDefinition = WizardStepConfig & {
  isVisible: (isMiniApp: boolean) => boolean;
  validationFields: readonly ValidationField[];
  completion: StepCompletion;
};

const isAlwaysVisible = () => true;
const isMiniAppStep = (isMiniApp: boolean) => isMiniApp;
const isNonEmptyString = (value?: string | null) => Boolean(value?.trim());

const isBasicInformationComplete = (inputs: WizardStepStatusInputs) => {
  try {
    basicInformationReviewSchema.validateSync(
      inputs.basicInformationFieldSnapshot,
      {
        abortEarly: false,
        strict: true,
      },
    );
    return isNonEmptyString(inputs.logoImageFieldSnapshot);
  } catch {
    return false;
  }
};

/**
 * One canonical definition of the wizard's steps, their visibility, the
 * validation fields they own, and how completion is measured. Error routing
 * and step statuses are both derived from this list so schema fields cannot
 * silently move between steps in only one of those flows.
 */
const WIZARD_STEP_DEFINITIONS: readonly WizardStepDefinition[] = [
  {
    id: WizardStep.BASIC,
    label: "Basic information",
    isVisible: isAlwaysVisible,
    validationFields: [
      { path: "basic_information" },
      { path: "integration_url" },
      { path: "app_website_url" },
      { path: "logo_img_url" },
    ],
    completion: { kind: "custom", isComplete: isBasicInformationComplete },
  },
  {
    id: WizardStep.STORE_LISTING,
    label: "Store listing",
    isVisible: isMiniAppStep,
    validationFields: [
      { path: "category" },
      { path: "content_card_image_url" },
      { path: "support_type" },
      {
        path: "support_email",
        isRequired: (values) => values.support_type === "email",
      },
      {
        path: "support_link",
        isRequired: (values) => values.support_type === "link",
      },
      { path: "is_android_only" },
      { path: "is_for_humans_only" },
    ],
    completion: { kind: "app-store-review-fields" },
  },
  {
    id: WizardStep.MINI_APP_PERMISSIONS,
    label: "Mini App Permissions",
    isVisible: isMiniAppStep,
    validationFields: [],
    // Permissions are useful configuration but currently have no submission
    // requirement. A checkmark would incorrectly imply completion.
    completion: { kind: "untracked" },
  },
  {
    id: WizardStep.AVAILABILITY,
    label: "Availability",
    isVisible: isAlwaysVisible,
    validationFields: [
      { path: "supported_countries" },
      { path: "supported_languages" },
    ],
    completion: { kind: "app-store-review-fields" },
  },
  {
    id: WizardStep.LOCALISED_CONTENT,
    label: "Localised content",
    isVisible: isAlwaysVisible,
    validationFields: [{ path: "localisations" }],
    completion: { kind: "app-store-review-fields" },
  },
  {
    id: WizardStep.REVIEW,
    label: "Review and confirm",
    isVisible: isAlwaysVisible,
    validationFields: [],
    // Review is the submission destination rather than a completion target.
    completion: { kind: "untracked" },
  },
];

const isAppStoreReviewFieldValid = (
  appStoreReviewValues: AppStoreReviewValues,
  fieldPath: string,
  isMiniApp: boolean,
) => {
  try {
    mainAppStoreFormReviewSubmitSchema.validateSyncAt(
      fieldPath,
      appStoreReviewValues,
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

const isPathOwnedByField = (fieldPath: string, ownedPath: string) =>
  fieldPath === ownedPath || fieldPath.startsWith(`${ownedPath}.`);

const getTrackedStepStatus = (
  isComplete: boolean,
  showReviewValidationErrors: boolean,
): WizardStepStatus => {
  if (isComplete) return "complete";
  return showReviewValidationErrors ? "error" : "incomplete";
};

export const getWizardSteps = (isMiniApp: boolean): WizardStepConfig[] =>
  WIZARD_STEP_DEFINITIONS.filter((step) => step.isVisible(isMiniApp)).map(
    ({ id, label }) => ({ id, label }),
  );

export const getWizardStepForField = (
  isMiniApp: boolean,
  fieldPath?: string,
): WizardStep => {
  if (!fieldPath) return WizardStep.BASIC;

  const owner = WIZARD_STEP_DEFINITIONS.filter((step) =>
    step.isVisible(isMiniApp),
  ).find((step) =>
    step.validationFields.some((field) =>
      isPathOwnedByField(fieldPath, field.path),
    ),
  );

  if (owner) return owner.id;
  return isMiniApp ? WizardStep.STORE_LISTING : WizardStep.BASIC;
};

/** Computes readiness from saved field snapshots without creating form errors. */
export const getWizardStepStatuses = (
  inputs: WizardStepStatusInputs,
): Record<WizardStep, WizardStepStatus> => {
  const appStoreReviewValues: AppStoreReviewValues = {
    ...inputs.appStoreFieldSnapshot,
    content_card_image_url: inputs.contentCardImageFieldSnapshot,
  };

  return WIZARD_STEP_DEFINITIONS.reduce(
    (stepStatuses, step) => {
      if (
        !step.isVisible(inputs.isMiniApp) ||
        step.completion.kind === "untracked"
      ) {
        stepStatuses[step.id] = "untracked";
        return stepStatuses;
      }

      const isComplete =
        step.completion.kind === "custom"
          ? step.completion.isComplete(inputs)
          : step.validationFields
              .filter(
                (field) =>
                  !field.isRequired || field.isRequired(appStoreReviewValues),
              )
              .every((field) =>
                isAppStoreReviewFieldValid(
                  appStoreReviewValues,
                  field.path,
                  inputs.isMiniApp,
                ),
              );

      stepStatuses[step.id] = getTrackedStepStatus(
        isComplete,
        inputs.showReviewValidationErrors,
      );
      return stepStatuses;
    },
    {} as Record<WizardStep, WizardStepStatus>,
  );
};
