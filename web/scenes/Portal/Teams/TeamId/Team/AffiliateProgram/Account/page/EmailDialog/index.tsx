"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import { GmailIcon } from "@/components/Icons/GmailIcon";

export const emailDialogAtom = atom(false);

type Props = {
  email: string;
};
export const EmailDialog = (props: Props) => {
  const [isOpened, setIsOpened] = useAtom(emailDialogAtom);

  return (
    <Dialog open={isOpened} onClose={setIsOpened}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 md:max-w-[30rem]">
        <CircleIconContainer variant="info">
          <GmailIcon className="size-7" />
        </CircleIconContainer>

        <div className="grid justify-items-center gap-y-3">
          <Typography variant={TYPOGRAPHY.H6}>Email address</Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            Verified email address of the owner
          </Typography>
        </div>

        <div className="w-full rounded-2xl bg-grey-50 p-4 text-center">
          <Typography variant={TYPOGRAPHY.M3}>{props.email}</Typography>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
