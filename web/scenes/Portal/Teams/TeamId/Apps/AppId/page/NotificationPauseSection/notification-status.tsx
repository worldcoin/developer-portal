"use client";

import { Button } from "@/components/Button";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useAtom } from "jotai";
import { NotificationPauseMessageDialogOpenedAtom } from "../../../common/NotificationPauseMessageDialog";

export const NotificationStatus = () => {
  const [isOpened, setIsOpened] = useAtom(
    NotificationPauseMessageDialogOpenedAtom,
  );
  const onClick = () => {
    if (isOpened) {
    }
    setIsOpened(true);
  };

  return (
    <div
      className={
        "grid grid-cols-auto/1fr/auto items-center gap-x-3 rounded-lg border border-system-warning-200 bg-system-warning-50 px-3 py-2 text-system-warning-600 sm:py-0 md:px-5"
      }
    >
      <AlertIcon className="text-system-warning-600" />
      <Typography variant={TYPOGRAPHY.R4}>
        Your notifications are disabled.
      </Typography>

      <Button
        type="button"
        onClick={onClick}
        className={clsx(
          "items-center py-3 text-system-warning-600 hover:text-system-warning-700",
        )}
      >
        <Typography variant={TYPOGRAPHY.R4}>More Information</Typography>
      </Button>
    </div>
  );
};
