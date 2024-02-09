import { Button, CommonButtonProps } from "@/components/Button";
import { ArrowUpIcon } from "@/components/Icons/ArrowUpIcon";
import { UserAddIcon } from "@/components/Icons/UserAddIcon";
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
          "p-6 flex justify-between items-end border border-grey-200 hover:border-blue-500 rounded-2xl group transition-colors",
          className,
        ),
      )}
      {...buttonProps}
    >
      <div className="grid grid-cols-auto/1fr gap-x-4">
        <div className="row-span-2 h-12 w-12 rounded-full flex justify-center items-center bg-blue-100 text-blue-500">
          {props.icon}
        </div>

        <Typography variant={TYPOGRAPHY.M3} className="self-end">
          {props.title}
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R5}
          className="text-grey-500 self-start"
        >
          {props.description}
        </Typography>
      </div>

      <div className="w-6 h-6 border border-grey-200 rounded-full flex justify-center items-center group-hover:border-blue-500 transition-colors">
        <ArrowUpIcon className="rotate-45 group-hover:text-blue-500 transition-colors" />
      </div>
    </Button>
  );
};
