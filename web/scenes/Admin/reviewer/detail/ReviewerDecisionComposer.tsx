"use client";

import {
  REVIEWER_DEVELOPER_MESSAGE_MAX_LENGTH,
  REVIEWER_OVERRIDE_REASON_MAX_LENGTH,
} from "@/lib/reviewer-limits";
import type { RefObject } from "react";

import type { ChecklistSaveState } from "./ReviewerChecklist";

export type ReviewerDecision = "approved" | "changes_requested";

export const appendReviewerNote = (message: string, note: string) => {
  const trimmedNote = note.trim();
  if (!trimmedNote) return message;
  const trimmedMessage = message.trimEnd();
  return trimmedMessage ? `${trimmedMessage}\n\n${trimmedNote}` : trimmedNote;
};

export type ReviewerDecisionComposerProps = {
  approvalDisabledReason?: string | null;
  blockedApprovalReason?: string | null;
  decisionError?: string | null;
  developerMessage: string;
  onDeveloperMessageChange: (message: string) => void;
  onOverrideReasonChange: (reason: string) => void;
  onSelectOutcome: (decision: ReviewerDecision) => void;
  overrideReason: string;
  requestChangesDisabledReason?: string | null;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
  saveError?: string | null;
  saveState: ChecklistSaveState;
};

const saveStateMessage: Partial<Record<ChecklistSaveState, string>> = {
  saving: "Saving checklist changes.",
  saved: "Checklist changes saved.",
};

export const ReviewerDecisionComposer = ({
  approvalDisabledReason,
  blockedApprovalReason,
  decisionError,
  developerMessage,
  onDeveloperMessageChange,
  onOverrideReasonChange,
  onSelectOutcome,
  overrideReason,
  requestChangesDisabledReason,
  returnFocusRef,
  saveError,
  saveState,
}: ReviewerDecisionComposerProps) => {
  const requestChangesReason =
    requestChangesDisabledReason ??
    (!developerMessage.trim()
      ? "A message to the developer is required to request changes."
      : null);
  const approvalReason =
    approvalDisabledReason ??
    (blockedApprovalReason && !overrideReason.trim()
      ? "Enter an override reason before approving despite blocked checks."
      : null);
  const routineSaveMessage = saveStateMessage[saveState];
  const errorMessage =
    saveState === "error"
      ? saveError ?? "Checklist save failed. Fix the error before deciding."
      : decisionError;

  return (
    <section aria-label="Decision composer" className="grid gap-4">
      <label
        className="grid gap-1 text-12 font-medium text-grey-700"
        htmlFor="reviewer-developer-message"
      >
        Message to developer
        <textarea
          className="min-h-28 resize-y rounded-8 border border-grey-200 p-3 text-13 font-normal text-grey-900"
          aria-label="Message to developer"
          id="reviewer-developer-message"
          maxLength={REVIEWER_DEVELOPER_MESSAGE_MAX_LENGTH}
          onChange={(event) => onDeveloperMessageChange(event.target.value)}
          placeholder="Required when requesting changes"
          value={developerMessage}
        />
        <span className="text-11 font-normal text-grey-500">
          {developerMessage.length.toLocaleString()} /{" "}
          {REVIEWER_DEVELOPER_MESSAGE_MAX_LENGTH.toLocaleString()}
        </span>
      </label>

      {blockedApprovalReason ? (
        <section className="grid gap-2 rounded-8 border border-system-warning-300 bg-system-warning-100 p-3">
          <div>
            <h3 className="text-13 font-semibold text-grey-900">
              Override blocked approval
            </h3>
            <p className="mt-1 text-12 text-grey-700">
              {blockedApprovalReason}
            </p>
          </div>
          <label
            className="grid gap-1 text-12 font-medium text-grey-700"
            htmlFor="reviewer-override-reason"
          >
            Override reason
            <textarea
              className="min-h-20 resize-y rounded-8 border border-grey-200 bg-grey-0 p-3 text-13 font-normal text-grey-900"
              id="reviewer-override-reason"
              maxLength={REVIEWER_OVERRIDE_REASON_MAX_LENGTH}
              onChange={(event) => onOverrideReasonChange(event.target.value)}
              placeholder="Explain why approval is still appropriate"
              value={overrideReason}
            />
          </label>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <button
            aria-describedby={
              requestChangesReason ? "request-changes-reason" : undefined
            }
            className="rounded-8 border border-system-error-300 bg-system-error-100 px-3 py-2.5 text-13 font-semibold text-system-error-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(requestChangesReason)}
            onClick={(event) => {
              if (returnFocusRef) returnFocusRef.current = event.currentTarget;
              onSelectOutcome("changes_requested");
            }}
            type="button"
          >
            Request changes
          </button>
          {requestChangesReason ? (
            <p
              className="text-11 leading-4 text-system-warning-700"
              id="request-changes-reason"
            >
              {requestChangesReason}
            </p>
          ) : null}
        </div>
        <div className="grid gap-1">
          <button
            aria-describedby={approvalReason ? "approve-reason" : undefined}
            className="rounded-8 bg-system-success-600 px-3 py-2.5 text-13 font-semibold text-grey-0 disabled:cursor-not-allowed disabled:bg-grey-300"
            disabled={Boolean(approvalReason)}
            onClick={(event) => {
              if (returnFocusRef) returnFocusRef.current = event.currentTarget;
              onSelectOutcome("approved");
            }}
            type="button"
          >
            Approve
          </button>
          {approvalReason ? (
            <p
              className="text-11 leading-4 text-system-warning-700"
              id="approve-reason"
            >
              {approvalReason}
            </p>
          ) : null}
        </div>
      </div>

      {routineSaveMessage ? (
        <p aria-live="polite" className="text-12 text-grey-500" role="status">
          {routineSaveMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          aria-live="assertive"
          className="text-12 text-system-error-700"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
};
