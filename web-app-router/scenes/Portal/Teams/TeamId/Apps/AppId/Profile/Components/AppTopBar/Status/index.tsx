import { twMerge } from "tailwind-merge";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";

type StatusProps = {
  status: string;
  variant: "not_verified" | "in_review" | "rejected" | "verified";
};

export const Status = (props: StatusProps) => {
  const { status, variant } = props;

  const statusStyles = {
    not_verified: {
      normal: "bg-grey-100 text-grey-900",
    },
    in_review: {
      normal: "bg-system-warning-100 text-system-warning-700",
    },
    rejected: {
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
        statusStyles[variant].normal
      )}
    >
      {variant === "verified" && <CheckmarkBadge className="w-4 h-auto" />}
      <Typography variant={TYPOGRAPHY.S3}>{status}</Typography>
    </div>
  );
};
