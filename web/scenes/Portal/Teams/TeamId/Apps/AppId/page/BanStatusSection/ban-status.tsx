"use client";

import { Button } from "@/components/Button";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useAtom } from "jotai";
import { banMessageDialogOpenedAtom } from "../../../common/BanMessageDialog";

export const BanStatus = () => {
  const [isOpened, setIsOpened] = useAtom(banMessageDialogOpenedAtom);
  const onClick = () => {
    if (isOpened) {
    }
    setIsOpened(true);
  };

  return (
    <div
      className={
        "grid grid-cols-auto/1fr/auto items-center gap-x-3 rounded-lg border border-system-error-200 bg-system-error-50 px-3 py-2 text-system-error-600 sm:py-0 md:px-5"
      }
    >
      <AlertIcon className="text-system-error-600" />
      <Typography variant={TYPOGRAPHY.R4}>
        Your app was banned, users cannot access it anymore
      </Typography>

      <Button
        type="button"
        onClick={onClick}
        className={clsx(
          "items-center py-3 text-system-error-600 hover:text-system-error-700",
        )}
      >
        <Typography variant={TYPOGRAPHY.R4}>More Information</Typography>
      </Button>
    </div>
  );
};
