"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type Props = {
  onComplete: () => void;
};

export const VerificationBanner = ({ onComplete }: Props) => {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-blue-150 bg-gradient-to-t from-blue-150/25 to-transparent p-5 md:mt-10">
      <div className="flex items-center gap-4">
        <div className="flex size-[60px] items-center justify-center">
          <div className="scale-[0.6818]">
            <CircleIconContainer variant="info">
              <IdentificationIcon className="size-8 text-blue-500" />
            </CircleIconContainer>
          </div>
        </div>

        <div className="grid gap-y-1">
          <Typography variant={TYPOGRAPHY.H7}>Complete verification</Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Complete KYB or KYC to unlock withdrawals
          </Typography>
        </div>
      </div>
      <DecoratedButton type="button" className="max-h-9" onClick={onComplete}>
        Complete
      </DecoratedButton>
    </div>
  );
};
