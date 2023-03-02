import { memo, useRef } from "react";
import cn from "classnames";
import { Icon } from "src/common/Icon";
import { useClickOutside } from "src/hooks/useClickOutside";
import { StatsArgs } from "src/logics/actionLogic";
import { useToggle } from "src/hooks/useToggle";

export const Selector = memo(function Selector(props: {
  className?: string;
  value: StatsArgs["timespan"];
  changeTimespan: (timespan: StatsArgs["timespan"]) => void;
  values: {
    [key in StatsArgs["timespan"]]?: "Monthly" | "Weekly" | "Daily";
  };
}) {
  const selectorRef = useRef<HTMLDivElement>(null);
  const toggle = useToggle();

  useClickOutside({
    target: selectorRef,
    onClickOutside: toggle.toggleOff,
  });

  return (
    <div className="relative cursor-pointer">
      <div
        ref={selectorRef}
        className={cn(
          "grid items-center justify-between grid-flow-col p-5 pr-6 border rounded-xl auto-cols-max border-neutral-muted",
          "bg-ffffff gap-x-20 transition-all",
          { "rounded-br-none rounded-bl-none": toggle.isOn }
        )}
        onClick={toggle.toggle}
      >
        {props.values[props.value]}

        <Icon
          className={cn("w-6 h-6 transition-transform", {
            "rotate-180": toggle.isOn,
          })}
          name="angle-down"
        />
      </div>

      <div
        className={cn(
          "grid bg-ffffff absolute top-full overflow-hidden w-full rounded-bl-xl rounded-br-xl",
          { "max-h-screen": toggle.isOn },
          { "max-h-0": !toggle.isOn }
        )}
      >
        {Object.entries(props.values)
          .filter(([key]) => key !== props.value)
          .map(([key, value], index) => (
            <span
              className={cn("p-5 border border-t-[0px] border-neutral-muted", {
                "rounded-bl-xl rounded-br-xl": index !== 0,
              })}
              key={`graph-option-${index}`}
              onClick={() => props.changeTimespan(key as StatsArgs["timespan"])}
            >
              {value}
            </span>
          ))}
      </div>
    </div>
  );
});
