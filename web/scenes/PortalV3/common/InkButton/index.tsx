import { Button } from "@/components/Button";
import type { CommonButtonProps } from "@/components/Button";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type InkButtonProps = CommonButtonProps & {
  icon?: ReactNode;
  /** Disables the control and prefixes the label with a spinner. */
  loading?: boolean;
};

const inkButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-8 bg-portal-ink px-4 font-world text-[length:var(--text-13)] leading-none font-medium text-white outline-hidden transition-colors hover:bg-portal-ink-hover focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-400 disabled:hover:bg-grey-200";

/**
 * Portal V3's dark pill control. Its flex icon slot owns the optical nudge so
 * raw inline SVGs align with cap-height labels without call-site adjustments.
 */
export const InkButton = (props: InkButtonProps) => {
  const {
    children,
    className,
    icon,
    loading = false,
    disabled,
    ...buttonProps
  } = props;

  return (
    <Button
      {...buttonProps}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={twMerge(inkButtonClassName, className)}
    >
      {loading ? (
        <SpinnerIcon className="size-5 animate-spin" aria-hidden />
      ) : icon ? (
        <span aria-hidden="true" className={`${opticalIconClassName} flex`}>
          {icon}
        </span>
      ) : null}
      {children}
    </Button>
  );
};
