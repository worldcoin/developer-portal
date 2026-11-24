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
  iconClassName?: string;
  icon?: ReactNode;
  children: ReactNode;
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "grid grid-cols-auto/1fr items-center gap-x-3 rounded-xl border p-5",
          {
            "border-edge-warning-200 bg-surface-warning-50":
              props.variant === "warning",
            "border-focus-soft bg-surface-info-faint": props.variant === "info",
          },
          props.className,
        ),
      )}
    >
      <IconFrame
        variant={props.variant}
        className={twMerge("text-grey-0", props.iconClassName)}
      >
        {props.icon ??
          (props.variant === "warning" ? (
            <AlertIcon className="size-4" />
          ) : (
            <InformationCircleIcon className="size-4 text-grey-0" />
          ))}
      </IconFrame>

      {props.children}
    </div>
  );
};
