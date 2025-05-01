"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import { useCallback } from "react";

export const banMessageDialogOpenedAtom = atom<boolean>(false);

export const BanMessageDialog = () => {
  const [isOpened, setIsOpened] = useAtom(banMessageDialogOpenedAtom);

  const closeModal = useCallback(() => {
    setIsOpened(false);
  }, [setIsOpened]);

  return (
    <Dialog onClose={closeModal} open={isOpened}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 md:max-w-[32rem]">
        <CircleIconContainer variant={"error"}>
          <CloseIcon className="size-5 text-system-error-600" strokeWidth={3} />
        </CircleIconContainer>

        <div className="grid w-full items-center justify-center gap-y-4">
          <Typography
            variant={TYPOGRAPHY.H6}
            className="text-center text-grey-900"
          >
            App was banned
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500 "
          >
            {`Due to user reports, or our own investigation your app was banned.
            This means it cannot be accessed by users anymore and it's not
            listed on World Mini Apps.`}
            <br />
            <b>Questions? Reach out on Telegram @MateoSauton</b>
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
