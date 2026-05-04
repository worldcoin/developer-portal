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
};

const SaveStatusContext = createContext<SaveStatusContextValue | null>(null);

const mergeStatuses = (
  statuses: Map<string, AutosaveStatus>,
): AutosaveStatus => {
  let mostRecentSaved: { state: "saved"; at: number } | null = null;
  let firstError: AutosaveStatus | null = null;
  for (const status of statuses.values()) {
    if (status.state === "saving") return status;
    if (status.state === "error" && !firstError) firstError = status;
    if (
      status.state === "saved" &&
      (!mostRecentSaved || status.at > mostRecentSaved.at)
    ) {
      mostRecentSaved = status;
    }
  }
  if (firstError) return firstError;
  if (mostRecentSaved) return mostRecentSaved;
  return { state: "idle" };
};

export const SaveStatusProvider = ({ children }: { children: ReactNode }) => {
  const [statuses, setStatuses] = useState<Map<string, AutosaveStatus>>(
    () => new Map(),
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const registeredRef = useRef<Map<string, Registered>>(new Map());

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

  const status = useMemo(() => mergeStatuses(statuses), [statuses]);

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
    }),
    [status, hasPending, register, pushStatus, setPending, flushAll],
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
