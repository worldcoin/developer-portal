"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import Link from "next/link";
import { useCallback } from "react";

export const NotificationPauseMessageDialogOpenedAtom = atom<boolean>(false);

export const NotificationPauseMessageDialog = () => {
  const [isOpened, setIsOpened] = useAtom(
    NotificationPauseMessageDialogOpenedAtom,
  );

  const closeModal = useCallback(() => {
    setIsOpened(false);
  }, [setIsOpened]);

  return (
    <Dialog onClose={closeModal} open={isOpened}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 md:max-w-[32rem]">
        <CircleIconContainer variant={"warning"}>
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid w-full items-center justify-center gap-y-4">
          <Typography
            variant={TYPOGRAPHY.H6}
            className="text-center text-grey-900"
          >
            Your notifications are disabled
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500 "
          >
            {`Your average notification open rate over the past 7 days is below 10%. After 7 days,
             you will be able to send notifications again. Please re-evaluate your notification strategy.`}
            <br />
            Take a look at our{" "}
            <Link
              href="https://docs.world.org/mini-apps/notifications/features-and-guidelines"
              className="underline"
            >
              documentation
            </Link>{" "}
            for tips and more information.
          </Typography>
        </div>

        <div className="grid items-center gap-x-4">
          <DecoratedButton
            type="button"
            variant="secondary"
            onClick={() => setIsOpened(false)}
          >
            Close
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
