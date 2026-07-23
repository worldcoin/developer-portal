"use client";

import { ProgressBar } from "@/components/ProgressBar";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import type { ReactNode } from "react";

export enum AppStoreWizardStep {
  BASIC = "basic",
  STORE_LISTING = "store-listing",
  AVAILABILITY = "availability",
  LOCALIZED_CONTENT = "localized-content",
}

export type AppStoreWizardStepConfig = {
  id: AppStoreWizardStep;
  number: string;
  title: string;
  description: string;
};

export const getAppStoreWizardSteps = (
  isMiniApp: boolean,
): AppStoreWizardStepConfig[] => {
  const steps: AppStoreWizardStepConfig[] = [
    {
      id: AppStoreWizardStep.BASIC,
      number: "01",
      title: "Basic information",
      description: "Set your app's icon, name, and links.",
    },
  ];

  if (isMiniApp) {
    steps.push({
      id: AppStoreWizardStep.STORE_LISTING,
      number: "02",
      title: "Store listing",
      description: "Choose a category and add support and compliance details.",
    });
  }

  steps.push(
    {
      id: AppStoreWizardStep.AVAILABILITY,
      number: isMiniApp ? "03" : "02",
      title: "Availability",
      description:
        "Choose the countries and languages where your app is available.",
    },
    {
      id: AppStoreWizardStep.LOCALIZED_CONTENT,
      number: isMiniApp ? "04" : "03",
      title: "Localized content",
      description:
        "Add a name, tag line, description, and images for each language.",
    },
  );

  return steps;
};

/**
 * Single source for a step's number/title/description. Falls back to the
 * first step ("basic", always present) so callers never handle undefined —
 * render sites only look up steps they actually render.
 */
export const getAppStoreWizardStep = (
  isMiniApp: boolean,
  id: AppStoreWizardStep,
): AppStoreWizardStepConfig => {
  const steps = getAppStoreWizardSteps(isMiniApp);
  return steps.find((step) => step.id === id) ?? steps[0];
};

export const getStepForField = (fieldPath?: string): AppStoreWizardStep => {
  if (
    !fieldPath ||
    fieldPath === "basic_information" ||
    fieldPath === "logo_img_url"
  ) {
    return AppStoreWizardStep.BASIC;
  }

  if (
    fieldPath.startsWith("supported_countries") ||
    fieldPath.startsWith("supported_languages")
  ) {
    return AppStoreWizardStep.AVAILABILITY;
  }

  if (fieldPath.startsWith("localisations")) {
    return AppStoreWizardStep.LOCALIZED_CONTENT;
  }

  return AppStoreWizardStep.STORE_LISTING;
};

type AppStoreWizardProps = {
  steps: AppStoreWizardStepConfig[];
  activeStep: AppStoreWizardStep;
  /** Optional cue aligned with the step count (e.g. verified/draft indicator). */
  accessory?: ReactNode;
};

/**
 * Standard progress treatment for the configuration flow. It sits above the
 * active section without a surrounding divider; Back and Continue handle
 * navigation separately at the bottom of the form column.
 */
export const AppStoreWizard = ({
  steps,
  activeStep,
  accessory,
}: AppStoreWizardProps) => {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep),
  );
  const currentStep = steps[activeIndex];
  const currentStepNumber = activeIndex + 1;

  return (
    <div className="grid shrink-0 gap-2">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <Typography
          variant={TYPOGRAPHY.M5}
          className="min-w-0 truncate text-grey-700"
        >
          {currentStep?.title}
        </Typography>
        <div className="flex shrink-0 items-center gap-2">
          {accessory}
          <Typography
            variant={TYPOGRAPHY.M5}
            className="shrink-0 text-grey-500 tabular-nums"
            aria-label={`Step ${currentStepNumber} of ${steps.length}`}
          >
            {currentStepNumber}/{steps.length}
          </Typography>
        </div>
      </div>
      <ProgressBar
        value={currentStepNumber}
        max={steps.length}
        label="Configuration progress"
      />
    </div>
  );
};
