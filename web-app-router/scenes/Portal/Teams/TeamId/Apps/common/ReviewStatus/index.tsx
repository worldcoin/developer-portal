"use client";

import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useCallback, useMemo } from "react";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { Button } from "@/components/Button";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { useAtom } from "jotai";
import { showReviewStatusAtom } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Profile/layout";
import { reviewMessageDialogOpenedAtom } from "../ReviewMessage";

type ReviewStatusProps = {
  status: "changes_requested" | "verified";
  message: string;
  className?: string;
};

export const ReviewStatus = (props: ReviewStatusProps) => {
  const { status, message, className } = props;
  const [showReviewStatus, setShowReviewStatus] = useAtom(showReviewStatusAtom);
  const [, setOpened] = useAtom(reviewMessageDialogOpenedAtom);

  const statusStyles = {
    verified: {
      normal:
        "bg-system-success-50 border border-system-success-200 text-system-success-600",
    },
    changes_requested: {
      normal:
        "bg-system-warning-50 border border-system-warning-200 text-system-warning-600",
    },
  };

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
      setOpened(true);
    }

    setShowReviewStatus(false);
  }, [setOpened, setShowReviewStatus, status]);

  if (status === "verified" && showReviewStatus === false) {
    return;
  }

  return (
    <div
      className={clsx(
        statusStyles[status].normal,
        "grid grid-cols-auto/1fr/auto items-center px-0 pl-5 rounded-lg gap-x-3",
        className,
      )}
    >
      {status === "changes_requested" ? (
        <AlertIcon className="text-system-warning-500" />
      ) : (
        <CheckmarkBadge className="text-system-success-500 w-5" />
      )}
      <Typography variant={TYPOGRAPHY.R4}>{formattedMessage}</Typography>

      <Button
        type="button"
        onClick={onClick}
        className={clsx(
          "px-6 py-3 h-12 grid grid-cols-1fr/auto gap-x-2 items-center",
          {
            "text-system-warning-600 hover:text-system-warning-700":
              status === "changes_requested",
            "text-system-success-600": status === "verified",
          },
        )}
      >
        <Typography variant={TYPOGRAPHY.R4}>
          {status === "changes_requested" ? "Resolve" : "Dismiss"}
        </Typography>

        {status === "changes_requested" && <ArrowRightIcon />}
      </Button>
    </div>
  );
};
