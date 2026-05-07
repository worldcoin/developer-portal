"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useEffect, useRef, useState } from "react";
import { AutosaveStatus } from "../hook/use-autosave";
import { useSaveStatus } from "./save-status-context";

const formatRelative = (timestamp: number, now: number): string => {
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const MIN_SAVING_VISIBLE_MS = 600;

/**
 * Holds the underlying status long enough that "saving" stays on screen for at
 * least MIN_SAVING_VISIBLE_MS, even when the network resolves faster than that.
 */
const useDisplayStatus = (status: AutosaveStatus): AutosaveStatus => {
  const [display, setDisplay] = useState<AutosaveStatus>(status);
  const savingShownAtRef = useRef<number | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status.state === "saving") {
      savingShownAtRef.current = Date.now();
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      setDisplay(status);
      return;
    }

    const shownAt = savingShownAtRef.current;
    if (shownAt !== null) {
      const elapsed = Date.now() - shownAt;
      if (elapsed < MIN_SAVING_VISIBLE_MS) {
        pendingTimerRef.current = setTimeout(() => {
          savingShownAtRef.current = null;
          pendingTimerRef.current = null;
          setDisplay(status);
        }, MIN_SAVING_VISIBLE_MS - elapsed);
        return;
      }
      savingShownAtRef.current = null;
    }
    setDisplay(status);
  }, [status]);

  return display;
};

export const SaveStatusIndicator = () => {
  const { status } = useSaveStatus();
  const display = useDisplayStatus(status);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (display.state !== "saved") return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [display.state]);

  if (display.state === "idle") {
    // Always render *something* so users can see the autosave is wired up,
    // even before the first save fires.
    return (
      <div className="flex items-center gap-x-2 rounded-full border border-grey-200 bg-grey-50 px-3 py-1.5 text-grey-500">
        <Typography variant={TYPOGRAPHY.M3}>Auto-save enabled</Typography>
      </div>
    );
  }

  if (display.state === "saving") {
    return (
      <div className="flex items-center gap-x-2 rounded-full border border-blue-500 bg-blue-50 px-3 py-1.5 text-blue-500">
        <SpinnerIcon className="size-4 animate-spin" />
        <Typography variant={TYPOGRAPHY.M3}>Autosaving…</Typography>
      </div>
    );
  }

  if (display.state === "saved") {
    return (
      <div className="flex items-center gap-x-2 rounded-full border border-system-success-500 bg-system-success-50 px-3 py-1.5 text-system-success-700">
        <CheckIcon size="16" />
        <Typography variant={TYPOGRAPHY.M3}>
          Autosaved {formatRelative(display.at, now)}
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-2 rounded-full border border-system-error-500 bg-system-error-50 px-3 py-1.5 text-system-error-700">
      <span className="size-2 rounded-full bg-system-error-500" aria-hidden />
      <Typography variant={TYPOGRAPHY.M3} title={display.error.message}>
        Couldn&apos;t save
      </Typography>
      <button
        type="button"
        onClick={display.retry}
        className="text-system-error-700 underline underline-offset-2"
      >
        <Typography variant={TYPOGRAPHY.M3}>Retry</Typography>
      </button>
    </div>
  );
};
