/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/DailyMetricChart",
  () => ({
    DailyMetricChart: (props: { title: string; rows: readonly unknown[] }) => (
      <div data-testid="daily-chart" data-row-count={props.rows.length}>
        {props.title}
      </div>
    ),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/TotalsFunnel",
  () => ({
    TotalsFunnel: () => <div data-testid="totals-funnel" />,
  }),
);

import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";

const appId = "app_0123456789abcdef0123456789abcdef";

beforeEach(() => {
  global.fetch = jest.fn();
});

it("renders deterministic preview data without making analytics requests", async () => {
  render(<MetricsFrame appId={appId} mock />);

  await waitFor(() => expect(screen.getByText("8,342")).toBeInTheDocument());
  expect(screen.getByText("18,420")).toBeInTheDocument();
  expect(screen.getByText("12,670")).toBeInTheDocument();
  const charts = screen.getAllByTestId("daily-chart");
  expect(charts).toHaveLength(2);
  expect(charts[0]).toHaveAttribute("data-row-count", "28");
  expect(global.fetch).not.toHaveBeenCalled();
});
