/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUseGetMetrics = jest.fn();
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/use-get-metrics",
  () => ({
    useGetMetrics: (...args: unknown[]) => mockUseGetMetrics(...args),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/AppStatsGraph/StatsRow/use-cached-metrics",
  () => ({
    useCachedMetrics: () => ({
      impressionsChange: null,
      sessionsChange: null,
      usersChange: null,
      newUsersChange: null,
    }),
  }),
);

const mockUnifiedChart = jest.fn();
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/AppStatsGraph/UnifiedChart",
  () => ({
    UnifiedChart: (props: unknown) => {
      mockUnifiedChart(props);
      return <div data-testid="unified-chart" />;
    },
  }),
);

jest.mock("@/components/Select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectButton: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  SelectOption: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectOptions: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("react-loading-skeleton", () => ({
  __esModule: true,
  default: () => <span data-testid="metric-skeleton" />,
}));

import { DashboardWrapper } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page/DashboardWrapper";

beforeEach(() => jest.clearAllMocks());

it("renders masks without waiting for metrics", () => {
  mockUseGetMetrics.mockReturnValue({
    metrics: null,
    loading: true,
    error: false,
  });

  render(<DashboardWrapper appId="app_1" />);

  expect(screen.getAllByTestId("metric-skeleton")).toHaveLength(4);
  expect(screen.getByTestId("unified-chart")).toBeInTheDocument();
  expect(mockUnifiedChart).toHaveBeenCalledWith(
    expect.objectContaining({ metricsLoading: true }),
  );
});

it("keeps independent charts mounted when metrics fail", () => {
  mockUseGetMetrics.mockReturnValue({
    metrics: null,
    loading: false,
    error: true,
  });

  render(<DashboardWrapper appId="app_1" />);

  expect(
    screen.getByText(
      "Metrics are temporarily unavailable. Please refresh to try again.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByTestId("unified-chart")).toBeInTheDocument();
});
