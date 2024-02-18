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
      normal: "bg-grey-100 text-grey-500",
    },
    awaiting_review: {
      normal: "bg-system-warning-100 text-system-warning-700",
    },
    changes_requested: {
      normal: "bg-system-error-100 text-system-error-700",
    },
    verified: {
      normal: "bg-system-success-100 text-system-success-700",
    },
  };
  return (
    <div
      className={twMerge(
        clsx(
          "flex items-center gap-x-1.5 whitespace-nowrap rounded-3xl px-3 py-1",
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
