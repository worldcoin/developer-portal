"use client";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import { DecoratedButton } from "@/components/DecoratedButton";
import { WLDTokenIcon } from "@/components/Icons/WLDTokenIcon";

export const worldChainDialogAtom = atom(false);

type Props = {
  onConfirm: () => void;
  onClose: () => void;
};
export const WorldChainDialog = (props: Props) => {
  const [isOpened, setIsOpened] = useAtom(worldChainDialogAtom);

  return (
    <Dialog open={isOpened} onClose={setIsOpened}>
      <DialogOverlay />

      <DialogPanel className="md:max-w-[30rem]">
        <WLDTokenIcon />

        <div className="mt-8 grid justify-items-center gap-y-3">
          <Typography variant={TYPOGRAPHY.H6} className="text-center">
            Does your wallet accept
            <br />
            Worldcoin on World Chain?
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-gray-500"
          >
            Using the wrong network could mean losing your funds.
          </Typography>
        </div>

        <div className="mt-10 flex w-full gap-4">
          <DecoratedButton
            className="w-full"
            type="button"
            variant="secondary"
            onClick={props.onClose}
          >
            No
          </DecoratedButton>

          <DecoratedButton
            className="w-full"
            type="button"
            variant="primary"
            onClick={props.onConfirm}
          >
            Yes
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
