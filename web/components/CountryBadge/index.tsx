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
        "grid cursor-pointer grid-cols-auto/1fr items-center gap-x-2 rounded-2xl border border-grey-70 px-2.5 py-1.5 hover:bg-grey-100",
        { "bg-grey-100": props.focused },
        { "border-system-error-600": props.isError },
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
