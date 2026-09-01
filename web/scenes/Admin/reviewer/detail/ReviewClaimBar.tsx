"use client";

import type { ReviewerSubmissionStatus } from "../types";
import { ReviewerDateTime, useReviewerNow } from "./ReviewerTime";

export const ReviewClaimBar = ({
  busy = false,
  canReview,
  claimExpiresAt,
  claimedByEmail,
  currentUserEmail,
  hasActiveClaim = false,
  onClaim,
  onRelease,
  status,
}: {
  busy?: boolean;
  canReview: boolean;
  claimExpiresAt: string | null;
  claimedByEmail: string | null;
  currentUserEmail: string;
  hasActiveClaim?: boolean;
  onClaim?: () => void;
  onRelease?: () => void;
  reviewId: string;
  reviewVersion: number;
  status: ReviewerSubmissionStatus;
}) => {
  const now = useReviewerNow();
  const isTerminal = ["approved", "changes_requested", "withdrawn"].includes(
    status,
  );
  const claimedByCurrentUser =
    claimedByEmail?.toLocaleLowerCase() ===
    currentUserEmail.toLocaleLowerCase();
  const claimExpired = Boolean(
    now !== null && claimExpiresAt && Date.parse(claimExpiresAt) <= now,
  );
  const canRecoverClaim =
    claimedByCurrentUser && Boolean(claimedByEmail) && !claimExpired;

  return (
    <section
      aria-label="Review claim"
      className="rounded-12 border border-grey-200 bg-grey-50 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-11 font-medium tracking-wide text-grey-400 uppercase">
            Claim
          </p>
          <p className="mt-1 text-13 font-medium text-grey-900">
            {hasActiveClaim
              ? "Claimed by you"
              : claimExpired
                ? "Lease expired, available to claim"
                : claimedByCurrentUser
                  ? "Assigned to you — recover the claim for this browser"
                  : claimedByEmail
                    ? `Claimed by ${claimedByEmail}`
                    : isTerminal
                      ? "Review completed"
                      : "Unassigned"}
          </p>
          {claimExpiresAt ? (
            <p className="mt-1 block text-11 text-grey-500">
              {claimExpired ? "Lease expired" : "Lease expires"}{" "}
              <ReviewerDateTime value={claimExpiresAt} />
            </p>
          ) : null}
          {!canReview ? (
            <p className="mt-2 text-12 text-system-warning-700">
              Reviewer access is required to claim or decide.
            </p>
          ) : null}
        </div>

        {hasActiveClaim ? (
          <button
            className="min-h-11 min-w-11 rounded-8 border border-grey-300 bg-grey-0 px-3 py-2 text-12 font-semibold text-grey-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || !canReview}
            onClick={onRelease}
            type="button"
          >
            Release claim
          </button>
        ) : (
          <button
            className="min-h-11 min-w-11 rounded-8 bg-grey-900 px-3 py-2 text-12 font-semibold text-grey-0 disabled:cursor-not-allowed disabled:bg-grey-300"
            disabled={
              busy ||
              !canReview ||
              (Boolean(claimedByEmail) &&
                !claimExpired &&
                !claimedByCurrentUser) ||
              isTerminal
            }
            onClick={onClaim}
            type="button"
          >
            {canRecoverClaim ? "Recover claim" : "Claim review"}
          </button>
        )}
      </div>
    </section>
  );
};
