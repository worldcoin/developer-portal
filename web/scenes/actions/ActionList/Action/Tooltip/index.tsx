import { memo, ReactNode } from "react";
import { usePopperTooltip } from "react-popper-tooltip";
import cn from "classnames";

type TooltipProps = {
  className?: string;
  children: ReactNode;
} & ReturnType<typeof usePopperTooltip>;

export const Tooltip = memo(function Tooptip(props: TooltipProps) {
  if (!props.visible) {
    return null;
  }

  return (
    <div
      {...props.getTooltipProps({
        className: cn(
          "text-ffffff bg-primary text-12 px-5 py-2 rounded-lg before:absolute before:w-3 before:h-3",
          "before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:rounded-[2.5px] before:rotate-45 before:bg-primary before:z-0",
          props.className
        ),
      })}
      ref={props.setTooltipRef}
    >
      {props.children}
    </div>
  );
});
