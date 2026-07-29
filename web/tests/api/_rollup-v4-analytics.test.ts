import { POST } from "@/api/_rollup-v4-analytics";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

// #region Mocks
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const RollupV4Analytics = jest.fn();
jest.mock(
  "@/api/_rollup-v4-analytics/graphql/rollup-v4-analytics.generated",
  () => ({ getSdk: () => ({ RollupV4Analytics }) }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const createRequest = (authorization?: string) =>
  new NextRequest("http://localhost:3000/api/_rollup-v4-analytics", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });

const watermark = {
  key: "processed_through",
  timestamp_value: "2026-07-29T12:00:00.000Z",
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
});

// #region Authentication
describe("/api/_rollup-v4-analytics [auth]", () => {
  it.each([undefined, "Bearer wrong"])(
    "rejects a missing or wrong secret without calling Hasura",
    async (authorization) => {
      const response = (await POST(createRequest(authorization)))!;

      expect(response.status).toBe(403);
      expect(RollupV4Analytics).not.toHaveBeenCalled();
    },
  );
});
// #endregion

// #region Rollup outcomes
describe("/api/_rollup-v4-analytics [outcomes]", () => {
  it("calls the mutation once and logs the returned watermark", async () => {
    RollupV4Analytics.mockResolvedValue({
      rollup_v4_analytics: [watermark],
    });

    const response = (await POST(createRequest("Bearer internal-secret")))!;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      processed_through: watermark,
    });
    expect(RollupV4Analytics).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith("Rolled up v4 analytics", {
      processedThrough: watermark,
    });
  });

  it("treats an empty result as a successful lock miss", async () => {
    RollupV4Analytics.mockResolvedValue({ rollup_v4_analytics: [] });

    const response = (await POST(createRequest("Bearer internal-secret")))!;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      processed_through: null,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("fails cleanly without returning mutation internals", async () => {
    RollupV4Analytics.mockRejectedValue(new Error("Hasura secret detail"));

    const response = (await POST(createRequest("Bearer internal-secret")))!;

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: "V4 analytics rollup failed",
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(RollupV4Analytics).toHaveBeenCalledTimes(1);
  });

  it("retries one FK violation and succeeds", async () => {
    RollupV4Analytics.mockRejectedValueOnce({
      response: {
        errors: [
          {
            message: "database mutation failed",
            extensions: { internal: { error: { status_code: "23503" } } },
          },
        ],
      },
    }).mockResolvedValueOnce({ rollup_v4_analytics: [watermark] });

    const response = (await POST(createRequest("Bearer internal-secret")))!;

    expect(response.status).toBe(200);
    expect(RollupV4Analytics).toHaveBeenCalledTimes(2);
  });

  it("stops after the retry when the FK violation repeats", async () => {
    RollupV4Analytics.mockRejectedValue(
      new Error("postgres error 23503: foreign key violation"),
    );

    const response = (await POST(createRequest("Bearer internal-secret")))!;

    expect(response.status).toBe(500);
    expect(RollupV4Analytics).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
// #endregion
