import {
  bubbleDigitClassName,
  Icon,
  opticalIconClassName,
} from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import { Fragment } from "react";
import Skeleton from "react-loading-skeleton";

export enum WizardStep {
  BASIC = "basic-information",
  STORE_LISTING = "store-listing",
  AVAILABILITY = "availability",
  LOCALISED_CONTENT = "localised-content",
  REVIEW = "review-and-confirm",
}

export type WizardStepConfig = {
  id: WizardStep;
  label: string;
};

/**
 * Step list for the configuration wizard. Store listing only applies to mini
 * apps (external apps have no store presence to configure), mirroring the
 * previous page's 3-vs-4 step split.
 */
export const getWizardSteps = (isMiniApp: boolean): WizardStepConfig[] => [
  { id: WizardStep.BASIC, label: "Basic information" },
  ...(isMiniApp
    ? [{ id: WizardStep.STORE_LISTING, label: "Store listing" }]
    : []),
  { id: WizardStep.AVAILABILITY, label: "Availability" },
  { id: WizardStep.LOCALISED_CONTENT, label: "Localised content" },
  { id: WizardStep.REVIEW, label: "Review and confirm" },
];

/**
 * Routes a review-flow validation error to the wizard step that owns the
 * failing field, mirroring the previous page's getStepForField. Unrecognized
 * paths belong to the store-listing fields (category, support, content card,
 * compliance), which external apps render nowhere — fall back to Basic.
 */
export const getWizardStepForField = (
  isMiniApp: boolean,
  fieldPath?: string,
): WizardStep => {
  if (
    !fieldPath ||
    fieldPath === "basic_information" ||
    fieldPath === "logo_img_url"
  ) {
    return WizardStep.BASIC;
  }

  if (
    fieldPath.startsWith("supported_countries") ||
    fieldPath.startsWith("supported_languages")
  ) {
    return WizardStep.AVAILABILITY;
  }

  if (fieldPath.startsWith("localisations")) {
    return WizardStep.LOCALISED_CONTENT;
  }

  return isMiniApp ? WizardStep.STORE_LISTING : WizardStep.BASIC;
};

// Row/connector/step geometry, shared with StepperSkeleton so the loading
// state wraps at exactly the same widths as the real stepper.
// flex-wrap: on narrow windows the row breaks into lines instead of ever
// producing a horizontal scrollbar.
const stepperRowClassName = "flex flex-wrap items-center justify-center gap-4";
const stepperConnectorClassName = clsx(
  "h-px w-8 bg-portal-border",
  opticalIconClassName,
);
const stepperStepClassName = "flex items-center gap-2";
const stepperLabelClassName =
  "text-13 leading-[1.2] font-medium whitespace-nowrap";

/**
 * Numbered-dot step indicator across the top of the configuration wizard.
 * True to the Figma frames: steps behind the active one show the green
 * check, the active and upcoming ones show their number. Each step is a
 * button that jumps straight to it.
 */
export const Stepper = (props: {
  steps: WizardStepConfig[];
  activeIndex: number;
  onStepSelect?: (step: WizardStep) => void;
}) => (
  <ol className={stepperRowClassName}>
    {props.steps.map((step, index) => {
      const isActive = index === props.activeIndex;
      const isCompleted = index < props.activeIndex;
      return (
        <Fragment key={step.id}>
          {index > 0 && (
            <li aria-hidden="true" className={stepperConnectorClassName} />
          )}
          <li aria-current={isActive ? "step" : undefined}>
            <button
              type="button"
              onClick={() => props.onStepSelect?.(step.id)}
              className={clsx(
                stepperStepClassName,
                "cursor-pointer transition-opacity hover:opacity-70",
              )}
            >
              {/* Both bubble variants and the connector carry the same 1px
                  optical lift against the cap-height label — correcting only
                  one would misalign the markers against each other. */}
              {isCompleted ? (
                // Figma nucleus/status-success (#00c230) — no portal token
                // for it yet (closest, additional-green-500, is #00c313).
                <span
                  className={clsx(
                    "flex size-5 items-center justify-center rounded-full bg-[#00c230]",
                    opticalIconClassName,
                  )}
                >
                  <Icon name="radio-check" className="size-[13.333px]" />
                </span>
              ) : (
                <span
                  className={clsx(
                    "flex size-5 items-center justify-center rounded-full text-center text-13 leading-[1.2] font-medium",
                    opticalIconClassName,
                    isActive
                      ? "bg-portal-ink text-white"
                      : "bg-portal-canvas text-portal-subtle",
                  )}
                >
                  <span className={bubbleDigitClassName}>{index + 1}</span>
                </span>
              )}
              <span
                className={clsx(
                  stepperLabelClassName,
                  isActive || isCompleted
                    ? "text-portal-ink"
                    : "text-portal-subtle",
                )}
              >
                {step.label}
              </span>
            </button>
          </li>
        </Fragment>
      );
    })}
  </ol>
);

/**
 * Loading twin of Stepper: same row, connector, bubble and label geometry, so
 * it reserves the height the real stepper will occupy and breaks onto the same
 * number of lines at every width — a fixed-height bar would jump by 36px per
 * wrapped line once data arrived.
 *
 * Sized to the external-app step list, the narrowest real variant; each label
 * reserves its true text width by rendering the real string invisibly, with
 * shimmer painted over it. Which step is active, and whether a fifth
 * store-listing step exists, are data we don't have yet — neither is asserted.
 */
export const StepperSkeleton = () => (
  <ol aria-hidden className={stepperRowClassName}>
    {getWizardSteps(false).map((step, index) => (
      <Fragment key={step.id}>
        {index > 0 && <li className={stepperConnectorClassName} />}
        <li>
          <span className={stepperStepClassName}>
            <Skeleton
              circle
              width={20}
              height={20}
              containerClassName={clsx("flex size-5", opticalIconClassName)}
            />
            <span className={clsx(stepperLabelClassName, "relative")}>
              <span className="invisible">{step.label}</span>
              <Skeleton
                height="100%"
                containerClassName="absolute inset-0 block"
              />
            </span>
          </span>
        </li>
      </Fragment>
    ))}
  </ol>
);
