"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export const ErrorState = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-y-6 text-center">
      <div className="grid max-w-[300px] justify-items-center gap-y-4">
        <div className="grid gap-y-2 font-rubik leading-[1.2]">
          <CircleIconContainer variant="error">
            <CloseIcon className="size-4 text-system-error-500" />
          </CircleIconContainer>
        </div>
        <Typography variant={TYPOGRAPHY.H6}>Failed to load payments</Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
          Something went wrong while loading payments. Please try refreshing the
          page.
        </Typography>
      </div>
      <DecoratedButton
        type="button"
        variant="secondary"
        className="h-fit max-w-full px-8"
        color="primary"
        onClick={handleRetry}
      >
        <Typography variant={TYPOGRAPHY.M3}>Try Again</Typography>
      </DecoratedButton>
    </div>
  );
};
