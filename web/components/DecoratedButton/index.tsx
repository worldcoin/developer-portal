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
  variant?: "primary" | "secondary" | "danger" | "destructive";
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
        "bg-grey-900 text-white dark:bg-action dark:text-action-foreground bg-linear-to-b border-edge-ink from-white/15 to-transparent shadow-button",
      hover:
        "hover:bg-linear-to-b hover:from-white/20 hover:to-transparent dark:hover:bg-action-hover",
      disabled: "bg-surface-muted text-content-disabled pointer-events-none",
      loading: "bg-surface-muted text-content-tertiary pointer-events-none",
    },
    secondary: {
      normal: "bg-surface text-content-strong border-edge shadow-button",
      hover: "hover:bg-surface-muted hover:text-content-primary ",
      disabled:
        "bg-surface text-content-disabled border-edge-subtle pointer-events-none",
      loading:
        "bg-surface text-content-tertiary border-edge pointer-events-none",
    },
    danger: {
      normal: "bg-surface text-content-error-600 border-edge-error-400 inset-0",
      hover: "hover:bg-surface-error-50 ",

      disabled:
        "border-edge-error-200 text-content-error-300 pointer-events-none",

      loading:
        "border-edge-error-300 text-content-error-400 pointer-events-none",
    },
    destructive: {
      normal:
        "bg-system-error-500 dark:bg-system-error-600 text-white border-edge-error-500",
      hover:
        "hover:bg-system-error-600 dark:hover:bg-system-error-800 hover:border-edge-error-600",
      disabled:
        "bg-surface-disabled text-content-secondary border-edge pointer-events-none",
      loading:
        "bg-surface-disabled text-content-secondary border-edge pointer-events-none",
    },
  };

  return (
    <Button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={twMerge(
        clsx(
          "relative flex items-center justify-center rounded-[100px] border px-6 py-2.5 font-gta font-medium ring-offset-surface focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-hidden",
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
