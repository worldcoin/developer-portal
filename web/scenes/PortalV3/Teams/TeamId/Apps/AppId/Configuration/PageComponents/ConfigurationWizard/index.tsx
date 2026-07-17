"use client";

import { ProgressBar } from "@/components/ProgressBar";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export enum ConfigurationWizardStep {
  BASIC = "basic",
  STORE_LISTING = "store-listing",
  AVAILABILITY = "availability",
  LOCALIZED_CONTENT = "localized-content",
}

export type ConfigurationStep = {
  id: ConfigurationWizardStep;
  number: string;
  title: string;
  description: string;
};

export const getConfigurationSteps = (
  isMiniApp: boolean,
): ConfigurationStep[] => {
  const steps: ConfigurationStep[] = [
    {
      id: ConfigurationWizardStep.BASIC,
      number: "01",
      title: "Basic information",
      description:
        "Start with the details people need to recognize and open your app.",
    },
  ];

  if (isMiniApp) {
    steps.push({
      id: ConfigurationWizardStep.STORE_LISTING,
      number: "02",
      title: "Store listing",
      description:
        "Shape how your app appears when people discover it in the store.",
    });
  }

  steps.push(
    {
      id: ConfigurationWizardStep.AVAILABILITY,
      number: isMiniApp ? "03" : "02",
      title: "Availability",
      description:
        "Choose the countries and languages where your app can launch.",
    },
    {
      id: ConfigurationWizardStep.LOCALIZED_CONTENT,
      number: isMiniApp ? "04" : "03",
      title: "Localized content",
      description:
        "Make your listing feel native in every language you support.",
    },
  );

  return steps;
};

/**
 * Single source for a step's number/title/description. Falls back to the
 * first step ("basic", always present) so callers never handle undefined —
 * render sites only look up steps they actually render.
 */
export const getConfigurationStep = (
  isMiniApp: boolean,
  id: ConfigurationWizardStep,
): ConfigurationStep => {
  const steps = getConfigurationSteps(isMiniApp);
  return steps.find((step) => step.id === id) ?? steps[0];
};

export const getStepForField = (
  fieldPath?: string,
): ConfigurationWizardStep => {
  if (
    !fieldPath ||
    fieldPath === "basic_information" ||
    fieldPath === "logo_img_url"
  ) {
    return ConfigurationWizardStep.BASIC;
  }

  if (
    fieldPath.startsWith("supported_countries") ||
    fieldPath.startsWith("supported_languages")
  ) {
    return ConfigurationWizardStep.AVAILABILITY;
  }

  if (fieldPath.startsWith("localisations")) {
    return ConfigurationWizardStep.LOCALIZED_CONTENT;
  }

  return ConfigurationWizardStep.STORE_LISTING;
};

type ConfigurationWizardProps = {
  steps: ConfigurationStep[];
  activeStep: ConfigurationWizardStep;
};

/**
 * Standard progress treatment for the configuration flow. It sits above the
 * active section without a surrounding divider; Back and Continue handle
 * navigation separately at the bottom of the form column.
 */
export const ConfigurationWizard = ({
  steps,
  activeStep,
}: ConfigurationWizardProps) => {
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
        <Typography
          variant={TYPOGRAPHY.M5}
          className="shrink-0 text-grey-500 tabular-nums"
          aria-label={`Step ${currentStepNumber} of ${steps.length}`}
        >
          {currentStepNumber}/{steps.length}
        </Typography>
      </div>
      <ProgressBar
        value={currentStepNumber}
        max={steps.length}
        label="Configuration progress"
      />
    </div>
  );
};
