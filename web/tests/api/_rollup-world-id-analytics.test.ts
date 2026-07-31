import { POST } from "@/api/_rollup-world-id-analytics";
import { NextRequest } from "next/server";
import { makeRollupOperationResult } from "../contracts/world-id-analytics-graphql";

// #region Mocks
const databaseOperation = jest.fn();
const loggerInfo = jest.fn();
const loggerError = jest.fn();

jest.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfo(...args),
    warn: jest.fn(),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "../../api/_rollup-world-id-analytics/graphql/rollup-world-id-analytics.generated",
  () => ({
    getSdk: () =>
      new Proxy(
        {},
        {
          get: () => databaseOperation,
        },
      ),
  }),
  { virtual: true },
);
// #endregion

// #region Test Data
const secret = "analytics-contract-secret";

const request = (authorization?: string) =>
  new NextRequest("http://localhost:3000/api/_rollup-world-id-analytics", {
    method: "POST",
    headers: authorization ? { authorization } : undefined,
  });

// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = secret;
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_DISABLED;
  databaseOperation.mockResolvedValue(makeRollupOperationResult(true));
});

// #region Authentication
describe("POST _rollup-world-id-analytics [authentication]", () => {
  it.each([undefined, "wrong-secret"])(
    "rejects an unauthenticated cron request",
    async (authorization) => {
      const response = await POST(request(authorization));

      expect(response.status).toBe(403);
      expect(databaseOperation).not.toHaveBeenCalled();
    },
  );
});
// #endregion

// #region Recurring rollup
describe("POST _rollup-world-id-analytics [rollup]", () => {
  it("invokes exactly one database-owned transaction", async () => {
    const response = await POST(request(`Bearer ${secret}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(databaseOperation).toHaveBeenCalledTimes(1);
    expect(loggerInfo).toHaveBeenCalledWith(
      "Rolled up World ID analytics",
      expect.any(Object),
    );
  });

  it("skips the database entirely while the rollout gate disables the rollup", async () => {
    process.env.WORLD_ID_ANALYTICS_ROLLUP_DISABLED = "true";

    const response = await POST(request(secret));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(databaseOperation).not.toHaveBeenCalled();
  });

  it("treats the database lock miss as a successful no-op", async () => {
    databaseOperation.mockResolvedValue(makeRollupOperationResult(false));

    const response = await POST(request(secret));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(databaseOperation).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the atomic database operation fails", async () => {
    databaseOperation.mockRejectedValue(new Error("v4 leg failed"));

    const response = await POST(request(secret));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(
      expect.objectContaining({ success: false }),
    );
    expect(loggerError).toHaveBeenCalledWith(
      "Error rolling up World ID analytics",
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
// #endregion
