"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { BusinessIcon } from "@/components/Icons/BusinessIcon";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { GetIdentityVerificationLinkRequest } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (type: GetIdentityVerificationLinkRequest["type"]) => void;
  isLoading: boolean;
};

export const SelectVerificationDialog = ({
  open,
  onClose,
  onSelect,
  isLoading,
}: Props) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel
        className="w-full max-w-[480px] gap-y-10 md:gap-y-8"
        onClose={onClose}
        showCloseIcon={true}
      >
        <div className="grid justify-items-center gap-y-8">
          <CircleIconContainer variant="info">
            <IdentificationIcon className="size-7" />
          </CircleIconContainer>

          <div className="grid gap-y-3 text-center">
            <Typography variant={TYPOGRAPHY.H6}>Select verification</Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Complete either KYC or KYB to continue
            </Typography>
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-auto/1fr/auto items-center gap-x-3 py-6">
            <IconFrame className="bg-blue-500 text-grey-0">
              <IdentificationIcon className="size-5" />
            </IconFrame>
            <Typography variant={TYPOGRAPHY.M3}>Complete KYC</Typography>
            <DecoratedButton
              type="button"
              className="max-h-9"
              disabled={isLoading}
              onClick={() => onSelect("kyc")}
            >
              Start
            </DecoratedButton>
          </div>

          <div className="h-px w-full bg-grey-200" />

          <div className="grid grid-cols-auto/1fr/auto items-center gap-x-3 py-6">
            <IconFrame className="bg-blue-500 text-grey-0">
              <BusinessIcon className="size-5" />
            </IconFrame>
            <Typography variant={TYPOGRAPHY.M3}>Complete KYB</Typography>
            <DecoratedButton
              type="button"
              className="max-h-9"
              disabled={isLoading}
              onClick={() => onSelect("kyb")}
            >
              Start
            </DecoratedButton>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
