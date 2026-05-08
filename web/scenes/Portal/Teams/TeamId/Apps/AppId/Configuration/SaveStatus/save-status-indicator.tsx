"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useEffect, useRef, useState } from "react";
import { AutosaveStatus } from "../hook/use-autosave";
import { useSaveStatus } from "./save-status-context";

const MIN_SAVING_VISIBLE_MS = 600;
// How long the "Changes saved" pill stays visible after a successful save
// before fading back to nothing.
const SAVED_VISIBLE_MS = 3000;

/**
 * Holds the underlying status long enough that "saving" stays on screen for at
 * least MIN_SAVING_VISIBLE_MS, and lets a "saved" pill linger for
 * SAVED_VISIBLE_MS before fading back to idle.
 */
const useDisplayStatus = (status: AutosaveStatus): AutosaveStatus => {
  const [display, setDisplay] = useState<AutosaveStatus>(status);
  const savingShownAtRef = useRef<number | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearPending = () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
    };

    if (status.state === "saving") {
      savingShownAtRef.current = Date.now();
      clearPending();
      setDisplay(status);
      return;
    }

    const shownAt = savingShownAtRef.current;
    if (status.state === "saved" && shownAt !== null) {
      const elapsed = Date.now() - shownAt;
      if (elapsed < MIN_SAVING_VISIBLE_MS) {
        // Hold "saving" for at least MIN_SAVING_VISIBLE_MS, then flip to the
        // saved state for SAVED_VISIBLE_MS, then auto-clear back to idle.
        clearPending();
        pendingTimerRef.current = setTimeout(() => {
          savingShownAtRef.current = null;
          setDisplay(status);
          pendingTimerRef.current = setTimeout(() => {
            pendingTimerRef.current = null;
            setDisplay({ state: "idle" });
          }, SAVED_VISIBLE_MS);
        }, MIN_SAVING_VISIBLE_MS - elapsed);
        return;
      }
      savingShownAtRef.current = null;
      clearPending();
      setDisplay(status);
      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        setDisplay({ state: "idle" });
      }, SAVED_VISIBLE_MS);
      return;
    }

    if (status.state === "saved") {
      // No prior "saving" was shown; still let the success pill linger.
      clearPending();
      setDisplay(status);
      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        setDisplay({ state: "idle" });
      }, SAVED_VISIBLE_MS);
      return;
    }

    // idle / error path
    savingShownAtRef.current = null;
    clearPending();
    setDisplay(status);
  }, [status]);

  return display;
};

export const SaveStatusIndicator = () => {
  const { status } = useSaveStatus();
  const display = useDisplayStatus(status);

  if (display.state === "idle") return null;

  if (display.state === "saving") {
    return (
      <div className="flex items-center gap-x-2 rounded-full border border-blue-500 bg-blue-50 px-3 py-1.5 text-blue-500">
        <SpinnerIcon className="size-4 animate-spin" />
        <Typography variant={TYPOGRAPHY.M3}>Saving…</Typography>
      </div>
    );
  }

  if (display.state === "saved") {
    return (
      <div className="flex items-center gap-x-2 rounded-full border border-system-success-500 bg-system-success-50 px-3 py-1.5 text-system-success-700">
        <CheckIcon size="16" />
        <Typography variant={TYPOGRAPHY.M3}>Changes saved</Typography>
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
