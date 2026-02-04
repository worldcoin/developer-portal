import { Button, CommonButtonProps } from "@/components/Button";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import clsx from "clsx";
import { memo } from "react";
import { twMerge } from "tailwind-merge";

type DecoratedButtonProps = CommonButtonProps & {
  icon?: React.ReactElement;
  showArrowRight?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  testId?: string;
};

export const DecoratedButton = memo(function DecoratedButton(
  props: DecoratedButtonProps,
) {
  const {
    icon,
    showArrowRight,
    loading,
    disabled,
    className,
    variant = "primary",
    testId,
    ...restProps
  } = props;

  const buttonStyles = {
    primary: {
      normal:
        "bg-grey-900 text-white bg-gradient-to-b border-grey-900 from-white/15 to-transparent shadow-button",
      hover: "hover:bg-gradient-to-b hover:from-white/20 hover:to-transparent ",
      disabled: "bg-grey-100 text-grey-300 pointer-events-none",
      loading: "bg-grey-100 text-grey-400 pointer-events-none",
    },
    secondary: {
      normal: "bg-grey-0 text-grey-700 border-grey-200 shadow-button",
      hover: "hover:bg-grey-100 hover:text-grey-900 ",
      disabled: "bg-grey-0 text-grey-300 border-grey-100 pointer-events-none",
      loading: "bg-grey-0 text-grey-400 border-grey-200 pointer-events-none",
    },
    danger: {
      normal: "bg-grey-0 text-system-error-600 border-system-error-400 inset-0",
      hover: "hover:bg-system-error-50 ",

      disabled:
        "border-system-error-200 text-system-error-300 pointer-events-none",

      loading:
        "border-system-error-300 text-system-error-400 pointer-events-none",
    },
  };

  return (
    <Button
      disabled={disabled}
      className={twMerge(
        clsx(
          "relative flex items-center justify-center rounded-[100px] border px-6 py-2.5 font-gta font-medium",
          { [buttonStyles[variant].normal]: !disabled && !loading },
          { [buttonStyles[variant].hover]: !disabled && !loading },
          disabled && buttonStyles[variant].disabled,
          loading && buttonStyles[variant].loading,
          className,
        ),
      )}
      {...(testId ? { "data-testid": `button-${testId}` } : {})}
      {...restProps}
    >
      <div
        className={clsx("flex items-center justify-center gap-2", {
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[11px] before:shadow-[0_0_0_1px_rgba(255,255,255,.1)_inset]":
            variant === "primary",
        })}
      >
        {icon}
        {props.children}
        {showArrowRight && <ArrowRightIcon className="size-6" />}
      </div>
    </Button>
  );
});
