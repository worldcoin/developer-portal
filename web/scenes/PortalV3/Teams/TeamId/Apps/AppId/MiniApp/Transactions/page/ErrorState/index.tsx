"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { MiniAppMessageState } from "../../../common/MiniAppMessageState";
import { miniAppButtonClassName } from "../../../common/styles";

export const ErrorState = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <MiniAppMessageState
      variant="error"
      icon={<AlertIcon className="size-7 text-white" />}
      title="Failed to load transactions"
      description="Something went wrong while loading transactions. Please try refreshing the page."
      action={
        <DecoratedButton
          type="button"
          variant="secondary"
          className={miniAppButtonClassName}
          onClick={handleRetry}
        >
          Try Again
        </DecoratedButton>
      }
    />
  );
};
