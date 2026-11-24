import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export type StatusVariant =
  | "unverified"
  | "awaiting_review"
  | "changes_requested"
  | "verified";

type StatusProps = {
  status: StatusVariant;
  className?: string;
  typography?: TYPOGRAPHY;
};

const statusMessageMap = {
  unverified: "Not verified",
  awaiting_review: "In review",
  changes_requested: "Rejected",
  verified: "Verified",
};

export const AppStatus = (props: StatusProps) => {
  const { status, className, typography = TYPOGRAPHY.S3 } = props;

  const statusStyles = {
    unverified: {
      normal: "bg-surface-muted text-content-primary",
    },
    awaiting_review: {
      normal: "bg-surface-warning-100 text-content-warning-700",
    },
    changes_requested: {
      normal: "bg-surface-error-100 text-content-error-700",
    },
    verified: {
      normal: "bg-surface-success-100 text-content-success-700",
    },
  };
  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-row items-center gap-x-1.5 rounded-3xl px-3 py-1 whitespace-nowrap",
          statusStyles[status]?.normal,
          className,
        ),
      )}
    >
      {status === "verified" && <CheckmarkBadge className="h-auto w-4" />}
      <Typography variant={typography}>{statusMessageMap[status]}</Typography>
    </div>
  );
};
