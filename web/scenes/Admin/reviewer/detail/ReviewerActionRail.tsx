"use client";

import type { ReactNode } from "react";

import type { ChecklistSaveState } from "./ReviewerChecklist";
import { ReviewerTestTarget } from "./ReviewerTestTarget";

export type ReviewerActionRailProps = {
  checklistProgress: { completed: number; total: number };
  children: ReactNode;
  onOpenComposer: () => void;
  saveState: ChecklistSaveState;
  testTarget: React.ComponentProps<typeof ReviewerTestTarget>;
};

const saveStateMessage: Partial<Record<ChecklistSaveState, string>> = {
  saving: "Saving checklist changes.",
  saved: "Checklist changes saved.",
};

export const ReviewerActionRail = ({
  checklistProgress,
  children,
  onOpenComposer,
  saveState,
  testTarget,
}: ReviewerActionRailProps) => {
  const completion = `${checklistProgress.completed} of ${checklistProgress.total} checks complete`;
  const saveMessage = saveStateMessage[saveState];

  return (
    <>
      <aside
        className="hidden lg:sticky lg:top-0 lg:order-none lg:col-start-2 lg:row-start-1 lg:block lg:max-h-[calc(100dvh-2rem)] lg:w-[360px] lg:shrink-0 lg:overflow-y-auto"
        data-testid="reviewer-desktop-action-rail"
      >
        <div className="grid gap-4 rounded-16 border border-grey-200 bg-grey-0/90 p-4 backdrop-blur-md">
          <ReviewerTestTarget {...testTarget} layout="stacked" />
          {children}
        </div>
      </aside>

      <div
        className="sticky top-0 z-20 order-1 lg:hidden"
        data-testid="reviewer-mobile-test-target"
      >
        <ReviewerTestTarget {...testTarget} compact />
      </div>
      <div className="sticky bottom-0 z-20 order-3 flex items-center justify-between gap-3 border-t border-grey-200 bg-grey-0/95 p-3 backdrop-blur-md lg:hidden">
        <div>
          <p className="text-12 font-medium text-grey-900">{completion}</p>
          {saveMessage ? (
            <p
              aria-live="polite"
              className="text-11 text-grey-500"
              role="status"
            >
              {saveMessage}
            </p>
          ) : null}
          {saveState === "error" ? (
            <p
              aria-live="assertive"
              className="text-11 text-system-error-700"
              id="reviewer-decision-save-error"
              role="alert"
            >
              Checklist save failed. Decisions are unavailable.
            </p>
          ) : null}
        </div>
        <button
          aria-describedby={
            saveState === "error" ? "reviewer-decision-save-error" : undefined
          }
          className="min-h-11 min-w-11 rounded-8 bg-grey-900 px-3 py-2.5 text-13 font-semibold text-grey-0"
          disabled={saveState === "error"}
          onClick={onOpenComposer}
          type="button"
        >
          Message and decide
        </button>
      </div>
    </>
  );
};
