import clsx from "clsx";

import type { RpRegistrationMode, RpStatus } from "./types";

type RpStatusBadgeProps = {
  status: RpStatus | null | undefined;
};

const statusLabels: Record<RpStatus, string> = {
  deactivated: "Deactivated",
  failed: "Failed",
  pending: "Pending",
  registered: "Registered",
};

const statusClassNames: Record<RpStatus, string> = {
  deactivated: "border-grey-300 bg-grey-100 text-grey-500",
  failed: "border-system-error-300 bg-system-error-50 text-system-error-700",
  pending:
    "border-system-warning-300 bg-system-warning-50 text-system-warning-700",
  registered:
    "border-system-success-300 bg-system-success-50 text-system-success-700",
};

export const RpStatusBadge = ({ status }: RpStatusBadgeProps) => {
  if (!status) {
    return <span className="text-14 text-grey-400">—</span>;
  }

  return (
    <span
      aria-label={`Status: ${statusLabels[status]}`}
      className={clsx(
        "inline-flex max-w-full shrink-0 rounded-full border px-2 py-1 text-12 font-medium",
        statusClassNames[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
};

type RpModeBadgeProps = {
  mode: RpRegistrationMode;
};

const modeLabels: Record<RpRegistrationMode, string> = {
  managed: "Managed",
  self_managed: "Self-managed",
};

export const RpModeBadge = ({ mode }: RpModeBadgeProps) => (
  <span
    aria-label={`Mode: ${modeLabels[mode]}`}
    className="inline-flex max-w-full shrink-0 rounded-full border border-grey-300 bg-grey-100 px-2 py-1 text-12 font-medium text-grey-700"
  >
    {modeLabels[mode]}
  </span>
);
