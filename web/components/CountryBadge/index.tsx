import clsx from "clsx";
import { ReactNode } from "react";

type CountryBadgeProps = {
  children: ReactNode;
  focused?: boolean;
  onClick?: () => void;
  className?: string;
  isError?: boolean;
};

export const CountryBadge = (props: CountryBadgeProps) => {
  return (
    <div
      onClick={props.onClick}
      className={clsx(
        "flex h-8 cursor-pointer items-center gap-x-2 rounded-full border border-edge-subtle pr-3 pl-1.5 hover:bg-surface-muted",
        { "bg-surface-muted": props.focused },
        { "border-edge-error-600": props.isError },
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
