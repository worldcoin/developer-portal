"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import { toast } from "react-toastify";
import { DecoratedButton } from "@/components/DecoratedButton";
import { GmailIcon } from "@/components/Icons/GmailIcon";
import { AffiliateMetadataResponse } from "@/lib/types";

export const inviteUserDialogAtom = atom(false);

type Props = {
  data: AffiliateMetadataResponse["result"] | null;
};
export const InviteUserDialog = (props: Props) => {
  const [isOpened, setIsOpened] = useAtom(inviteUserDialogAtom);
  const inviteCode = props.data?.inviteCode;
  const inviteLink = `https://world.org/join/${inviteCode}`;

  return (
    <Dialog open={isOpened} onClose={setIsOpened}>
      <DialogOverlay />

      <DialogPanel
        className="grid gap-y-8 md:max-w-[30rem]"
        onClose={() => setIsOpened(false)}
        showCloseIcon={true}
      >
        <CircleIconContainer variant="info">
          <GmailIcon className="size-8" />
        </CircleIconContainer>

        <div className="grid justify-items-center gap-y-4">
          <Typography variant={TYPOGRAPHY.H6}>
            Invite humans and earn
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            Receive rewards for each human that use
            <br /> your code and gets verified
          </Typography>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center gap-4 rounded-2xl bg-grey-50 p-4">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Code
            </Typography>
            <Typography variant={TYPOGRAPHY.M3} className="flex-1 text-end">
              {inviteCode}
            </Typography>
            <DecoratedButton
              className="order-2 md:order-1"
              type="button"
              variant="secondary"
              onClick={() => {
                if (!inviteCode) return;
                navigator.clipboard.writeText(inviteCode);
                toast.success(`invite code copied to clipboard`);
              }}
            >
              Copy
            </DecoratedButton>
          </div>

          <div className="flex items-center gap-4 overflow-hidden rounded-2xl bg-grey-50 p-4">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Link
            </Typography>
            <Typography
              variant={TYPOGRAPHY.M3}
              className="min-w-0 flex-1 truncate overflow-ellipsis text-end"
              title={inviteLink}
            >
              {inviteLink}
            </Typography>
            <DecoratedButton
              className="order-2 md:order-1"
              type="button"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                toast.success(`invite link copied to clipboard`);
              }}
            >
              Copy
            </DecoratedButton>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
