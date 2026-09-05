/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import type { DailyRow, TotalsRow } from "@/lib/selfie-check-analytics";

// #region Mocks
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

// #endregion

import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";

const dailyRows: DailyRow[] = [
  { day: "2026-08-01", os_name: "iOS" },
  { day: "2026-08-17", os_name: "Android" },
  { day: "2026-08-30", os_name: "iOS" },
].map((row) => ({
  appId,
  n_users_started_selfie_check_flow: 10,
  n_users_shared_a_proof: 6,
  cumulative_n_users_shared_a_proof: 12,
  p_face_capture_completion: 0.75,
  ...row,
}));
const totals: TotalsRow = {
  appId,
  n_users_started_at_least_one_selfie_check_flow: 10,
  n_users_shared_at_least_one_proof: 6,
  n_selfie_check_started_sessions: 20,
  n_face_capture_started_sessions: 16,
  n_face_capture_completed_sessions: 12,
  n_proof_shared_sessions: 8,
  p_selfie_check_to_face_capture_started_completion: 0.8,
  p_face_capture_started_to_completed_completion: 0.75,
  p_face_capture_completed_to_proof_shared_completion: 2 / 3,
};
// #endregion

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn().mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url.endsWith("?table=daily") ? { rows: dailyRows } : { row: totals },
  }));
});
afterEach(() => {
  global.fetch = originalFetch;
});

// #region View navigation and daily filters

it("separates totals from daily metrics and switches the visible chart", async () => {
  render(<MetricsFrame appId={appId} />);

  await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());
  expect(screen.getByText("6")).toBeInTheDocument();
  expect(screen.getByText("20 sessions")).toBeInTheDocument();
  expect(screen.queryByTestId("daily-chart")).not.toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
  });
  expect(screen.queryByText("20 sessions")).not.toBeInTheDocument();
  expect(screen.getAllByTestId("daily-chart")).toHaveLength(1);
  expect(screen.getByTestId("daily-chart")).toHaveTextContent(
    "Users starting Selfie Check, by day",
  );

  fireEvent.click(screen.getByRole("button", { name: "Completion Rate" }));
  expect(screen.getByTestId("daily-chart")).toHaveTextContent(
    "Average face capture completion rate, by day",
  );

  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name: "All time" }));
  });
  expect(screen.getByText("20 sessions")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

it("shows all available history and preserves daily selections across views", async () => {
  render(<MetricsFrame appId={appId} />);
  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
  });
  await screen.findByTestId("daily-chart");
  const initialRowCount = Number(
    screen.getByTestId("daily-chart").getAttribute("data-row-count"),
  );
  expect(initialRowCount).toBe(2);
  fireEvent.change(screen.getByRole("combobox", { name: "Timeframe" }), {
    target: { value: "all" },
  });
  expect(
    Number(screen.getByTestId("daily-chart").getAttribute("data-row-count")),
  ).toBe(3);

  fireEvent.change(screen.getByRole("combobox", { name: "Operating system" }), {
    target: { value: "iOS" },
  });
  const filteredRowCount = screen
    .getByTestId("daily-chart")
    .getAttribute("data-row-count");
  fireEvent.click(
    screen.getByRole("button", { name: "Cumulative users Shared 1+ proof" }),
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name: "All time" }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
  });

  expect(screen.getByRole("combobox", { name: "Timeframe" })).toHaveValue(
    "all",
  );
  expect(
    screen.getByRole("combobox", { name: "Operating system" }),
  ).toHaveValue("iOS");
  expect(
    screen.getByRole("button", { name: "Cumulative users Shared 1+ proof" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByTestId("daily-chart")).toHaveAttribute(
    "data-row-count",
    filteredRowCount,
  );
});

// #endregion
