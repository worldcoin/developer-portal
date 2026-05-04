"use client";

import { useCallback, useEffect, useRef } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useOptionalSaveStatus } from "../SaveStatus";
import { AutosaveStatus, useAutosave } from "./use-autosave";

type Options<T extends FieldValues> = {
  id: string;
  form: UseFormReturn<T>;
  save: (data: T, signal: AbortSignal) => Promise<void>;
  enabled: boolean;
  debounceMs?: number;
};

export const useAutosaveWithStatus = <T extends FieldValues>(
  options: Options<T>,
) => {
  const ctx = useOptionalSaveStatus();
  const idRef = useRef(options.id);
  idRef.current = options.id;
  const saveRef = useRef(options.save);
  saveRef.current = options.save;

  // Funnel every save through the provider's shared queue so concurrent
  // debounced saves from different forms can't race on overlapping
  // app_metadata columns. Falls back to direct invocation if no provider.
  const wrappedSave = useCallback(
    async (data: T, signal: AbortSignal) => {
      const run = () => saveRef.current(data, signal);
      if (!ctx) return run();
      await ctx.runExclusive(run);
    },
    [ctx],
  );

  const autosave = useAutosave<T>({
    form: options.form,
    save: wrappedSave,
    enabled: options.enabled,
    debounceMs: options.debounceMs,
    onStatus: (status: AutosaveStatus) => {
      ctx?.pushStatus(idRef.current, status);
    },
    onPendingChange: (isPending: boolean) => {
      ctx?.setPending(idRef.current, isPending);
    },
  });

  useEffect(() => {
    if (!ctx) return;
    return ctx.register(idRef.current, { flush: autosave.flush });
  }, [ctx, autosave.flush]);

  return autosave;
};
