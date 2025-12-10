import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { ArrowDownSharpIcon } from "@/components/Icons/ArrowDownSharp";
import Skeleton from "react-loading-skeleton";

// NOTE: consider moving this component to common
export const Step = (props: {
  title?: string;
  description?: string;
  buttonText?: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  completed?: boolean;
  loading?: boolean;
  testId?: string;
  showButtonSpinner?: boolean;
  className?: string;
}) => {
  const {
    title,
    description,
    buttonText,
    icon,
    disabled,
    className,
    onClick,
    loading,
    showButtonSpinner,
  } = props;

  const rootClassName = twMerge(
    clsx(
      "grid w-full grid-cols-auto/1fr/auto items-center gap-x-4 border-t border-x p-6 md:min-w-[480px]",
      "first-of-type:rounded-t-2xl last-of-type:rounded-b-2xl last-of-type:border-b",
      {
        "cursor-not-allowed select-none text-grey-500": disabled,
      },
      className,
    ),
  );

  if (loading) {
    return (
      <div className={rootClassName}>
        <Skeleton circle className="size-10" />
        <Skeleton height={40} width={150} />
        <Skeleton height={36} width={100} />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      {icon}

      <div className={clsx("grid grid-cols-1")}>
        <Typography variant={TYPOGRAPHY.M3} className="max-w-full truncate">
          {title}
        </Typography>

        {description && (
          <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
            {description}
          </Typography>
        )}
      </div>

      {showButtonSpinner && (
        <SpinnerIcon className="ml-auto size-6 animate-spin" />
      )}

      {!showButtonSpinner && buttonText && (
        <>
          <Button
            type="button"
            onClick={onClick}
            className="ml-auto flex size-6 items-center justify-center rounded-full bg-grey-900 md:hidden"
          >
            <ArrowDownSharpIcon className="size-3 text-grey-0" />
          </Button>
          <DecoratedButton
            type="button"
            onClick={onClick}
            className="ml-auto hidden max-h-9 md:flex"
          >
            {buttonText}
          </DecoratedButton>
        </>
      )}
    </div>
  );
};
