/** @jest-environment jsdom */

import {
  clearReviewerClaimSession,
  readReviewerClaimSession,
  reviewerClaimSessionKey,
  shouldHeartbeatReviewerClaim,
  writeReviewerClaimSession,
} from "@/scenes/Admin/reviewer/detail/claim-session";

const reviewId = "00000000-0000-4000-8000-000000000001";
const claimToken = "00000000-0000-4000-8000-000000000099";

describe("reviewer claim tab session", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("restores only an unexpired token scoped to the exact review version", () => {
    writeReviewerClaimSession(reviewId, {
      claimToken,
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
      reviewVersion: 7,
    });

    expect(
      readReviewerClaimSession(reviewId, 7, new Date("2026-08-27")),
    ).toEqual({
      claimToken,
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
      reviewVersion: 7,
    });
    expect(
      readReviewerClaimSession(reviewId, 8, new Date("2026-08-27")),
    ).toBeNull();
    expect(
      window.sessionStorage.getItem(reviewerClaimSessionKey(reviewId)),
    ).toBeNull();
  });

  it("clears expired, malformed, and explicitly released claims", () => {
    window.sessionStorage.setItem(
      reviewerClaimSessionKey(reviewId),
      "not-json",
    );
    expect(readReviewerClaimSession(reviewId, 1)).toBeNull();

    window.sessionStorage.setItem(
      reviewerClaimSessionKey(reviewId),
      JSON.stringify({
        claimToken,
        claimExpiresAt: "not-a-timestamp",
        reviewVersion: 1,
      }),
    );
    expect(readReviewerClaimSession(reviewId, 1)).toBeNull();

    writeReviewerClaimSession(reviewId, {
      claimToken,
      claimExpiresAt: "2000-01-01T00:00:00.000Z",
      reviewVersion: 1,
    });
    expect(readReviewerClaimSession(reviewId, 1)).toBeNull();

    writeReviewerClaimSession(reviewId, {
      claimToken,
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
      reviewVersion: 1,
    });
    clearReviewerClaimSession(reviewId);
    expect(
      window.sessionStorage.getItem(reviewerClaimSessionKey(reviewId)),
    ).toBeNull();
  });
});

describe("reviewer heartbeat gate", () => {
  it("pauses while another workflow write is pending", () => {
    const base = {
      canReview: true,
      claimToken,
      status: "in_review" as const,
      visibilityState: "visible" as const,
    };

    expect(shouldHeartbeatReviewerClaim({ ...base, busyAction: null })).toBe(
      true,
    );
    expect(
      shouldHeartbeatReviewerClaim({ ...base, busyAction: "approved" }),
    ).toBe(false);
    expect(
      shouldHeartbeatReviewerClaim({
        ...base,
        busyAction: "changes_requested",
      }),
    ).toBe(false);
    expect(
      shouldHeartbeatReviewerClaim({
        ...base,
        busyAction: "checklist",
      }),
    ).toBe(false);
  });
});
