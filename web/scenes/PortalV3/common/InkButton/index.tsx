import { Button, CommonButtonProps } from "@/components/Button";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type InkButtonProps = CommonButtonProps & {
  icon?: ReactNode;
};

/**
 * Solid ink pill — the portal v3 primary action button. Pass icons through
 * the `icon` prop rather than as children: the slot applies
 * `opticalIconClassName` so the icon centers on the label's cap height
 * instead of sitting ~1px low, without each call site re-deriving the nudge.
 * The slot is `flex` so raw inline `<svg>` icons don't pick up a baseline
 * descender gap.
 */
export const InkButton = (props: InkButtonProps) => {
  const { icon, className, children, ...restProps } = props;

  return (
    <Button
      {...restProps}
      className={twMerge(
        "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-8 bg-portal-ink px-4 font-world text-13 leading-none font-medium text-white transition-colors hover:bg-portal-ink-hover focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-400 disabled:hover:bg-grey-200",
        className,
      )}
    >
      {icon ? (
        <span className={`flex ${opticalIconClassName}`}>{icon}</span>
      ) : null}
      {children}
    </Button>
  );
};
