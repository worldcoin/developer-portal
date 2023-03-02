import { useToggle } from "hooks/useToggle";
import { Icon } from "common/Icon";
import { memo, ReactNode, useEffect } from "react";
import cn from "classnames";
import { styles, text } from "common/styles";

export const Widget = memo(function Widget(
  props: {
    title: string;
    description?: string;
    children: ReactNode;
    buttonClassName?: string;
    childrenClassName?: string;
    className?: string;
  } & (
    | {
        expandable: boolean;
        opened?: boolean;
      }
    | {
        expandable?: never;
        opened?: never;
      }
  )
) {
  const widget = useToggle(props.expandable ? props.opened : true);

  useEffect(() => {
    if (!props.expandable) {
      return;
    }

    return props.opened ? widget.toggleOn() : widget.toggleOff();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we need only this deps, adding widget to deps makes incorrect behavior
  }, [props.expandable, props.opened]);

  return (
    <div
      className={cn(
        styles.container.shadowBox,
        "overflow-hidden",
        props.className
      )}
    >
      <button
        className={cn(
          "flex justify-between w-full items-center border-b border-neutral-muted p-5",
          props.buttonClassName
        )}
        onClick={widget.toggle}
        disabled={!props.expandable}
      >
        <div className="font-medium grid grid-flow-col justify-start items-center gap-x-4">
          <div className={text.h2}>{props.title}</div>

          {props.description && (
            <span className="text-14 text-neutral">{props.description}</span>
          )}
        </div>

        {props.expandable && (
          <Icon
            name="angle-down"
            className={cn("w-6 h-6 transition-transform duration-300", {
              "rotate-180": widget.isOn,
            })}
          />
        )}
      </button>

      <div
        className={cn(
          "transition-all duration-200",
          { "max-h-0": !widget.isOn },
          { "max-h-[5000px]": widget.isOn }
        )}
      >
        <div className={cn("p-8", props.childrenClassName)}>
          {props.children}
        </div>
      </div>
    </div>
  );
});
