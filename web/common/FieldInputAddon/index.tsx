import cn from "classnames";
import { memo, ReactNode } from "react";

export const FieldInputAddon = memo(function FieldInputAddon(props: {
  className?: string;
  position?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "absolute h-full grid grid-flow-col",
        { "left-0 pl-2": props.position === "start" },
        { "right-0 pr-2": props.position !== "start" },
        props.className
      )}
    >
      {props.children}
    </span>
  );
});
