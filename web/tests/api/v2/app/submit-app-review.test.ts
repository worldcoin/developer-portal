import { POST } from "@/api/v2/app/submit-app-review";
import { NextRequest } from "next/server";
import { appReviewMockProof } from "../../__mocks__/app-review-proof.mock";

// #region Mocks
const InsertAppReview = jest.fn();
const UpdateAppReviewRating = jest.fn();

jest.mock(
  "../../../../api/v2/app/submit-app-review/graphql/insert-app-review.generated.ts",
  jest.fn(() => ({
    getSdk: () => ({
      InsertAppReview,
    }),
  })),
);

jest.mock(
  "../../../../api/v2/app/submit-app-review/graphql/update-app-review-rating.generated.ts",
  jest.fn(() => ({
    getSdk: () => ({
      UpdateAppReviewRating,
    }),
  })),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: jest.fn(() => Promise.resolve({ valid: true })),
    ok: true,
    status: 200,
  }),
) as jest.Mock;
// #endregion

// #region Test Data
// The mock nullifier is already in canonical (0x + 64 lowercase hex) form, so
// canonicalization is a no-op on it — this is the byte string the handler must
// use for every DB operation regardless of the request's encoding.
const CANONICAL_NULLIFIER = appReviewMockProof.nullifier_hash;

const validBody = {
  ...appReviewMockProof,
  rating: 3,
  country: "us",
  app_id: "app_staging_e396fd19c804e62f657767ccaa78885c",
};

const makeReq = (body: object) =>
  new NextRequest("https://cdn.test.com/api/v2/app/submit-app-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const uniqueViolation = () =>
  new Error(
    'Uniqueness violation. duplicate key value violates unique constraint "app_reviews_nullifier_hash_key"',
  );
// #endregion

// NOTE: app.rating_sum / rating_count are maintained by the
// app_reviews_maintain_rating DB trigger, so the handler no longer issues a
// counter mutation — these tests assert only the review-row write + status.
describe("/api/v2/app/submit-app-review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // #region New review (insert path)
  it("inserts a new review and returns 200 without an explicit counter write", async () => {
    InsertAppReview.mockResolvedValue({
      insert_app_reviews_one: { id: "review_1" },
    });

    const res = await POST(makeReq(validBody));

    expect(res.status).toBe(200);
    expect(InsertAppReview).toHaveBeenCalledWith(
      expect.objectContaining({
        app_id: validBody.app_id,
        rating: 3,
      }),
    );
    expect(UpdateAppReviewRating).not.toHaveBeenCalled();
  });
  // #endregion

  // #region Re-encoded nullifier collapses to one review (#3771446)
  it("canonicalizes the nullifier so a re-encoded hash maps to the same stored value", async () => {
    InsertAppReview.mockResolvedValue({
      insert_app_reviews_one: { id: "review_1" },
    });

    // Same nullifier, uppercased — a classic dedup-bypass re-encoding.
    const reEncoded = "0x" + validBody.nullifier_hash.slice(2).toUpperCase();
    await POST(makeReq({ ...validBody, nullifier_hash: reEncoded }));

    expect(InsertAppReview).toHaveBeenCalledWith(
      expect.objectContaining({ nullifier_hash: CANONICAL_NULLIFIER }),
    );
  });
  // #endregion

  // #region Existing review (unique-violation -> edit path) (#3703658)
  it("treats a unique-violation as an edit and updates the existing rating", async () => {
    InsertAppReview.mockRejectedValue(uniqueViolation());
    UpdateAppReviewRating.mockResolvedValue({
      update_app_reviews: { affected_rows: 1 },
    });

    const res = await POST(makeReq({ ...validBody, rating: 4 }));

    expect(res.status).toBe(200);
    expect(UpdateAppReviewRating).toHaveBeenCalledWith(
      expect.objectContaining({
        nullifier_hash: CANONICAL_NULLIFIER,
        rating: 4,
      }),
    );
  });
  // #endregion

  // #region Failure paths
  it("returns 500 on a non-uniqueness insert error", async () => {
    InsertAppReview.mockRejectedValue(new Error("connection reset"));

    const res = await POST(makeReq(validBody));

    expect(res.status).toBe(500);
    expect(UpdateAppReviewRating).not.toHaveBeenCalled();
  });

  it("returns 500 on a non-nullifier unique violation (e.g. friendly-id collision), not an edit", async () => {
    InsertAppReview.mockRejectedValue(
      new Error(
        'Uniqueness violation. duplicate key value violates unique constraint "app_reviews_pkey"',
      ),
    );

    const res = await POST(makeReq(validBody));

    expect(res.status).toBe(500);
    expect(UpdateAppReviewRating).not.toHaveBeenCalled();
  });

  it("returns 500 if the nullifier conflicts but the edit updates no rows", async () => {
    InsertAppReview.mockRejectedValue(uniqueViolation());
    UpdateAppReviewRating.mockResolvedValue({
      update_app_reviews: { affected_rows: 0 },
    });

    const res = await POST(makeReq(validBody));

    expect(res.status).toBe(500);
  });

  it("rejects an over-width nullifier_hash with a 400 instead of a 500", async () => {
    // A valid nullifier with bytes appended would pass proof verification but
    // overflow the canonicalizer; the schema length bound rejects it first.
    const overWide = "0x" + appReviewMockProof.nullifier_hash.slice(2) + "00";

    const res = await POST(makeReq({ ...validBody, nullifier_hash: overWide }));

    expect(res.status).toBe(400);
    expect(InsertAppReview).not.toHaveBeenCalled();
  });
  // #endregion
});
