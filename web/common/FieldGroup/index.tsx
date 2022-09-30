import cn from "classnames";
import { memo, ReactNode } from "react";

export const FieldGroup = memo(function FieldGroup(props: {
  className?: string;
  variant?: "small";
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "grid",
        { "gap-y-2": props.variant === "small" },
        { "gap-y-4": props.variant !== "small" }
      )}
    >
      <span
        className={cn(
          props.className,
          "text-16",
          { "font-normal leading-5": props.variant === "small" },
          { "font-medium leading-tight": props.variant !== "small" }
        )}
      >
        {props.label}
      </span>
      {props.children}
    </label>
  );
});
