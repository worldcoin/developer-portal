"use client";

import { useCallback, useEffect, useRef } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

export type AutosaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; at: number }
  | { state: "error"; error: Error; retry: () => void };

export type UseAutosaveOptions<T extends FieldValues> = {
  form: UseFormReturn<T>;
  save: (data: T, signal: AbortSignal) => Promise<void>;
  enabled: boolean;
  debounceMs?: number;
  onStatus: (status: AutosaveStatus) => void;
  onPendingChange?: (isPending: boolean) => void;
};

export type UseAutosaveResult = {
  flush: () => Promise<boolean>;
  isSaving: () => boolean;
};

const DEFAULT_DEBOUNCE_MS = 1500;

class StaleSaveError extends Error {
  constructor() {
    super("stale");
    this.name = "StaleSaveError";
  }
}

export function useAutosave<T extends FieldValues>(
  options: UseAutosaveOptions<T>,
): UseAutosaveResult {
  const { form, debounceMs = DEFAULT_DEBOUNCE_MS } = options;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const inFlightPromiseRef = useRef<Promise<boolean> | null>(null);
  // Tracks whether the form has changed since the last successful save.
  // We rely on this rather than RHF's formState.isDirty because that proxy is
  // only reliably current inside a render — autosave runs in callbacks/timers.
  const hasUnsavedChangesRef = useRef(false);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const performSave = useCallback((): Promise<boolean> => {
    // Capture the prior in-flight promise synchronously so two sync calls to
    // performSave (e.g. retry + a fresh debounce firing) chain in order rather
    // than running concurrently. Every entry into performSave registers itself
    // on inFlightPromiseRef before yielding.
    const prior = inFlightPromiseRef.current;

    const run = async (): Promise<boolean> => {
      if (prior) {
        try {
          await prior;
        } catch {
          /* prior error already surfaced via onStatus */
        }
      }

      const { form: f, save, onStatus, onPendingChange } = optionsRef.current;

      if (!hasUnsavedChangesRef.current) {
        onPendingChange?.(false);
        return true;
      }

      const valid = await f.trigger();
      if (!valid) {
        // Surface invalid state on the indicator instead of leaving the prior
        // "Saved Xm ago" up — that would mislead the user into thinking their
        // current invalid edit was persisted. The next valid edit will trigger
        // a debounce → save → "Saved" status that replaces this.
        onStatus({
          state: "error",
          error: new Error("Fix the highlighted errors to save"),
          retry: () => {
            void performSave();
          },
        });
        return false;
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      const snapshot = f.getValues();
      // Mark "no unsaved changes" preemptively. Any change that arrives while
      // this save is in flight will flip it back to true through the watch
      // subscription, which means the next save will fire.
      hasUnsavedChangesRef.current = false;
      onPendingChange?.(false);
      onStatus({ state: "saving" });

      try {
        await save(snapshot, controller.signal);
        if (controller.signal.aborted) throw new StaleSaveError();

        const fresh = f.getValues();
        const stable =
          JSON.stringify(fresh) === JSON.stringify(snapshot) &&
          controllerRef.current === controller;

        if (stable) {
          f.reset(snapshot, {
            keepValues: true,
            keepDirty: false,
            keepErrors: true,
            keepTouched: true,
          });
        }

        onStatus({ state: "saved", at: Date.now() });
        return true;
      } catch (err) {
        if (
          err instanceof StaleSaveError ||
          controller.signal.aborted ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return false;
        }
        // Failure: restore unsaved-changes flag so flushAll/Save Now can
        // retry, and re-register pending so the beforeunload guard stays.
        hasUnsavedChangesRef.current = true;
        onPendingChange?.(true);
        const error = err instanceof Error ? err : new Error(String(err));
        onStatus({
          state: "error",
          error,
          retry: () => {
            void performSave();
          },
        });
        return false;
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    };

    const promise = run();
    inFlightPromiseRef.current = promise;
    promise.finally(() => {
      if (inFlightPromiseRef.current === promise) {
        inFlightPromiseRef.current = null;
      }
    });
    return promise;
  }, []);

  const flush = useCallback((): Promise<boolean> => {
    clearDebounce();
    if (!optionsRef.current.enabled) return Promise.resolve(true);
    return performSave();
  }, [clearDebounce, performSave]);

  const isSaving = useCallback(() => controllerRef.current !== null, []);

  useEffect(() => {
    if (!options.enabled) {
      clearDebounce();
      optionsRef.current.onPendingChange?.(false);
      return;
    }

    const subscription = form.watch((_values, info) => {
      if (!info.name) return;
      if (!optionsRef.current.enabled) return;
      hasUnsavedChangesRef.current = true;
      clearDebounce();
      optionsRef.current.onPendingChange?.(true);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void performSave();
      }, debounceMs);
    });

    return () => subscription.unsubscribe();
  }, [options.enabled, form, clearDebounce, performSave, debounceMs]);

  useEffect(() => {
    return () => {
      clearDebounce();
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [clearDebounce]);

  return { flush, isSaving };
}
