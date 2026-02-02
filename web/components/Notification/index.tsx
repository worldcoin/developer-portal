import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { AlertIcon } from "../Icons/AlertIcon";
import { InformationCircleIcon } from "../Icons/InformationCircleIcon";
import { IconFrame } from "./IconFrame";

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
          "grid grid-cols-auto/1fr items-center gap-x-3 rounded-xl border p-5",
          {
            "border-system-warning-200 bg-system-warning-50":
              props.variant === "warning",
            "border-blue-100 bg-blue-50": props.variant === "info",
          },
          props.className,
        ),
      )}
    >
      <IconFrame variant={props.variant} className="-mt-px text-grey-0">
        {props.variant === "warning" && <AlertIcon className="size-4" />}

        {props.variant === "info" && (
          <InformationCircleIcon className="size-4 text-grey-0" />
        )}
      </IconFrame>

      {props.children}
    </div>
  );
};
