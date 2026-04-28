"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { InformationCircleIcon } from "@/components/Icons/InformationCircleIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onVerifyNow: () => void;
  isLoading?: boolean;
};

export const VerifyLaterDialog = ({
  open,
  onClose,
  onConfirm,
  onVerifyNow,
  isLoading = false,
}: Props) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel
        className="w-full max-w-[480px] gap-y-8"
        onClose={onClose}
        showCloseIcon={true}
      >
        <div className="grid justify-items-center gap-y-8">
          <CircleIconContainer variant="info">
            <InformationCircleIcon className="size-8 text-blue-500" />
          </CircleIconContainer>

          <div className="grid gap-y-3 text-center">
            <Typography variant={TYPOGRAPHY.H6}>
              Start earning right now
              <br />
              and pass verification later
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              You will not be able to withdraw money
              <br />
              without completing KYB/KYC
            </Typography>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          <DecoratedButton
            type="button"
            variant="secondary"
            className="h-12 w-full rounded-[10px]"
            onClick={onVerifyNow}
            disabled={isLoading}
          >
            Verify now
          </DecoratedButton>
          <DecoratedButton
            type="button"
            className="h-12 w-full rounded-[10px]"
            onClick={onConfirm}
            disabled={isLoading}
          >
            Continue
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
