import clsx from "clsx";
import { memo } from "react";

export const Status = memo(function Status(props: { isActive: boolean }) {
  const { isActive } = props;

  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 font-world text-12 leading-4 font-medium",
        {
          "bg-surface-success-100 text-content-success-500": isActive,
          "bg-surface-muted text-content-secondary": !isActive,
        },
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
});
