"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

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
  onStepChange: (step: ConfigurationStepId) => void;
};

/**
 * Horizontal progress story for the configuration flow — the bare step row
 * only (no heading), floored beneath the panel so the form owns the screen.
 */
export const ConfigurationWizard = ({
  steps,
  activeStep,
  onStepChange,
}: ConfigurationWizardProps) => {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep),
  );

  return (
    <div className="shrink-0 border-t border-grey-100 pt-3">
      <nav aria-label="Configuration steps" className="overflow-x-auto pb-1">
        <ol
          className="grid min-w-[620px]"
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          }}
        >
          {steps.map((step, index) => {
            const isActive = step.id === activeStep;
            const isComplete = index < activeIndex;

            return (
              <li key={step.id} className="relative min-w-0">
                {index < steps.length - 1 && (
                  <span
                    aria-hidden
                    className={clsx(
                      "absolute top-4 right-[calc(-50%+1.25rem)] left-[calc(50%+1.25rem)] h-px transition-colors",
                      index < activeIndex ? "bg-blue-500" : "bg-grey-200",
                    )}
                  />
                )}

                <button
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => onStepChange(step.id)}
                  className="group relative z-10 flex w-full min-w-0 flex-col items-center gap-2 px-2 text-center"
                >
                  <span
                    className={clsx(
                      "grid size-8 place-items-center rounded-full border text-xs font-medium transition-colors",
                      isActive &&
                        "border-blue-500 bg-blue-500 text-white shadow-sm",
                      isComplete && "border-blue-500 bg-blue-50 text-blue-600",
                      !isActive &&
                        !isComplete &&
                        "group-hover:text-grey-600 border-grey-200 bg-grey-0 text-grey-400 group-hover:border-grey-300",
                    )}
                  >
                    {isComplete ? "✓" : step.number}
                  </span>
                  <Typography
                    variant={isActive ? TYPOGRAPHY.M5 : TYPOGRAPHY.R5}
                    className={clsx(
                      "max-w-full truncate transition-colors",
                      isActive
                        ? "text-grey-900"
                        : "text-grey-500 group-hover:text-grey-700",
                    )}
                  >
                    {step.title}
                  </Typography>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
