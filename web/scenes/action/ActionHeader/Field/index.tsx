import { memo, useCallback, useEffect } from "react";
import { useToggle } from "hooks/useToggle";
import { usePopperTooltip } from "react-popper-tooltip";
import cn from "classnames";
import { Icon, IconType } from "common/Icon";

interface FieldInterface {
  className?: string;
  label?: string;
  value: string;
  valueClassName?: string;
  icon?: IconType;
  copyable?: boolean;
  unchangeable?: boolean;
}

export const Field = memo(function Field(props: FieldInterface) {
  const copied = useToggle();

  const copy = useCallback(() => {
    navigator.clipboard.writeText(props.value);
    copied.toggleOn();
  }, [copied, props.value]);

  useEffect(() => {
    if (copied) {
      const timeoutId = setTimeout(() => copied.toggleOff(), 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [copied]);

  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } =
    usePopperTooltip({
      interactive: true,
      offset: [0, 8],
      placement: "top-start",
      delayShow: 1000,
    });

  const Component = props.copyable ? "button" : "div";

  return (
    <div
      className={cn(
        "inline-grid grid-flow-col gap-x-2 whitespace-nowrap",
        props.className
      )}
    >
      {!!props.label && <>{props.label}:</>}
      <Component
        ref={setTriggerRef}
        className={cn("inline-grid grid-flow-col gap-x-1", {
          "text-primary": props.copyable,
        })}
        onClick={props.copyable ? copy : undefined}
        type={props.copyable ? "button" : undefined}
      >
        {props.icon && <Icon name={props.icon} className="w-4 h-4 mr-1" />}
        <span className={props.valueClassName}>{props.value}</span>
        {props.copyable && (
          <Icon name={copied.isOn ? "check" : "copy"} className="w-4 h-4" />
        )}
      </Component>
      {visible && props.unchangeable && (
        <div
          ref={setTooltipRef}
          {...getTooltipProps({
            className:
              "bg-primary rounded-lg pl-5 pr-2.5 py-2 max-w-[233px] relative",
          })}
        >
          <div
            className={cn(
              "absolute w-3 h-3 -bottom-1 left-8 rounded-[2.5px] rotate-45 bg-primary z-0"
            )}
          />

          <span className="leading-none text-12 text-ffffff">
            To change these settings, you need to create a new action.
          </span>
        </div>
      )}
    </div>
  );
});
