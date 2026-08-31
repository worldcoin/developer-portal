import type { ReviewChecklist } from "@/api/admin/reviewer/request-schema";

export type ChecklistSaveQueueState = "idle" | "saving" | "saved" | "error";

export type ChecklistSaveQueue = {
  enqueue: (checklist: ReviewChecklist) => Promise<boolean>;
  flush: () => Promise<boolean>;
  retry: () => Promise<boolean>;
  reset: () => void;
};

export const createChecklistSaveQueue = ({
  onStateChange = () => undefined,
  save,
}: {
  onStateChange?: (state: ChecklistSaveQueueState) => void;
  save: (checklist: ReviewChecklist) => Promise<boolean>;
}): ChecklistSaveQueue => {
  let activePromise: Promise<boolean> | null = null;
  let pendingChecklist: ReviewChecklist | null = null;
  let failedChecklist: ReviewChecklist | null = null;
  let generation = 0;

  const drain = async (drainGeneration: number): Promise<boolean> => {
    onStateChange("saving");

    while (pendingChecklist) {
      const snapshot = pendingChecklist;
      pendingChecklist = null;

      let saved = false;
      try {
        saved = await save(snapshot);
      } catch {
        saved = false;
      }

      if (generation !== drainGeneration) return false;
      if (!saved) {
        failedChecklist = pendingChecklist ?? snapshot;
        pendingChecklist = null;
        onStateChange("error");
        return false;
      }
    }

    failedChecklist = null;
    onStateChange("saved");
    return true;
  };

  const startDrain = () => {
    if (activePromise) return activePromise;

    const drainGeneration = generation;
    const currentDrain = drain(drainGeneration);
    activePromise = currentDrain;
    void currentDrain.then(
      () => {
        if (activePromise === currentDrain) activePromise = null;
      },
      () => {
        if (activePromise === currentDrain) activePromise = null;
      },
    );
    return currentDrain;
  };

  const enqueue = (checklist: ReviewChecklist) => {
    pendingChecklist = checklist;
    failedChecklist = null;
    return startDrain();
  };

  const flush = async () => {
    while (activePromise) {
      const currentDrain = activePromise;
      const result = await currentDrain;
      if (!result) return false;
    }
    return failedChecklist === null;
  };

  const retry = () => {
    if (!failedChecklist) return flush();
    pendingChecklist = failedChecklist;
    failedChecklist = null;
    return startDrain();
  };

  const reset = () => {
    generation += 1;
    pendingChecklist = null;
    failedChecklist = null;
    onStateChange("idle");
  };

  return { enqueue, flush, reset, retry };
};
