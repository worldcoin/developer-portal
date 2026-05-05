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

type Registered = {
  flush: () => Promise<boolean>;
};

type SaveStatusContextValue = {
  status: AutosaveStatus;
  hasPending: boolean;
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

const SaveStatusContext = createContext<SaveStatusContextValue | null>(null);

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

  const value = useMemo<SaveStatusContextValue>(
    () => ({
      status,
      hasPending,
      register,
      pushStatus,
      setPending,
      flushAll,
      runExclusive,
    }),
    [
      status,
      hasPending,
      register,
      pushStatus,
      setPending,
      flushAll,
      runExclusive,
    ],
  );

  useBeforeUnloadGuard(hasPending);

  return (
    <SaveStatusContext.Provider value={value}>
      {children}
    </SaveStatusContext.Provider>
  );
};

export const useSaveStatus = (): SaveStatusContextValue => {
  const ctx = useContext(SaveStatusContext);
  if (!ctx) {
    throw new Error("useSaveStatus must be used within SaveStatusProvider");
  }
  return ctx;
};

export const useOptionalSaveStatus = (): SaveStatusContextValue | null =>
  useContext(SaveStatusContext);

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
