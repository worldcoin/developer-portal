"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSaveStatusActions } from "../../SaveStatus";

/**
 * Reports an image field's persistence state into the shared save-status pill.
 *
 * Deliberately uses `pushStatus` and not `register`, which exists so `flushAll`
 * can drain *debounced* writes; image saves fire immediately on upload and
 * delete, so there is never a pending write for a flush to chase.
 *
 * `id` must be unique per field *and* locale — statuses merge by id, so a
 * shared one would let a "saved" overwrite an in-flight "saving".
 */
export const useImageSaveStatus = (id: string) => {
  const actions = useSaveStatusActions();

  // Without register() the provider has no unmount hook to drop this entry, and
  // a stale "saving" outranks every other state in mergeStatuses — it would pin
  // the pill forever. Keyed on id so switching locale clears the old entry too.
  useEffect(() => {
    return () => actions?.pushStatus(id, { state: "idle" });
  }, [actions, id]);

  const reportSaving = useCallback(
    () => actions?.pushStatus(id, { state: "saving" }),
    [actions, id],
  );

  const reportSaved = useCallback(
    () => actions?.pushStatus(id, { state: "saved", at: Date.now() }),
    [actions, id],
  );

  /**
   * Only for failures a retry can fix — the file reached S3 and the database
   * write failed. A failed upload has nothing to retry and surfaces as a toast.
   */
  const reportError = useCallback(
    (error: Error, retry: () => void) =>
      actions?.pushStatus(id, { state: "error", at: Date.now(), error, retry }),
    [actions, id],
  );

  const reportIdle = useCallback(
    () => actions?.pushStatus(id, { state: "idle" }),
    [actions, id],
  );

  return useMemo(
    () => ({ reportSaving, reportSaved, reportError, reportIdle }),
    [reportSaving, reportSaved, reportError, reportIdle],
  );
};
