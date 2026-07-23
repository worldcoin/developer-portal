import { POST } from "@/api/_reconcile-verification-stats";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

// #region Mocks
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const ReconcileVerificationStats = jest.fn();
jest.mock(
  "@/api/_reconcile-verification-stats/graphql/reconcile-verification-stats.generated",
  () => ({ getSdk: () => ({ ReconcileVerificationStats }) }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
type ReconciliationRow = {
  job: string;
  status: string;
  items: number;
  repaired: number;
  alerts: number;
  detail: string;
};

const createRequest = (authorization?: string) =>
  new NextRequest("http://localhost:3000/api/_reconcile-verification-stats", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

const makeRow = (overrides: Partial<ReconciliationRow> = {}) => ({
  job: "reconciliation",
  status: "done",
  items: 1,
  repaired: 0,
  alerts: 0,
  detail: "reconciliation complete",
  ...overrides,
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  ReconcileVerificationStats.mockReset();
  process.env.INTERNAL_ENDPOINTS_SECRET = "test-secret";
});

// #region Auth
describe("/api/_reconcile-verification-stats [auth]", () => {
  it("rejects a request without the internal secret", async () => {
    const res = (await POST(createRequest()))!;

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      code: "permission_denied",
      detail: "You do not have permission to perform this action.",
      attribute: null,
    });
    expect(ReconcileVerificationStats).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Reconciliation
describe("/api/_reconcile-verification-stats [reconciliation]", () => {
  it("returns a completed single-batch reconciliation", async () => {
    ReconcileVerificationStats.mockResolvedValue({
      reconcile_verification_stats: [makeRow()],
    });

    const res = (await POST(createRequest("Bearer test-secret")))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      status: "done",
      batches: 1,
      repaired: 0,
      alerts: 0,
    });
    expect(ReconcileVerificationStats).toHaveBeenCalledTimes(1);
    expect(ReconcileVerificationStats).toHaveBeenCalledWith({
      batch_size: 500,
    });
  });

  it("continues across batches and sums repaired items and alerts", async () => {
    ReconcileVerificationStats.mockResolvedValueOnce({
      reconcile_verification_stats: [
        makeRow({ status: "continue", repaired: 2, alerts: 1 }),
      ],
    }).mockResolvedValueOnce({
      reconcile_verification_stats: [
        makeRow({ status: "done", repaired: 3, alerts: 2 }),
      ],
    });

    const res = (await POST(createRequest("Bearer test-secret")))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      status: "done",
      batches: 2,
      repaired: 5,
      alerts: 3,
    });
    expect(ReconcileVerificationStats).toHaveBeenCalledTimes(2);
    expect(ReconcileVerificationStats).toHaveBeenNthCalledWith(1, {
      batch_size: 500,
    });
    expect(ReconcileVerificationStats).toHaveBeenNthCalledWith(2, {
      batch_size: 500,
    });
  });

  it("logs reconciliation drift and includes alerts in the response", async () => {
    const row = makeRow({ alerts: 2 });
    ReconcileVerificationStats.mockResolvedValue({
      reconcile_verification_stats: [row],
    });

    const res = (await POST(createRequest("Bearer test-secret")))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      status: "done",
      batches: 1,
      repaired: 0,
      alerts: 2,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Verification stats reconciliation drift",
      { row },
    );
  });

  it("retries a lock miss without counting it as a batch", async () => {
    ReconcileVerificationStats.mockResolvedValueOnce({
      reconcile_verification_stats: [makeRow({ status: "lock_not_acquired" })],
    }).mockResolvedValueOnce({
      reconcile_verification_stats: [makeRow()],
    });

    const res = (await POST(createRequest("Bearer test-secret")))!;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      status: "done",
      batches: 1,
      repaired: 0,
      alerts: 0,
    });
    expect(ReconcileVerificationStats).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("stops after a continue batch when the time budget is exhausted", async () => {
    let now = 0;
    const dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => {
      now += 30_000;
      return now;
    });
    ReconcileVerificationStats.mockResolvedValue({
      reconcile_verification_stats: [makeRow({ status: "continue" })],
    });

    try {
      const res = (await POST(createRequest("Bearer test-secret")))!;

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        status: "continue",
        batches: 1,
        repaired: 0,
        alerts: 0,
      });
      expect(ReconcileVerificationStats).toHaveBeenCalledTimes(1);
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it("returns a 500 response when reconciliation returns no rows", async () => {
    ReconcileVerificationStats.mockResolvedValue({
      reconcile_verification_stats: [],
    });

    const res = (await POST(createRequest("Bearer test-secret")))!;

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      success: false,
      error: "reconcile_verification_stats returned no rows",
    });
  });
});
// #endregion
