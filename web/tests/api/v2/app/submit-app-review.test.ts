import { POST } from "@/api/v2/app/submit-app-review";
import { NextRequest } from "next/server";
import { appReviewMockProof } from "../../__mocks__/app-review-proof.mock";

// #region Mocks
const InsertAppReview = jest.fn();
const UpdateAppReviewRating = jest.fn();
const UpdateAppRatingSumMutation = jest.fn();
const GetAppReview = jest.fn();

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

jest.mock(
  "../../../../api/v2/app/submit-app-review/graphql/update-review-counter.generated.ts",
  jest.fn(() => ({
    getSdk: () => ({
      UpdateAppRatingSumMutation,
    }),
  })),
);

jest.mock(
  "../../../../api/v2/app/submit-app-review/graphql/fetch-current-app-review.generated.ts",
  jest.fn(() => ({
    getSdk: () => ({
      GetAppReview,
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

describe("/api/v2/app/submit-app-review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    UpdateAppRatingSumMutation.mockResolvedValue({
      update_app: { affected_rows: 1 },
    });
  });

  // #region New review (insert path)
  it("inserts a new review and increments rating_count by 1", async () => {
    InsertAppReview.mockResolvedValue({
      insert_app_reviews_one: { id: "review_1" },
    });

    const res = await POST(makeReq(validBody));

    expect(res.status).toBe(200);
    // Counts the review exactly once, using the full rating as the sum delta.
    expect(UpdateAppRatingSumMutation).toHaveBeenCalledTimes(1);
    expect(UpdateAppRatingSumMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        rating_count_inc: 1,
        rating: 3,
        app_id: validBody.app_id,
      }),
    );
    // The edit path must not run for a brand-new review.
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
  it("treats a unique-violation as an edit: updates rating, does not increment count", async () => {
    InsertAppReview.mockRejectedValue(uniqueViolation());
    GetAppReview.mockResolvedValue({ app_reviews: [{ rating: 1 }] });
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
    // count unchanged; sum adjusted by the delta only (4 - 1).
    expect(UpdateAppRatingSumMutation).toHaveBeenCalledWith(
      expect.objectContaining({ rating_count_inc: 0, rating: 3 }),
    );
  });
  // #endregion

  // #region Real insert failure
  it("returns 500 and does not touch the counter on a non-uniqueness insert error", async () => {
    InsertAppReview.mockRejectedValue(new Error("connection reset"));

    const res = await POST(makeReq(validBody));

    expect(res.status).toBe(500);
    expect(UpdateAppReviewRating).not.toHaveBeenCalled();
    expect(UpdateAppRatingSumMutation).not.toHaveBeenCalled();
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
    expect(UpdateAppRatingSumMutation).not.toHaveBeenCalled();
  });

  it("returns 500 if the nullifier conflicts but the existing review can't be read back", async () => {
    InsertAppReview.mockRejectedValue(uniqueViolation());
    GetAppReview.mockResolvedValue({ app_reviews: [] });

    const res = await POST(makeReq(validBody));

    expect(res.status).toBe(500);
    expect(UpdateAppReviewRating).not.toHaveBeenCalled();
    expect(UpdateAppRatingSumMutation).not.toHaveBeenCalled();
  });
  // #endregion
});
