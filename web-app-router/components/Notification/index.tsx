import { ReactNode } from "react";
import { IconFrame } from "./IconFrame";
import { AlertIcon } from "../Icons/AlertIcon";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { InformationCircleIcon } from "../Icons/InformationCircleIcon";

export type NotificationVariant = "warning" | "info";

export const Notification = (props: {
  className?: string;
  variant: NotificationVariant;
  children: ReactNode;
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "grid grid-cols-auto/1fr items-center gap-x-3 p-5 rounded-xl border",
          {
            "border-system-warning-200 bg-system-warning-50":
              props.variant === "warning",
            "border-blue-150 bg-blue-50": props.variant === "info",
          },
          props.className,
        ),
      )}
    >
      <IconFrame variant={props.variant} className="text-grey-0">
        {props.variant === "warning" && <AlertIcon className="w-4 h-4" />}

        {props.variant === "info" && (
          <InformationCircleIcon className="w-4 h-4 text-grey-0" />
        )}
      </IconFrame>

      {props.children}
    </div>
  );
};
