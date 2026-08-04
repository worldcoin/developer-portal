"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { ModalIcon } from "@/components/ModalIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export const ErrorState = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      {/* Same icon, copy and spacing recipe as the delete confirmation modals. */}
      <div className="grid max-w-md justify-items-center gap-y-6">
        <ModalIcon variant="error">
          <AlertIcon className="size-7 text-white" />
        </ModalIcon>

        <div className="grid w-full place-items-center gap-y-5">
          <Typography
            as="h3"
            variant={TYPOGRAPHY.H6}
            className="text-center text-grey-900"
          >
            Failed to load transactions
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            Something went wrong while loading transactions. Please try
            refreshing the page.
          </Typography>
        </div>

        <DecoratedButton
          type="button"
          variant="secondary"
          className="px-8 py-3"
          onClick={handleRetry}
        >
          <Typography variant={TYPOGRAPHY.R3}>Try Again</Typography>
        </DecoratedButton>
      </div>
    </div>
  );
};
