import clsx from "clsx";
import { memo } from "react";

export const Status = memo(function Status(props: { isActive: boolean }) {
  const { isActive } = props;

  // Status reads as dot + plain text — the hue lives only in the dot, no
  // tinted pill container.
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-x-1.5 font-world text-12 leading-4 font-medium",
        isActive ? "text-portal-text" : "text-portal-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "size-1.5 rounded-full",
          isActive ? "bg-system-success-500" : "bg-grey-400",
        )}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
});
