import { Dispatch, memo, ReactElement, SetStateAction, useRef } from "react";
import cn from "classnames";
import { Icon } from "src/components/Icon";
import { useToggle } from "src/hooks/useToggle";
import { useClickOutside } from "src/hooks/useClickOutside";

export function Selector<T extends any>(props: {
  className?: string;
  value: T;
  values: Array<T>;
  setValue: Dispatch<SetStateAction<T>>;
  render: (item: T) => ReactElement;
}) {
  const selectorRef = useRef<HTMLDivElement>(null);
  const toggle = useToggle();

  useClickOutside({
    target: selectorRef,
    onClickOutside: toggle.toggleOff,
  });

  return (
    <div className="relative cursor-pointer select-none">
      <div
        ref={selectorRef}
        className={cn(
          "grid items-center justify-between grid-flow-col py-3 px-4 border-2 rounded-xl auto-cols-max border-f3f4f5",
          "bg-f3f4f5 gap-x-20 transition-all",
          { "rounded-br-none rounded-bl-none bg-ffffff": toggle.isOn }
        )}
        onClick={toggle.toggle}
      >
        {props.render(props.value)}

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
              className={cn(
                "py-3 px-4 border-2 border-t-[0px] border-neutral-muted",
                {
                  "rounded-bl-xl rounded-br-xl": key >= props.values.length - 2,
                }
              )}
              key={key}
              onClick={() => props.setValue(item)}
            >
              {props.render(item)}
            </span>
          ))}
      </div>
    </div>
  );
}
