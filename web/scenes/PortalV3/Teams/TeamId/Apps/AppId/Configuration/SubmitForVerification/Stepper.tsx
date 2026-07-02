"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

type StepperProps = {
  steps: ReadonlyArray<{ id: string; label: string }>;
  current: number;
  onStepClick?: (index: number) => void;
  className?: string;
};

/**
 * Small horizontal stepper. Purely presentational — the active step is driven by
 * the parent wizard. Completed steps show a check, the active step is outlined,
 * upcoming steps are muted. Steps are clickable so users can jump around.
 */
export const Stepper = ({
  steps,
  current,
  onStepClick,
  className,
}: StepperProps) => {
  return (
    <div className={clsx("flex w-full items-center", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < current;
        const isActive = index === current;
        const isLast = index === steps.length - 1;

        return (
          <div
            key={step.id}
            className={clsx("flex items-center", !isLast && "flex-1")}
          >
            <button
              type="button"
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className="flex shrink-0 items-center gap-x-2"
            >
              <span
                className={clsx(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isCompleted && "border-grey-900 bg-grey-900 text-white",
                  isActive && "border-grey-900 bg-white text-grey-900",
                  !isCompleted &&
                    !isActive &&
                    "border-grey-200 bg-white text-grey-400",
                )}
              >
                {isCompleted ? (
                  <CheckIcon size="16" className="size-3" />
                ) : (
                  <Typography variant={TYPOGRAPHY.R5}>{index + 1}</Typography>
                )}
              </span>

              <Typography
                variant={TYPOGRAPHY.R5}
                className={clsx(
                  "hidden whitespace-nowrap sm:block",
                  isActive ? "text-grey-900" : "text-grey-400",
                )}
              >
                {step.label}
              </Typography>
            </button>

            {!isLast && (
              <div
                className={clsx(
                  "mx-2 h-px flex-1",
                  isCompleted ? "bg-grey-900" : "bg-grey-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
