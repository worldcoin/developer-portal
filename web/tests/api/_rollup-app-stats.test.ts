import { POST } from "@/api/_rollup-app-stats";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

// #region Mocks
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const RollupVerificationStats = jest.fn();
jest.mock(
  "@/api/_rollup-app-stats/graphql/rollup-verification-stats.generated",
  () => ({ getSdk: () => ({ RollupVerificationStats }) }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const createRequest = (authorization?: string) =>
  new NextRequest("http://localhost:3000/api/_rollup-app-stats", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

const rollupRow = {
  job: "rollup",
  status: "applied",
  items: 3,
  repaired: 0,
  alerts: 0,
  detail: null,
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  RollupVerificationStats.mockReset();
  process.env.INTERNAL_ENDPOINTS_SECRET = "test-secret";
});

// #region Auth
describe("/api/_rollup-app-stats [auth]", () => {
  it.each([undefined, "Bearer wrong-secret"])(
    "rejects a request with authorization %s",
    async (authorization) => {
      const res = (await POST(createRequest(authorization)))!;

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        code: "permission_denied",
        detail: "You do not have permission to perform this action.",
        attribute: null,
      });
      expect(RollupVerificationStats).not.toHaveBeenCalled();
    },
  );
});
// #endregion

// #region Rollup
describe("/api/_rollup-app-stats [rollup]", () => {
  it("rolls up verification stats and returns the result", async () => {
    RollupVerificationStats.mockResolvedValue({
      rollup_verification_stats: [rollupRow],
    });

    const res = (await POST(createRequest("Bearer test-secret")))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, result: rollupRow });
    expect(RollupVerificationStats).toHaveBeenCalledTimes(1);
    expect(RollupVerificationStats).toHaveBeenCalledWith();
  });

  it("returns a 500 response and logs when the rollup fails", async () => {
    const error = new Error("rollup failed");
    RollupVerificationStats.mockRejectedValue(error);

    const res = (await POST(createRequest("Bearer test-secret")))!;

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      success: false,
      error: "rollup failed",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Error rolling up verification stats",
      { error },
    );
  });

  it("returns null when the rollup produces no rows", async () => {
    RollupVerificationStats.mockResolvedValue({
      rollup_verification_stats: [],
    });

    const res = (await POST(createRequest("Bearer test-secret")))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, result: null });
    expect(RollupVerificationStats).toHaveBeenCalledTimes(1);
  });
});
// #endregion
