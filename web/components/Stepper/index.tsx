import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { ReactNode } from "react";
import clsx from "clsx";
import { TrophyIcon } from "@/components/Icons/TrophyIcon";

type Step = {
  id: string;
  title: string;
  isCompleted?: boolean;
  isFinal?: boolean;
  icon?: ReactNode;
};

type StepperProps = {
  steps: Step[];
  className?: string;
};

export const Stepper = ({ steps, className = "" }: StepperProps) => {
  return (
    <div className={`relative ${className}`} role="list">
      <div className="space-y-1.5">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.id}
              className={`relative flex items-start ${!isLast ? "pb-[30px]" : ""}`}
              role="listitem"
            >
              {/* Connector segment (runs from this step to the next) */}
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-[17px] top-[26px] w-0.5 border-l-2 border-gray-200"
                />
              )}

              <div>
                {step.isFinal ? (
                  <IconFrame className="ml-0.5 mr-[12px] size-8 shrink-0 bg-blue-500 text-white">
                    {step.icon ?? <TrophyIcon className="h-4 w-4" />}
                  </IconFrame>
                ) : (
                  <span
                    className={`ml-[14px] mr-[26px] mt-2 block size-2 shrink-0 rounded-full ${
                      step.isFinal ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <Typography
                variant={step.isFinal ? TYPOGRAPHY.M4 : TYPOGRAPHY.R4}
                className={clsx("flex-1", {
                  "text-gray-500": !step.isFinal,
                })}
              >
                {step.title}
              </Typography>
            </div>
          );
        })}
      </div>
    </div>
  );
};
