import clsx from "clsx";

import type { TeamStatus } from "./types";

type StatusBadgeProps = {
  status: TeamStatus;
};

const statusClassNames: Record<TeamStatus, string> = {
  Active: "border-system-success-300 bg-system-success-50 text-system-success-700",
  Deleted: "border-grey-300 bg-grey-100 text-grey-500",
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      aria-label={`Status: ${status}`}
      className={clsx(
        "inline-flex max-w-full shrink-0 rounded-full border px-2 py-1 text-12 font-medium",
        statusClassNames[status],
      )}
    >
      {status}
    </span>
  );
};
