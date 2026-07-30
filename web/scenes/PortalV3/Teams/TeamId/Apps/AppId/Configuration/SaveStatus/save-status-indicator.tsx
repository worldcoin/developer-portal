"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useSaveStatus } from "./save-status-context";

export const SaveStatusIndicator = () => {
  const { displayStatus } = useSaveStatus();

  if (displayStatus.state === "idle") return null;

  // Save state reads as glyph + plain text: hue lives only in the glyph, no
  // tinted pill container (matches the portal status grammar).
  if (displayStatus.state === "saving") {
    return (
      <div className="flex items-center gap-x-2 py-1.5 text-portal-muted">
        <SpinnerIcon className="size-4 animate-spin" />
        <Typography variant={TYPOGRAPHY.M3}>Saving…</Typography>
      </div>
    );
  }

  if (displayStatus.state === "saved") {
    return (
      <div className="flex items-center gap-x-2 py-1.5 text-portal-muted">
        <span className="text-system-success-600">
          <CheckIcon size="16" />
        </span>
        <Typography variant={TYPOGRAPHY.M3}>Changes saved</Typography>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-2 py-1.5 text-portal-text">
      <span className="size-2 rounded-full bg-system-error-500" aria-hidden />
      <Typography variant={TYPOGRAPHY.M3} title={displayStatus.error.message}>
        Couldn&apos;t save
      </Typography>
      <button
        type="button"
        onClick={displayStatus.retry}
        className="text-system-error-600 underline underline-offset-2"
      >
        <Typography variant={TYPOGRAPHY.M3}>Retry</Typography>
      </button>
    </div>
  );
};
