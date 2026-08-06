import {
  bubbleDigitClassName,
  Icon,
  opticalIconClassName,
} from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import { Fragment } from "react";
import Skeleton from "react-loading-skeleton";
import {
  getWizardSteps,
  WizardStep,
  WizardStepConfig,
  WizardStepStatus,
} from "./wizard-steps";

// Row/connector/step geometry, shared with StepperSkeleton so the loading
// state wraps at exactly the same widths as the real stepper.
// flex-wrap: on narrow windows the row breaks into lines instead of ever
// producing a horizontal scrollbar.
const stepperRowClassName = "flex flex-wrap items-center justify-center gap-4";
const stepperConnectorClassName = "h-px w-8";
const stepperStepClassName = "flex items-center gap-2";
const stepperLabelClassName =
  "text-13 leading-[1.2] font-medium whitespace-nowrap";

/**
 * Numbered-dot step indicator across the top of the configuration wizard.
 * Completion is supplied by the wizard's last successfully saved field snapshot
 * snapshot; it must never be inferred from navigation or unsaved field input.
 */
export const Stepper = (props: {
  steps: WizardStepConfig[];
  activeIndex: number;
  stepStatuses: Record<WizardStep, WizardStepStatus>;
  onStepSelect?: (step: WizardStep) => void;
}) => (
  <ol className={stepperRowClassName}>
    {props.steps.map((step, index) => {
      const isActive = index === props.activeIndex;
      const stepStatus = props.stepStatuses[step.id];
      const isCompleted = stepStatus === "complete";
      const hasValidationError = stepStatus === "error";
      const previousStep = props.steps[index - 1];
      const isPreviousStepComplete =
        previousStep && props.stepStatuses[previousStep.id] === "complete";
      const accessibleStepState = isCompleted
        ? "complete"
        : hasValidationError
          ? "needs attention"
          : "incomplete";
      return (
        <Fragment key={step.id}>
          {index > 0 && (
            <li
              aria-hidden="true"
              className={clsx(
                stepperConnectorClassName,
                opticalIconClassName,
                isPreviousStepComplete ? "bg-[#00c230]" : "bg-portal-border",
              )}
            />
          )}
          <li aria-current={isActive ? "step" : undefined}>
            <button
              type="button"
              onClick={() => props.onStepSelect?.(step.id)}
              aria-label={`${step.label}, ${isActive ? "current step, " : ""}${accessibleStepState}`}
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
                // Inactive complete steps stay green but dimmed so the active
                // step (ring + full opacity) remains the clear focus.
                <span
                  className={clsx(
                    "flex size-5 items-center justify-center rounded-full bg-[#00c230]",
                    opticalIconClassName,
                    isActive
                      ? "ring-2 ring-portal-ink ring-offset-2"
                      : "opacity-50",
                  )}
                >
                  <Icon name="radio-check" className="size-[13.333px]" />
                </span>
              ) : (
                <span
                  className={clsx(
                    "flex size-5 items-center justify-center rounded-full text-center text-13 leading-[1.2] font-medium",
                    opticalIconClassName,
                    hasValidationError
                      ? "border-2 border-[#ea392a] bg-white text-[#ea392a]"
                      : isActive
                        ? "bg-portal-ink text-white"
                        : "bg-portal-canvas text-portal-subtle",
                    // Same selection ring as complete+active — current step
                    // always reads as selected, complete or not.
                    isActive && "ring-2 ring-portal-ink ring-offset-2",
                  )}
                >
                  <span className={bubbleDigitClassName}>{index + 1}</span>
                </span>
              )}
              <span
                className={clsx(
                  stepperLabelClassName,
                  isActive
                    ? "font-semibold text-portal-ink"
                    : isCompleted
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
