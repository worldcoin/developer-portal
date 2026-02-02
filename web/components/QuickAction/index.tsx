import { Button, CommonButtonProps } from "@/components/Button";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { ArrowUpIcon } from "../Icons/ArrowUpIcon";

// TODO: prevent title and description overflow
export const QuickAction = (
  props: CommonButtonProps & {
    icon: ReactNode;
    title: string;
    description: string;
    children?: ReactNode;
    iconRight?: ReactNode;
    hideArrow?: boolean;
  },
) => {
  const { icon, className, children, iconRight, hideArrow, ...buttonProps } =
    props;

  return (
    <Button
      className={twMerge(
        clsx(
          "group grid grid-cols-1fr/auto items-center justify-between rounded-2xl border border-grey-200 p-6 transition-colors hover:border-blue-600",
          className,
        ),
      )}
      {...buttonProps}
    >
      <div className="flex gap-x-4">
        <div className=" flex size-12 items-center justify-center rounded-full bg-additional-blue-100 text-additional-blue-600">
          {icon}
        </div>

        <div className="flex flex-col">
          <Typography variant={TYPOGRAPHY.M3} className="self-start">
            {props.title}
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R5}
            className="self-start text-grey-500"
          >
            {props.description}
          </Typography>
        </div>
        {iconRight && (
          <div className="flex size-12 items-center justify-center">
            {iconRight}
          </div>
        )}
      </div>
      {children && (
        <div className="col-span-2 flex justify-center">{children}</div>
      )}
      {!hideArrow && (
        <div className="flex h-full items-end">
          <div className="flex size-6 items-center justify-center rounded-full border border-grey-200 transition-colors group-hover:border-blue-500">
            <ArrowUpIcon className="rotate-45 text-grey-400 transition-colors group-hover:text-blue-500" />
          </div>
        </div>
      )}
    </Button>
  );
};
