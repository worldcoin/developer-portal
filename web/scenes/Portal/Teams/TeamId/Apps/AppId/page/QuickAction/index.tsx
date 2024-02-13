import { Button, CommonButtonProps } from "@/components/Button";
import { ArrowUpIcon } from "@/components/Icons/ArrowUpIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const QuickAction = (
  props: CommonButtonProps & {
    icon: ReactNode;
    title: string;
    description: string;
  },
) => {
  const { icon, className, ...buttonProps } = props;

  return (
    <Button
      className={twMerge(
        clsx(
          "group grid grid-cols-1fr/auto items-center justify-between rounded-2xl border border-grey-200 p-6 transition-colors hover:border-blue-500",
          className,
        ),
      )}
      {...buttonProps}
    >
      <div className="grid grid-cols-auto/1fr gap-x-4">
        <div className="row-span-2 flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-500">
          {props.icon}
        </div>

        <Typography variant={TYPOGRAPHY.M3} className="self-end">
          {props.title}
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R5}
          className="self-start text-grey-500"
        >
          {props.description}
        </Typography>
      </div>
      <div className="flex h-full items-end">
        <div className="flex size-6 items-center justify-center rounded-full border border-grey-200 transition-colors group-hover:border-blue-500">
          <ArrowUpIcon className="rotate-45 text-grey-400 transition-colors group-hover:text-blue-500" />
        </div>
      </div>
    </Button>
  );
};
