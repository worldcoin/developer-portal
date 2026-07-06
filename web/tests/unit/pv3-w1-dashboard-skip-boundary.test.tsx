/** @jest-environment jsdom */
// Boundary proof for the dashboard's `skip` gating: exercises the REAL
// `useGetAccumulativeTransactions` / `useGetMetrics` hooks via renderHook and
// asserts on the mocked server-action modules directly (the I/O boundary),
// not on a mocked hook. This complements pv3-w1-dashboard-integrator.test.tsx,
// which mocks these hooks at module scope to test AppStatsGraph's composition
// — that top-level jest.mock makes it impossible to also exercise the real
// hooks in the same file, hence a separate file here.
import { renderHook, waitFor } from "@testing-library/react";

// #region Mocks

const getAccumulativePaymentsData = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page/server/getAccumulativeTransactionData",
  () => ({
    getAccumulativePaymentsData: (...a: unknown[]) =>
      getAccumulativePaymentsData(...a),
  }),
);

const getAppMetricsData = jest.fn();
jest.mock("@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/server", () => ({
  getAppMetricsData: (...a: unknown[]) => getAppMetricsData(...a),
}));

// #endregion

import { useGetAccumulativeTransactions } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/AppStatsGraph/GraphsSection/use-get-accumulative-transactions";
import { useGetMetrics } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/AppStatsGraph/StatCards/use-get-metrics";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useGetAccumulativeTransactions — skip boundary", () => {
  it("skip: true never calls the server action and settles loading=false", async () => {
    const { result } = renderHook(() =>
      useGetAccumulativeTransactions("app_1", { skip: true }),
    );

    expect(result.current.loading).toBe(false);
    await waitFor(() =>
      expect(getAccumulativePaymentsData).not.toHaveBeenCalled(),
    );
  });

  it("skip: false calls the server action and returns its data", async () => {
    getAccumulativePaymentsData.mockResolvedValue({
      success: true,
      message: "ok",
      data: {
        accumulativePayments: [],
        accumulatedTokenAmountUSD: 0,
      },
    });

    const { result } = renderHook(() =>
      useGetAccumulativeTransactions("app_1", { skip: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getAccumulativePaymentsData).toHaveBeenCalledWith("app_1");
    expect(result.current.payments).toEqual({
      accumulativePayments: [],
      accumulatedTokenAmountUSD: 0,
    });
  });
});

describe("useGetMetrics — skip boundary", () => {
  it("skip: true never calls the server action and settles loading=false", async () => {
    const { result } = renderHook(() => useGetMetrics("app_1", { skip: true }));

    expect(result.current.loading).toBe(false);
    await waitFor(() => expect(getAppMetricsData).not.toHaveBeenCalled());
  });

  it("skip: false calls the server action and returns its data", async () => {
    getAppMetricsData.mockResolvedValue({
      success: true,
      message: "ok",
      data: {
        total_impressions: 0,
        total_impressions_last_7_days: 0,
        total_users: 0,
        total_users_last_7_days: 0,
        unique_users: 0,
        unique_users_last_7_days: 0,
        new_users_last_7_days: 0,
        appRanking: "-- / --",
        open_rate_last_14_days: [],
        notification_opt_in_rate: 0,
      },
    });

    const { result } = renderHook(() =>
      useGetMetrics("app_1", { skip: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getAppMetricsData).toHaveBeenCalledWith("app_1");
    expect(result.current.metrics?.appRanking).toBe("-- / --");
  });
});
