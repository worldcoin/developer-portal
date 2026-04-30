"use client";

import { useEffect, useRef } from "react";
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

  const autosave = useAutosave<T>({
    form: options.form,
    save: options.save,
    enabled: options.enabled,
    debounceMs: options.debounceMs,
    onStatus: (status: AutosaveStatus) => {
      ctx?.pushStatus(idRef.current, status);
    },
  });

  useEffect(() => {
    if (!ctx) return;
    return ctx.register(idRef.current, {
      flush: autosave.flush,
      hasPending: autosave.hasPending,
    });
  }, [ctx, autosave.flush, autosave.hasPending]);

  return autosave;
};
