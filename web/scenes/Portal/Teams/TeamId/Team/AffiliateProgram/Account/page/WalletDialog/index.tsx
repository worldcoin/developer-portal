"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import { WalletIcon } from "@/components/Icons/WalletIcon";

export const walletDialogAtom = atom(false);

type Props = {
  walletAddress: string;
};
export const WalletDialog = (props: Props) => {
  const [isOpened, setIsOpened] = useAtom(walletDialogAtom);

  return (
    <Dialog open={isOpened} onClose={setIsOpened}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 md:max-w-[30rem]">
        <CircleIconContainer variant="info">
          <WalletIcon className="size-7" />
        </CircleIconContainer>

        <div className="grid justify-items-center gap-y-3">
          <Typography variant={TYPOGRAPHY.H6}>Wallet address</Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            Wallet address has been verified and authorized
            <br />
            for withdrawals of earnings.
          </Typography>
        </div>

        <div className="w-full rounded-2xl bg-grey-50 px-4 py-5 text-center md:px-15">
          <Typography variant={TYPOGRAPHY.M3} className="break-all">
            {props.walletAddress}
          </Typography>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
