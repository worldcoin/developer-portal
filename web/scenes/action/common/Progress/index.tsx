import { Icon } from "common/Icon";
import { Fragment, memo } from "react";
import { ProgressStep } from "scenes/action/types/progress-step";
import cn from "classnames";

export const Progress = memo(function Progress(props: {
  steps: Array<ProgressStep>;
  currentStep: ProgressStep;
}) {
  return (
    <div className="grid justify-between grid-flow-col overflow-x-auto gap-x-2">
      {props.steps.map((step, index) => (
        <Fragment key={`deployment-progress-step-${index}`}>
          <div
            className={cn(
              "grid grid-cols-auto/1fr gap-x-1 items-center",
              { "text-primary": step.finished },
              {
                "text-neutral":
                  !step.finished && !props.steps[index - 1]?.finished,
              }
            )}
          >
            <Icon
              name={
                step.value === props.currentStep.value
                  ? "checkmark-selected"
                  : "checkmark"
              }
              className="w-6 h-6"
            />
            <span className="whitespace-nowrap">{step.name}</span>
          </div>
          {index !== props.steps.length - 1 && (
            <Icon name="arrow-right" className="w-6 h-6" />
          )}
        </Fragment>
      ))}
    </div>
  );
});
