"use client";

import { Button } from "@/components/Button";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { showReviewStatusAtom } from "../../AppId/Configuration/layout/ImagesProvider";

type ReviewStatusProps = {
  status: "changes_requested" | "verified";
  message: string;
  className?: string;
  onResolveClick?: () => void;
};

const statusStyles: Record<ReviewStatusProps["status"], string> = {
  verified:
    "border-system-success-200 bg-system-success-50 text-system-success-600",
  changes_requested:
    "border-system-warning-200 bg-system-warning-50 text-system-warning-600",
};

export const ReviewStatus = (props: ReviewStatusProps) => {
  const { status, message, className, onResolveClick } = props;
  const [showReviewStatus, setShowReviewStatus] = useAtom(showReviewStatusAtom);

  const formattedMessage = useMemo(() => {
    if (status === "changes_requested") {
      return (
        "Review was rejected: " +
        message.split(" ").slice(0, 7).join(" ") +
        "..."
      );
    } else {
      return "Congratulations, your app is now verified";
    }
  }, [status, message]);

  const onClick = useCallback(() => {
    if (status === "changes_requested") {
      onResolveClick?.();
    }

    setShowReviewStatus(false);
  }, [onResolveClick, setShowReviewStatus, status]);

  if (status === "verified" && showReviewStatus === false) {
    return;
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-[10px] border px-5 py-3",
        statusStyles[status],
        className,
      )}
    >
      {status === "changes_requested" ? (
        <AlertIcon className="shrink-0 text-system-warning-500" />
      ) : (
        <CheckmarkBadge className="shrink-0 text-system-success-500" />
      )}
      <span className="min-w-0 flex-1 font-world text-13 leading-[1.3]">
        {formattedMessage}
      </span>

      <Button
        type="button"
        onClick={onClick}
        className={clsx(
          "flex shrink-0 items-center gap-x-1 font-world text-13 font-medium transition-colors",
          status === "changes_requested"
            ? "text-system-warning-600 hover:text-system-warning-700"
            : "text-system-success-600",
        )}
      >
        {status === "changes_requested" ? "Resolve" : "Dismiss"}
        {status === "changes_requested" && <ArrowRightIcon />}
      </Button>
    </div>
  );
};
