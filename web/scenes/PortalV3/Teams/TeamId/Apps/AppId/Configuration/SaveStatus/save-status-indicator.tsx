"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useSaveStatus } from "./save-status-context";

export const SaveStatusIndicator = () => {
  const { displayStatus } = useSaveStatus();

  if (displayStatus.state === "idle") return null;

  if (displayStatus.state === "saving") {
    return (
      <div className="flex items-center gap-x-2 rounded-full border border-focus bg-surface-info-faint px-3 py-1.5 text-content-link-legacy">
        <SpinnerIcon className="size-4 animate-spin" />
        <Typography variant={TYPOGRAPHY.M3}>Saving…</Typography>
      </div>
    );
  }

  if (displayStatus.state === "saved") {
    return (
      <div className="flex items-center gap-x-2 rounded-full border border-edge-success-500 bg-surface-success-50 px-3 py-1.5 text-content-success-700">
        <CheckIcon size="16" />
        <Typography variant={TYPOGRAPHY.M3}>Changes saved</Typography>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-2 rounded-full border border-edge-error-500 bg-surface-error-50 px-3 py-1.5 text-content-error-700">
      <span className="size-2 rounded-full bg-system-error-500" aria-hidden />
      <Typography variant={TYPOGRAPHY.M3} title={displayStatus.error.message}>
        Couldn&apos;t save
      </Typography>
      <button
        type="button"
        onClick={displayStatus.retry}
        className="text-content-error-700 underline underline-offset-2"
      >
        <Typography variant={TYPOGRAPHY.M3}>Retry</Typography>
      </button>
    </div>
  );
};
