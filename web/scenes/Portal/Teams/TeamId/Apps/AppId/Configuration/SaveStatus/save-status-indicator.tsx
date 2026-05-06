"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useEffect, useState } from "react";
import { useSaveStatus } from "./save-status-context";

const formatRelative = (timestamp: number, now: number): string => {
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 5) return "Saved just now";
  if (seconds < 60) return `Saved ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Saved ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Saved ${hours}h ago`;
};

export const SaveStatusIndicator = () => {
  const { status } = useSaveStatus();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (status.state !== "saved") return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [status.state]);

  if (status.state === "idle") return null;

  if (status.state === "saving") {
    return (
      <div className="flex items-center gap-x-2 rounded-full bg-grey-50 px-3 py-1.5 text-grey-700">
        <SpinnerIcon className="size-4 animate-spin" />
        <Typography variant={TYPOGRAPHY.M3}>Saving…</Typography>
      </div>
    );
  }

  if (status.state === "saved") {
    return (
      <div className="flex items-center gap-x-2 rounded-full bg-system-success-50 px-3 py-1.5 text-system-success-700">
        <CheckIcon size="16" />
        <Typography variant={TYPOGRAPHY.M3}>
          {formatRelative(status.at, now)}
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-2 rounded-full bg-system-error-50 px-3 py-1.5 text-system-error-700">
      <span className="size-2 rounded-full bg-system-error-500" aria-hidden />
      <Typography variant={TYPOGRAPHY.M3} title={status.error.message}>
        Couldn&apos;t save
      </Typography>
      <button
        type="button"
        onClick={status.retry}
        className="text-system-error-700 underline underline-offset-2"
      >
        <Typography variant={TYPOGRAPHY.M3}>Retry</Typography>
      </button>
    </div>
  );
};
