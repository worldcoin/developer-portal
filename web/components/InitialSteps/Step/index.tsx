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
  },
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
          "grid w-full grid-cols-auto/1fr/auto gap-x-4 border-t-[1px] p-6 first-of-type:border-t-0 md:min-w-[480px]",
          {
            "cursor-not-allowed select-none grayscale": disabled,
          },
          className,
        ),
      )}
    >
      {icon}

      <div className={clsx("grid grid-cols-1", { "opacity-25": disabled })}>
        <Typography
          variant={TYPOGRAPHY.M3}
          className="max-w-full truncate text-grey-900"
        >
          {title}
        </Typography>

        <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
          {description}
        </Typography>
      </div>

      {!completed && (
        <DecoratedButton
          variant="primary"
          className="max-h-[40px] w-full min-w-[80px] rounded-[.7rem] px-0 py-2.5"
          disabled={disabled}
          {...buttonProps}
        >
          <Typography variant={TYPOGRAPHY.M4}>{buttonText}</Typography>
        </DecoratedButton>
      )}

      {completed && (
        <div className="pointer-events-none grid w-full min-w-[80px] select-none grid-cols-auto/1fr items-center gap-x-2 rounded-lg border border-system-success-400 px-2 py-2.5 text-system-success-400">
          <CheckIcon size="16" />
          <Typography variant={TYPOGRAPHY.M4}>Done</Typography>
        </div>
      )}
    </div>
  );
};
