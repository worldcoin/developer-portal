"use client";

import { ProgressBar } from "@/components/ProgressBar";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export type ConfigurationStepId =
  | "basic"
  | "store-listing"
  | "availability"
  | "localized-content";

export type ConfigurationStep = {
  id: ConfigurationStepId;
  number: string;
  title: string;
  description: string;
};

export const getConfigurationSteps = (
  isMiniApp: boolean,
): ConfigurationStep[] => {
  const steps: ConfigurationStep[] = [
    {
      id: "basic",
      number: "01",
      title: "Basic information",
      description:
        "Start with the details people need to recognize and open your app.",
    },
  ];

  if (isMiniApp) {
    steps.push({
      id: "store-listing",
      number: "02",
      title: "Store listing",
      description:
        "Shape how your app appears when people discover it in the store.",
    });
  }

  steps.push(
    {
      id: "availability",
      number: isMiniApp ? "03" : "02",
      title: "Availability",
      description:
        "Choose the countries and languages where your app can launch.",
    },
    {
      id: "localized-content",
      number: isMiniApp ? "04" : "03",
      title: "Localized content",
      description:
        "Make your listing feel native in every language you support.",
    },
  );

  return steps;
};

export const getStepForField = (fieldPath?: string): ConfigurationStepId => {
  if (
    !fieldPath ||
    fieldPath === "basic_information" ||
    fieldPath === "logo_img_url"
  ) {
    return "basic";
  }

  if (
    fieldPath.startsWith("supported_countries") ||
    fieldPath.startsWith("supported_languages")
  ) {
    return "availability";
  }

  if (fieldPath.startsWith("localisations")) {
    return "localized-content";
  }

  return "store-listing";
};

type ConfigurationWizardProps = {
  steps: ConfigurationStep[];
  activeStep: ConfigurationStepId;
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
