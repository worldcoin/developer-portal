import { Icon, IconType } from "common/Icon";
import { Fragment, memo, ReactNode, useCallback, useEffect } from "react";
import cn from "classnames";
import { FieldControl } from "./FieldControl";
import { usePopperTooltip } from "react-popper-tooltip";
import { useToggle } from "common/hooks";

export const Field = memo(function Field(props: {
  className?: string;
  copyable?: boolean;
  customControls?: ReactNode;
  fieldClassName?: string;
  icon?: IconType;
  labelPosition?: "left" | "top";
  name: string;
  tooltip?: string;
  value: string;
}) {
  const copied = useToggle();

  const copy = useCallback(() => {
    navigator.clipboard.writeText(props.value);
    copied.toggleOn();
  }, [copied, props.value]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => copied.toggleOff(), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } =
    usePopperTooltip({
      interactive: true,
      offset: [30, 8],
      placement: "top-start",
      delayShow: 1000,
    });

  return (
    <div
      className={cn(
        "grid relative",
        props.labelPosition === "top"
          ? "grid-flow-row items-start justify-stretch gap-y-4"
          : "grid-flow-col items-center justify-start gap-x-4",
        props.className
      )}
    >
      <span
        className={cn(
          props.labelPosition === "top"
            ? "justify-self-start"
            : "justify-self-end",
          "font-medium whitespace-nowrap"
        )}
      >
        {props.name}
      </span>

      <div
        ref={setTriggerRef}
        className={cn(
          "grid grid-flow-col justify-stretch gap-x-2 items-center bg-fbfbfb border border-d1d3d4 rounded-xl py-2 px-4.5",
          props.fieldClassName
        )}
      >
        <div className="grid items-center justify-start grid-flow-col gap-x-2">
          {/* NOTE tooltip */}
          {visible && props.tooltip && (
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
                {props.tooltip}
              </span>
            </div>
          )}

          {props.icon && <Icon name={props.icon} className="w-6 h-6" />}
          <span>{props.value}</span>
        </div>

        <div className="grid items-center justify-end grid-flow-col gap-x-2">
          {props.customControls}

          {props.copyable && (
            <Fragment>
              {!copied.isOn && <FieldControl icon="copy" onClick={copy} />}
              {copied.isOn && <FieldControl icon="check" onClick={() => {}} />}
            </Fragment>
          )}
        </div>
      </div>
    </div>
  );
});
