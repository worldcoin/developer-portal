import { twMerge } from "tailwind-merge";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";

export type StatusVariant =
  | "unverified"
  | "awaiting_review"
  | "changes_requested"
  | "verified";

type StatusProps = {
  status: StatusVariant;
};

const statusMessageMap = {
  unverified: "Not verified",
  awaiting_review: "In review",
  changes_requested: "Rejected",
  verified: "Verified",
};

export const Status = (props: StatusProps) => {
  const { status } = props;

  const statusStyles = {
    unverified: {
      normal: "bg-grey-100 text-grey-900",
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
      className={clsx(
        "px-3 py-1 rounded-3xl flex gap-x-1.5 items-center",
        statusStyles[status].normal
      )}
    >
      {status === "verified" && <CheckmarkBadge className="w-4 h-auto" />}
      <Typography variant={TYPOGRAPHY.S3}>
        {statusMessageMap[status]}
      </Typography>
    </div>
  );
};
