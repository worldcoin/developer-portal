"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { RefObject } from "react";

import { formatDeveloperDecisionMessage } from "../checklist";
import { ReviewerTestTarget } from "./ReviewerTestTarget";
import type { ReviewerDecision } from "./ReviewerDecisionComposer";

export type ReviewerDecisionConfirmationProps = {
  busy?: boolean;
  checklistProgress: { completed: number; total: number };
  decision: ReviewerDecision | null;
  decisionError?: string | null;
  developerMessage: string;
  failedLabels: string[];
  onConfirm: (decision: ReviewerDecision) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
  testTarget: React.ComponentProps<typeof ReviewerTestTarget>;
};

export const ReviewerDecisionConfirmation = ({
  busy = false,
  checklistProgress,
  decision,
  decisionError,
  developerMessage,
  failedLabels,
  onConfirm,
  onOpenChange,
  open,
  returnFocusRef,
  testTarget,
}: ReviewerDecisionConfirmationProps) => {
  const preview = decision
    ? formatDeveloperDecisionMessage({
        decision,
        developerMessage,
        failedLabels,
      })
    : "";
  const isRequestChanges = decision === "changes_requested";

  return (
    <Sheet onOpenChange={onOpenChange} open={open && Boolean(decision)}>
      <SheetContent
        aria-busy={busy || undefined}
        className="w-full overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(event) => {
          if (!returnFocusRef?.current) return;
          event.preventDefault();
          returnFocusRef.current.focus();
        }}
        side="right"
      >
        <SheetHeader>
          <SheetTitle>
            {isRequestChanges ? "Confirm request changes" : "Confirm approval"}
          </SheetTitle>
          <SheetDescription>
            Review the exact developer-facing message and submitted test target
            before making this decision.
          </SheetDescription>
        </SheetHeader>

        {decision ? (
          <div className="grid gap-5 px-4 pb-4">
            <section className="rounded-8 border border-grey-200 bg-grey-50 p-3">
              <p className="text-11 font-medium tracking-wide text-grey-500 uppercase">
                App
              </p>
              <p className="mt-1 text-14 font-semibold text-grey-900">
                {testTarget.appName}
              </p>
              <p className="mt-2 text-12 text-grey-700">
                {checklistProgress.completed} of {checklistProgress.total}{" "}
                checks complete
              </p>
            </section>

            <section>
              <h3 className="text-12 font-semibold text-grey-900">
                Outgoing message
              </h3>
              <pre
                aria-label="Formatted developer message"
                className="mt-2 rounded-8 border border-grey-200 bg-grey-50 p-3 font-sans text-13 leading-5 whitespace-pre-wrap text-grey-900"
              >
                {preview}
              </pre>
              {!preview ? (
                <p className="mt-2 text-12 text-grey-500">
                  This approval has no message to the developer.
                </p>
              ) : null}
            </section>

            <ReviewerTestTarget {...testTarget} />

            {busy ? (
              <p
                aria-live="polite"
                className="text-12 text-grey-500"
                role="status"
              >
                Sending decision.
              </p>
            ) : null}
            {decisionError ? (
              <p
                aria-live="assertive"
                className="text-12 text-system-error-700"
                role="alert"
              >
                {decisionError}
              </p>
            ) : null}
          </div>
        ) : null}

        <SheetFooter>
          <SheetClose asChild>
            <button
              className="rounded-8 border border-grey-300 bg-grey-0 px-3 py-2.5 text-13 font-semibold text-grey-700"
              type="button"
            >
              Cancel
            </button>
          </SheetClose>
          <button
            className="rounded-8 bg-grey-900 px-3 py-2.5 text-13 font-semibold text-grey-0"
            disabled={busy}
            onClick={() => {
              if (decision) onConfirm(decision);
            }}
            type="button"
          >
            {isRequestChanges ? "Confirm request changes" : "Confirm approval"}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
