import clsx from "clsx";
import { ReactNode } from "react";
import { NotificationVariant } from "..";

export const IconFrame = (props: {
  variant: NotificationVariant;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={clsx(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full",
        {
          "bg-blue-500": props.variant === "info",
          "bg-system-warning-500": props.variant === "warning",
        },
        props.className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-grey-0 to-transparent opacity-20" />
      {props.children}
    </div>
  );
};
