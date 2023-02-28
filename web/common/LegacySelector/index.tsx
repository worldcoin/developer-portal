import { Dispatch, memo, SetStateAction, useEffect, useRef } from "react";
import cn from "classnames";
import { Icon } from "common/Icon";
import { useToggle } from "common/hooks";
import { useClickOutside } from "common/hooks/use-click-outside";

export const Selector = memo(function Selector(props: {
  className?: string;
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  values: Array<string>;
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
        {props.value}

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
        {props.values
          .filter((i) => i !== props.value)
          .map((item, key) => (
            <span
              className={cn("p-5 border border-t-[0px] border-neutral-muted", {
                "rounded-bl-xl rounded-br-xl": key >= props.values.length - 2,
              })}
              key={key}
              onClick={() => props.setValue(item)}
            >
              {item}
            </span>
          ))}
      </div>
    </div>
  );
});
