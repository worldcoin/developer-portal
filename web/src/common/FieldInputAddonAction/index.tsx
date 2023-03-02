import cn from "classnames";
import { memo, ReactNode } from "react";

export const FieldInputAddonAction = memo(
  function FieldInputAddonAction(props: {
    className?: string;
    children: ReactNode;
    onClick?: () => void;
    href?: string;
    target?: string;
  }) {
    const Component = props.href ? "a" : props.onClick ? "button" : "div";

    return (
      <Component
        type={props.onClick ? "button" : undefined}
        className={cn(
          "h-full px-2 grid items-center justify-center",
          { "cursor-pointer": props.onClick || props.href },
          props.className
        )}
        onClick={props.onClick}
        href={props.href}
        target={Component === "a" ? props.target : undefined}
      >
        {props.children}
      </Component>
    );
  }
);
