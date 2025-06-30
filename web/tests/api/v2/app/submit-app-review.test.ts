import { POST } from "@/api/v2/app/submit-app-review";
import { NextRequest } from "next/server";
import { appReviewMockProof } from "../../__mocks__/app-review-proof.mock";

const UpsertAppReview = jest.fn();
const UpdateAppRatingSumMutation = jest.fn();
const GetAppReview = jest.fn();

jest.mock(
  "../../../../api/v2/app/submit-app-review/graphql/upsert-app-review.generated.ts",
  jest.fn(() => ({
    getSdk: () => ({
      UpsertAppReview,
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

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: jest.fn(() => Promise.resolve({ valid: true })),
    ok: true,
    status: 200,
  }),
) as jest.Mock;

const validBody = {
  ...appReviewMockProof,
  rating: 3,
  country: "us",
  app_id: "app_staging_e396fd19c804e62f657767ccaa78885c",
};

describe("/api/v2/app/submit-app-review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Can successfully submit an app review", async () => {
    const mockReq = new NextRequest(
      "https://cdn.test.com/api/v2/app/submit-app-review",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validBody),
      },
    );

    UpsertAppReview.mockResolvedValue({
      insert_app_reviews_one: {
        id: "1",
        app_id: validBody.app_id,
        country: validBody.country,
        rating: validBody.rating,
      },
    });

    UpdateAppRatingSumMutation.mockResolvedValue({
      update_app: {
        affected_rows: 1,
      },
    });

    GetAppReview.mockResolvedValue({
      app_reviews: [],
    });

    const res = await POST(mockReq);
    expect(res.status).toBe(200);
    expect(UpdateAppRatingSumMutation).toHaveBeenCalledTimes(1);
    expect(UpdateAppRatingSumMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        rating_count_inc: 1,
        rating: 3, // rating increment
        app_id: validBody.app_id,
      }),
    );
  });

  it("Does not increment rating_count if user updates existing rating", async () => {
    const validBody = {
      ...appReviewMockProof,
      rating: 4,
      country: "us",
      app_id: "app_staging_e396fd19c804e62f657767ccaa78885c",
    };
    const mockReq = new NextRequest(
      "https://cdn.test.com/api/v2/app/submit-app-review",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validBody),
      },
    );
    GetAppReview.mockResolvedValue({
      app_reviews: [{ rating: 3 }],
    });
    UpsertAppReview.mockResolvedValue({
      insert_app_reviews_one: {
        id: "review_123",
        rating: 4,
        app_id: validBody.app_id,
        country: validBody.country,
      },
    });
    UpdateAppRatingSumMutation.mockResolvedValue({
      update_app: {
        affected_rows: 1,
      },
    });
    const res = await POST(mockReq);
    expect(res.status).toBe(200);
    expect(UpdateAppRatingSumMutation).toHaveBeenCalledTimes(1);
    expect(UpdateAppRatingSumMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        rating_count_inc: 0,
        rating: 1, // rating increment
        app_id: validBody.app_id,
      }),
    );
  });
});
