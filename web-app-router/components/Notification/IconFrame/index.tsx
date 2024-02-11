import clsx from "clsx";
import { NotificationVariant } from "..";
import { ReactNode } from "react";

export const IconFrame = (props: {
  variant: NotificationVariant;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={clsx(
        "relative rounded-full w-8 h-8 flex justify-center items-center",
        {
          "bg-blue-500": props.variant === "info",
          "bg-system-warning-500": props.variant === "warning",
        },
        props.className,
      )}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-grey-0 to-transparent opacity-20 pointer-events-none" />
      {props.children}
    </div>
  );
};
