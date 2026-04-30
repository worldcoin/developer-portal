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
};

export type UseAutosaveResult = {
  flush: () => Promise<boolean>;
  isSaving: () => boolean;
  hasPending: () => boolean;
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

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const performSave = useCallback(async (): Promise<boolean> => {
    const { form: f, save, onStatus } = optionsRef.current;

    const valid = await f.trigger();
    if (!valid) return false;

    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const snapshot = f.getValues();
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
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    clearDebounce();
    if (!optionsRef.current.enabled) return true;
    const promise = performSave();
    inFlightPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      if (inFlightPromiseRef.current === promise) {
        inFlightPromiseRef.current = null;
      }
    }
  }, [clearDebounce, performSave]);

  const isSaving = useCallback(() => controllerRef.current !== null, []);

  const hasPending = useCallback(
    () => debounceTimerRef.current !== null || controllerRef.current !== null,
    [],
  );

  useEffect(() => {
    if (!options.enabled) {
      clearDebounce();
      return;
    }

    const subscription = form.watch((_values, info) => {
      if (!info.name) return;
      if (!optionsRef.current.enabled) return;
      clearDebounce();
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const promise = performSave();
        inFlightPromiseRef.current = promise;
        promise.finally(() => {
          if (inFlightPromiseRef.current === promise) {
            inFlightPromiseRef.current = null;
          }
        });
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

  return { flush, isSaving, hasPending };
}
