import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type NoticeVariant = "neutral" | "info" | "warning";

const variantClassName: Record<NoticeVariant, string> = {
  neutral: "bg-grey-50 text-grey-700",
  // additional-blue-100, not the #E6F0FF that Notifications hardcoded.
  info: "bg-additional-blue-100 text-grey-900",
  warning: "bg-system-warning-100 text-system-warning-600",
};

/**
 * The inline notice box shared by the Mini App subtabs — locked drafts, review
 * status, "notifications unavailable", the notifications rate-limit note. Each
 * of those rolled its own padding and background before.
 */
export const NoticeCallout = (props: {
  children: ReactNode;
  variant?: NoticeVariant;
  /** Leading glyph, rendered in its own column so long copy stays aligned. */
  icon?: ReactNode;
  /** Trailing action, e.g. "Create draft". */
  action?: ReactNode;
  title?: string;
  className?: string;
}) => {
  const { variant = "neutral", icon, action, title, children } = props;

  return (
    <div
      className={twMerge(
        "flex flex-wrap items-start justify-between gap-3 rounded-[10px] p-4",
        variantClassName[variant],
        props.className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-x-3">
        {icon}

        <div className="min-w-0 font-world text-[13px] leading-[130%] font-medium">
          {title && <p className="font-semibold">{title}</p>}
          <p>{children}</p>
        </div>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
