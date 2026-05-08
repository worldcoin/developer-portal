"use client";

import { useCallback, useEffect, useRef } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { useSaveStatusActions } from "../SaveStatus";
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
  const ctx = useSaveStatusActions();
  const idRef = useRef(options.id);
  idRef.current = options.id;
  const saveRef = useRef(options.save);
  saveRef.current = options.save;
  // Stash ctx in a ref so the registration effect below doesn't re-fire on
  // every status push. The provider's `value` memo recomputes on every
  // pushStatus/setPending call (status/hasPending are part of it), and if we
  // depended on `ctx` directly, the cleanup would delete this form's just-
  // pushed status from the map — flickering it back to idle.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  // Funnel every save through the provider's shared queue so concurrent
  // debounced saves from different forms can't race on overlapping
  // app_metadata columns. Falls back to direct invocation if no provider.
  const wrappedSave = useCallback(async (data: T, signal: AbortSignal) => {
    const run = () => saveRef.current(data, signal);
    const c = ctxRef.current;
    if (!c) return run();
    await c.runExclusive(run);
  }, []);

  const autosave = useAutosave<T>({
    form: options.form,
    save: wrappedSave,
    enabled: options.enabled,
    debounceMs: options.debounceMs,
    onStatus: (status: AutosaveStatus) => {
      ctxRef.current?.pushStatus(idRef.current, status);
    },
    onPendingChange: (isPending: boolean) => {
      ctxRef.current?.setPending(idRef.current, isPending);
    },
  });

  useEffect(() => {
    const c = ctxRef.current;
    if (!c) return;
    return c.register(idRef.current, { flush: autosave.flush });
    // Intentionally only depends on autosave.flush. ctx is read via the ref so
    // the cleanup doesn't fire on every value-memo change in the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosave.flush]);

  return autosave;
};
