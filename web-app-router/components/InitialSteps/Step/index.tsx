import { CommonButtonProps } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const Step = (
  props: CommonButtonProps & {
    title: string;
    description: string;
    buttonText: string;
    icon: ReactNode;
    disabled?: boolean;
    completed?: boolean;
  }
) => {
  const {
    title,
    description,
    buttonText,
    icon,
    disabled,
    completed,
    className,
    ...buttonProps
  } = props;

  return (
    <div
      className={twMerge(
        clsx(
          "grid grid-cols-auto/1fr/auto p-5 border-t-[1px] first-of-type:border-t-0 gap-x-4 w-full",
          {
            "grayscale cursor-not-allowed select-none": disabled,
          },
          className
        )
      )}
    >
      {icon}

      <div className="grid grid-cols-1">
        <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
          {title}
        </Typography>

        <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
          {description}
        </Typography>
      </div>

      {!completed && (
        <DecoratedButton
          variant="primary"
          className="py-2.5 px-0 rounded-[.7rem] w-full min-w-[80px]"
          disabled={disabled}
          {...buttonProps}
        >
          <Typography variant={TYPOGRAPHY.M4}>{buttonText}</Typography>
        </DecoratedButton>
      )}

      {completed && (
        <div className="grid grid-cols-auto/1fr items-center gap-x-2 text-system-success-400 border border-system-success-400 rounded-lg px-2 py-2.5 w-full min-w-[80px] pointer-events-none select-none">
          <CheckIcon size="16" />
          <Typography variant={TYPOGRAPHY.M4}>Done</Typography>
        </div>
      )}
    </div>
  );
};
