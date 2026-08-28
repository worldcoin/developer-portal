const cloudFrontSend = jest.fn();
const clearMetricsCache = jest.fn();

jest.mock("@aws-sdk/client-cloudfront", () => ({
  CloudFrontClient: jest.fn().mockImplementation(() => ({
    send: (...args: unknown[]) => cloudFrontSend(...args),
  })),
  CreateInvalidationCommand: jest
    .fn()
    .mockImplementation((input: unknown) => input),
}));

jest.mock("@/api/helpers/fetch-metrics", () => ({
  clearMetricsCache: (...args: unknown[]) => clearMetricsCache(...args),
}));

import { invalidateAppCatalogCache } from "@/api/helpers/invalidate-app-catalog-cache";

describe("app catalog invalidation", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await global.RedisClient?.flushall();
    process.env.ASSETS_S3_REGION = "us-east-1";
    process.env.CLOUDFRONT_DISTRIBUTION_ID = "distribution-1";
    cloudFrontSend.mockResolvedValue({ Invalidation: { Id: "INV-1" } });
  });

  it("atomically debounces concurrent invalidations and honors the caller deadline", async () => {
    const abortSignal = AbortSignal.timeout(15_000);

    const results = await Promise.all([
      invalidateAppCatalogCache({
        callerReference: "review:11111111-1111-4111-8111-111111111111",
        abortSignal,
      }),
      invalidateAppCatalogCache({
        callerReference: "review:22222222-2222-4222-8222-222222222222",
        abortSignal,
      }),
    ]);

    expect(results.filter(({ debounced }) => debounced)).toHaveLength(1);
    expect(clearMetricsCache).toHaveBeenCalledTimes(1);
    expect(cloudFrontSend).toHaveBeenCalledTimes(1);
    expect(cloudFrontSend).toHaveBeenCalledWith(
      expect.objectContaining({
        InvalidationBatch: expect.objectContaining({
          CallerReference: expect.stringMatching(/^review:/),
        }),
      }),
      { abortSignal },
    );
  });
});
