"use client";

import type { ReviewerSubmissionStatus } from "../types";

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
  const isTerminal = ["approved", "changes_requested", "withdrawn"].includes(
    status,
  );
  const claimedByCurrentUser =
    claimedByEmail?.toLocaleLowerCase() ===
    currentUserEmail.toLocaleLowerCase();
  const claimExpired = Boolean(
    claimExpiresAt && Date.parse(claimExpiresAt) <= Date.now(),
  );

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
                  ? "Assigned to you, but this browser has no claim token"
                  : claimedByEmail
                    ? `Claimed by ${claimedByEmail}`
                    : isTerminal
                      ? "Review completed"
                      : "Unassigned"}
          </p>
          {claimExpiresAt ? (
            <time
              className="mt-1 block text-11 text-grey-500"
              dateTime={claimExpiresAt}
            >
              {claimExpired ? "Lease expired" : "Lease expires"}{" "}
              {new Date(claimExpiresAt).toLocaleString()}
            </time>
          ) : null}
          {!canReview ? (
            <p className="mt-2 text-12 text-system-warning-700">
              Reviewer access is required to claim or decide.
            </p>
          ) : null}
        </div>

        {hasActiveClaim ? (
          <button
            className="rounded-8 border border-grey-300 bg-grey-0 px-3 py-2 text-12 font-semibold text-grey-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || !canReview}
            onClick={onRelease}
            type="button"
          >
            Release claim
          </button>
        ) : (
          <button
            className="rounded-8 bg-grey-900 px-3 py-2 text-12 font-semibold text-grey-0 disabled:cursor-not-allowed disabled:bg-grey-300"
            disabled={
              busy ||
              !canReview ||
              (Boolean(claimedByEmail) && !claimExpired) ||
              isTerminal
            }
            onClick={onClaim}
            type="button"
          >
            Claim review
          </button>
        )}
      </div>
    </section>
  );
};
