"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AutosaveStatus } from "../hook/use-autosave";

const MIN_SAVING_VISIBLE_MS = 600;
// How long the "Changes saved" pill stays visible after a successful save
// before fading back to nothing.
const SAVED_VISIBLE_MS = 1000;

type Registered = {
  flush: () => Promise<boolean>;
};

// Action handles are stable across renders. Forms, the mini-app toggle, and
// review submission consume actions only — they don't need to re-render when
// the indicator's status changes.
export type SaveStatusActions = {
  register: (id: string, r: Registered) => () => void;
  pushStatus: (id: string, status: AutosaveStatus) => void;
  setPending: (id: string, isPending: boolean) => void;
  flushAll: () => Promise<boolean>;
  // Serialize all autosave network writes across registered forms. Multiple
  // forms in this provider write overlapping app_metadata columns (e.g.
  // `name`), so without a shared queue concurrent debounced saves from
  // different forms can race and produce nondeterministic last-write-wins.
  runExclusive: <T>(fn: () => Promise<T>) => Promise<T>;
};

// Reactive values change with every status push — only the indicator
// (and the Submit button's "is saving" disabled flag) needs them.
export type SaveStatusValues = {
  status: AutosaveStatus;
  // Status with the indicator's display rules applied: "saving" is held for
  // at least MIN_SAVING_VISIBLE_MS, "saved" lingers for SAVED_VISIBLE_MS
  // before snapping back to idle. Use this for any UI surface that must
  // track the indicator's visible state (e.g. the Save Changes button's
  // loading variant should only flip while the blue pill is showing).
  displayStatus: AutosaveStatus;
  hasPending: boolean;
};

const SaveStatusActionsContext = createContext<SaveStatusActions | null>(null);
const SaveStatusValuesContext = createContext<SaveStatusValues>({
  status: { state: "idle" },
  displayStatus: { state: "idle" },
  hasPending: false,
});

export const mergeStatuses = (
  statuses: Map<string, AutosaveStatus>,
  pendingIds: ReadonlySet<string> = new Set(),
): AutosaveStatus => {
  let mostRecentSaved: { state: "saved"; at: number } | null = null;
  let mostRecentPendingError: Extract<
    AutosaveStatus,
    { state: "error" }
  > | null = null;
  let mostRecentStaleError: Extract<AutosaveStatus, { state: "error" }> | null =
    null;
  for (const [id, status] of statuses.entries()) {
    if (status.state === "saving") return status;
    if (status.state === "error") {
      // Treat the error as "live" while its form still reports unsaved
      // changes. A pending error must win over any saved from another form
      // so the indicator can't say "Saved" while a draft has unresolved
      // validation/network failures.
      const bucket = pendingIds.has(id) ? "pending" : "stale";
      if (bucket === "pending") {
        if (!mostRecentPendingError || status.at > mostRecentPendingError.at) {
          mostRecentPendingError = status;
        }
      } else if (!mostRecentStaleError || status.at > mostRecentStaleError.at) {
        mostRecentStaleError = status;
      }
    }
    if (
      status.state === "saved" &&
      (!mostRecentSaved || status.at > mostRecentSaved.at)
    ) {
      mostRecentSaved = status;
    }
  }
  // Pending errors always win — the user has unresolved unsaved data.
  if (mostRecentPendingError) return mostRecentPendingError;
  // Stale errors (e.g. a mini-app toggle that reverted; nothing pending now)
  // fall back to recency vs. the newest saved so we don't permanently mask
  // newer successful saves from other forms.
  if (mostRecentStaleError && mostRecentSaved) {
    return mostRecentStaleError.at >= mostRecentSaved.at
      ? mostRecentStaleError
      : mostRecentSaved;
  }
  if (mostRecentStaleError) return mostRecentStaleError;
  if (mostRecentSaved) return mostRecentSaved;
  return { state: "idle" };
};

export const SaveStatusProvider = ({ children }: { children: ReactNode }) => {
  const [statuses, setStatuses] = useState<Map<string, AutosaveStatus>>(
    () => new Map(),
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const registeredRef = useRef<Map<string, Registered>>(new Map());
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const register = useCallback((id: string, r: Registered) => {
    registeredRef.current.set(id, r);
    return () => {
      registeredRef.current.delete(id);
      setStatuses((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setPendingIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };
  }, []);

  const pushStatus = useCallback((id: string, status: AutosaveStatus) => {
    setStatuses((prev) => {
      const next = new Map(prev);
      next.set(id, status);
      return next;
    });
  }, []);

  const setPending = useCallback((id: string, isPending: boolean) => {
    setPendingIds((prev) => {
      if (isPending === prev.has(id)) return prev;
      const next = new Set(prev);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const runExclusive = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const next = saveQueueRef.current.catch(() => undefined).then(() => fn());
    // Replace the queue head with a promise that always resolves, so a
    // failure in one task doesn't poison the queue for the next one.
    saveQueueRef.current = next.catch(() => undefined);
    return next;
  }, []);

  const flushAll = useCallback(async (): Promise<boolean> => {
    // Run flushes sequentially. Multiple forms here (BasicInformation,
    // AppStore) write overlapping columns on app_metadata (e.g. `name`), so a
    // concurrent flushAll would let the last response win nondeterministically.
    let allOk = true;
    for (const r of Array.from(registeredRef.current.values())) {
      try {
        const ok = await r.flush();
        if (!ok) allOk = false;
      } catch {
        allOk = false;
      }
    }
    return allOk;
  }, []);

  const status = useMemo(
    () => mergeStatuses(statuses, pendingIds),
    [statuses, pendingIds],
  );

  const displayStatus = useDisplayStatus(status);

  const hasPending = useMemo(() => {
    // Derive pending-ness from actual unsaved data (`pendingIds`) and from
    // whether a save is currently in flight. Error status alone is not enough
    // — e.g. the MiniApp toggle reverts on failure and has nothing unsaved,
    // and treating that as pending stuck the beforeunload guard on.
    // Form autosaves restore their pending entry on save failure so the
    // guard correctly stays on for them.
    if (status.state === "saving") return true;
    return pendingIds.size > 0;
  }, [status, pendingIds]);

  // Actions are stable across renders — every callback above is useCallback'd
  // with empty deps, so this object reference is too. Consumers that only need
  // actions (e.g. the autosave hooks) won't re-render when status changes.
  const actions = useMemo<SaveStatusActions>(
    () => ({ register, pushStatus, setPending, flushAll, runExclusive }),
    [register, pushStatus, setPending, flushAll, runExclusive],
  );

  const values = useMemo<SaveStatusValues>(
    () => ({ status, displayStatus, hasPending }),
    [status, displayStatus, hasPending],
  );

  useBeforeUnloadGuard(hasPending);

  return (
    <SaveStatusActionsContext.Provider value={actions}>
      <SaveStatusValuesContext.Provider value={values}>
        {children}
      </SaveStatusValuesContext.Provider>
    </SaveStatusActionsContext.Provider>
  );
};

// Convenience: get both actions and values together. Use only in places that
// genuinely need values (the indicator and review submit button) — using this
// elsewhere reintroduces the unnecessary re-render cascade.
export const useSaveStatus = (): SaveStatusActions & SaveStatusValues => {
  const actions = useContext(SaveStatusActionsContext);
  const values = useContext(SaveStatusValuesContext);
  if (!actions) {
    throw new Error("useSaveStatus must be used within SaveStatusProvider");
  }
  return { ...actions, ...values };
};

export const useOptionalSaveStatus = ():
  | (SaveStatusActions & SaveStatusValues)
  | null => {
  const actions = useContext(SaveStatusActionsContext);
  const values = useContext(SaveStatusValuesContext);
  if (!actions) return null;
  return { ...actions, ...values };
};

// Stable-actions-only hook — won't re-render the consumer on status changes.
export const useSaveStatusActions = (): SaveStatusActions | null =>
  useContext(SaveStatusActionsContext);

/**
 * Holds the underlying status long enough that "saving" stays on screen for
 * at least MIN_SAVING_VISIBLE_MS, and lets a "saved" pill linger for
 * SAVED_VISIBLE_MS before fading back to idle. Centralised here so the
 * indicator and any consumer button (e.g. Save Changes) share the same
 * displayed state instead of computing it independently.
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
      clearPending();
      setDisplay(status);
      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        setDisplay({ state: "idle" });
      }, SAVED_VISIBLE_MS);
      return;
    }

    savingShownAtRef.current = null;
    clearPending();
    setDisplay(status);
  }, [status]);

  // Clear any pending transition timer on unmount so a timeout can't fire
  // setDisplay on an already-unmounted provider after navigation away.
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
    };
  }, []);

  return display;
};

const useBeforeUnloadGuard = (shouldWarn: boolean) => {
  useEffect(() => {
    if (!shouldWarn) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [shouldWarn]);
};
