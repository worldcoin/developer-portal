import type { ReviewerSubmissionStatus } from "../types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ReviewerClaimSession = {
  claimToken: string;
  claimExpiresAt: string;
  reviewVersion: number;
};

export const reviewerClaimSessionKey = (reviewId: string) =>
  `admin-reviewer-claim:${reviewId}`;

const sessionStorageAvailable = () => typeof window !== "undefined";

export const clearReviewerClaimSession = (reviewId: string) => {
  if (!sessionStorageAvailable()) return;
  try {
    window.sessionStorage.removeItem(reviewerClaimSessionKey(reviewId));
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
};

export const writeReviewerClaimSession = (
  reviewId: string,
  claim: ReviewerClaimSession,
) => {
  if (!sessionStorageAvailable()) return;
  try {
    window.sessionStorage.setItem(
      reviewerClaimSessionKey(reviewId),
      JSON.stringify(claim),
    );
  } catch {
    // The in-memory state remains usable if tab storage is unavailable.
  }
};

export const readReviewerClaimSession = (
  reviewId: string,
  expectedReviewVersion: number,
  now = new Date(),
): ReviewerClaimSession | null => {
  if (!sessionStorageAvailable()) return null;

  try {
    const serialized = window.sessionStorage.getItem(
      reviewerClaimSessionKey(reviewId),
    );
    if (!serialized) return null;
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      clearReviewerClaimSession(reviewId);
      return null;
    }
    const claim = value as Record<string, unknown>;
    const claimExpiry =
      typeof claim.claimExpiresAt === "string"
        ? Date.parse(claim.claimExpiresAt)
        : Number.NaN;
    if (
      typeof claim.claimToken !== "string" ||
      !UUID_PATTERN.test(claim.claimToken) ||
      typeof claim.claimExpiresAt !== "string" ||
      !Number.isFinite(claimExpiry) ||
      !Number.isInteger(claim.reviewVersion) ||
      claim.reviewVersion !== expectedReviewVersion ||
      claimExpiry <= now.getTime()
    ) {
      clearReviewerClaimSession(reviewId);
      return null;
    }
    return claim as ReviewerClaimSession;
  } catch {
    clearReviewerClaimSession(reviewId);
    return null;
  }
};

export const shouldHeartbeatReviewerClaim = ({
  busyAction,
  canReview,
  claimToken,
  status,
  visibilityState,
}: {
  busyAction: string | null;
  canReview: boolean;
  claimToken: string | null;
  status: ReviewerSubmissionStatus;
  visibilityState: DocumentVisibilityState;
}) =>
  canReview &&
  Boolean(claimToken) &&
  status === "in_review" &&
  visibilityState === "visible" &&
  busyAction === null;
