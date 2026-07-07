/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks

const useAppCapabilities = jest.fn();
jest.mock("@/scenes/PortalV3/layout/Shell/use-app-capabilities", () => ({
  useAppCapabilities: (...a: unknown[]) => useAppCapabilities(...a),
}));

const useFetchAppStatsQuery = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/page/AppStatsGraph/graphql/client/fetch-app-stats.generated",
  () => ({
    useFetchAppStatsQuery: (...a: unknown[]) => useFetchAppStatsQuery(...a),
  }),
);

const useGetMetrics = jest.fn();
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/AppStatsGraph/StatCards/use-get-metrics",
  () => ({
    useGetMetrics: (...a: unknown[]) => useGetMetrics(...a),
  }),
);

const useGetAccumulativeTransactions = jest.fn();
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/AppStatsGraph/GraphsSection/use-get-accumulative-transactions",
  () => ({
    useGetAccumulativeTransactions: (...a: unknown[]) =>
      useGetAccumulativeTransactions(...a),
  }),
);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useParams: () => ({ teamId: "team_1" }),
}));

// #endregion

import { AppStatsGraph } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/AppStatsGraph";

// #region Test Data

const caps = (
  o: Partial<{
    isMiniApp: boolean;
    hasLegacyActions: boolean;
    loaded: boolean;
  }>,
) =>
  useAppCapabilities.mockReturnValue({
    isMiniApp: false,
    hasLegacyActions: false,
    loaded: true,
    ...o,
  });

const appStats = (
  stats: { date: string; verifications: number; unique_users: number }[],
) => ({
  data: {
    app_stats: stats.map((s) => ({ app_id: "app_1", ...s })),
    app: [{ id: "app_1", engine: "cloud" }],
  },
  loading: false,
});

const noMetrics = () => ({ metrics: null, loading: false, error: null });
const noPayments = () => ({
  payments: null,
  transactions: null,
  loading: false,
  error: null,
});

// A 10-entry cumulative series so the 7d-delta math has a clear hand
// computation: verifications go 10,20,...,100 (delta over last 7 entries =
// 100 - 30 = 70); unique_users go 5,10,...,50 (last value 50).
const tenDayStats = Array.from({ length: 10 }, (_, i) => ({
  date: `2026-01-${String(i + 1).padStart(2, "0")}`,
  verifications: (i + 1) * 10,
  unique_users: (i + 1) * 5,
}));

beforeEach(() => {
  jest.clearAllMocks();
  useGetMetrics.mockReturnValue(noMetrics());
  useGetAccumulativeTransactions.mockReturnValue(noPayments());
  useFetchAppStatsQuery.mockReturnValue(appStats(tenDayStats));
});

const renderGraph = () =>
  render(
    <AppStatsGraph
      appId="app_1"
      teamId="team_1"
      timePeriod="weekly"
      onTimePeriodChange={jest.fn()}
    />,
  );

// #endregion

describe("AppStatsGraph — integrator (non-mini-app) default", () => {
  it("hides Payments and Notifications tabs and never invokes the payments hook meaningfully (skip: true)", () => {
    caps({});
    renderGraph();

    expect(
      screen.getByRole("button", { name: "Verifications" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Payments")).toBeNull();
    expect(screen.queryByText("Notifications")).toBeNull();

    // Payments hook is a plain useEffect-based hook (no Apollo skip option),
    // so gating happens via an explicit `skip` argument rather than not
    // calling the hook (calling hooks conditionally would violate rules of
    // hooks). Assert it was called with skip: true.
    expect(useGetAccumulativeTransactions).toHaveBeenCalledWith(
      "app_1",
      expect.objectContaining({ skip: true }),
    );
  });

  it("StatsRow shows the three verification stat labels with correctly computed values", () => {
    caps({});
    renderGraph();

    // StatsRow renders both a mobile and a desktop layout (CSS-hidden via
    // Tailwind responsive classes, both present in jsdom), so each label /
    // value appears twice — assert at least one of each.
    expect(screen.getAllByText("Total verifications").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Unique humans").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Verifications (7d)").length).toBeGreaterThan(0);

    // Total verifications = last cumulative value = 100.
    expect(screen.getAllByText("100").length).toBeGreaterThan(0);
    // Unique humans = last cumulative unique_users = 50.
    expect(screen.getAllByText("50").length).toBeGreaterThan(0);
    // Verifications (7d) = last(100) - value 7 entries earlier (index 2 = 30) = 70.
    expect(screen.getAllByText("70").length).toBeGreaterThan(0);
  });

  it("QuickActions shows the three integrator cards with correct hrefs", () => {
    caps({});
    renderGraph();

    // Pre-existing card, unchanged: opens the create-action modal via query param.
    expect(
      screen.getByRole("link", { name: /create an action/i }),
    ).toHaveAttribute(
      "href",
      "/teams/team_1/apps/app_1/world-id-actions?createAction=true",
    );
    expect(
      screen.getByRole("link", { name: /add sign in with world id/i }),
    ).toHaveAttribute("href", "/teams/team_1/apps/app_1/sign-in-with-world-id");
    const docsLink = screen.getByRole("link", { name: /read the docs/i });
    expect(docsLink).toHaveAttribute("href", "https://docs.world.org/world-id");
    expect(docsLink).toHaveAttribute("target", "_blank");
    expect(docsLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noreferrer"),
    );
  });
});

describe("AppStatsGraph — mini-app", () => {
  it("shows all three tabs and today's mini-app QuickActions cards", () => {
    caps({ isMiniApp: true });
    renderGraph();

    expect(
      screen.getByRole("button", { name: "Verifications" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /get your app verified/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /add sign in with world id/i }),
    ).toBeNull();

    expect(useGetAccumulativeTransactions).toHaveBeenCalledWith(
      "app_1",
      expect.objectContaining({ skip: false }),
    );
  });
});

describe("AppStatsGraph — capabilities not loaded", () => {
  it("defaults to the integrator view (no mini-app surfaces)", () => {
    caps({ isMiniApp: true, loaded: false });
    renderGraph();

    expect(screen.queryByText("Payments")).toBeNull();
    expect(screen.queryByText("Notifications")).toBeNull();
    expect(screen.getAllByText("Total verifications").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByRole("link", { name: /get your app verified/i }),
    ).toBeNull();
  });
});
