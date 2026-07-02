import clsx from "clsx";
import { ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

/**
 * Minimal pure-Tailwind hover/focus tooltip. The trigger is wrapped in a
 * `group` span so the tooltip also appears for *disabled* buttons (which
 * don't emit their own hover events) and on keyboard focus via
 * `group-focus-within`. No JS, no positioning library — suited to fixed UI
 * like the AppTopBar submit button. If you need viewport flipping/clamping,
 * reach for @floating-ui/react instead.
 */
export const Tooltip = ({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) => (
  <span className="group relative inline-flex">
    {children}
    <span
      role="tooltip"
      className={clsx(
        "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-grey-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 ease-out group-focus-within:opacity-100 group-hover:opacity-100",
        side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        className,
      )}
    >
      {content}
    </span>
  </span>
);
