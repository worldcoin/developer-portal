/** @jest-environment jsdom */
import "../fixtures/browser-text-encoding";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";
import type { DailyRow, TotalsRow } from "@/lib/selfie-check-analytics";
import { appId } from "../fixtures/selfie-check-analytics";

// #region I/O mocks
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: null, isLoading: false }),
}));
const fetchMock = jest.fn();
const originalFetch = global.fetch;
const originalResizeObserver = global.ResizeObserver;
// #endregion

// #region Test Data
const dailyRows: DailyRow[] = [
  { day: "2026-08-01", os_name: "Unknown" },
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
const response = (payload: unknown, status = 200) => ({
  ok: status === 200,
  status,
  json: async () => payload,
});
const serve = (totalFallback = false, dailyFallback = false) => {
  fetchMock.mockImplementation((url: string) =>
    Promise.resolve(
      response(
        url.includes("table=")
          ? { rows: dailyRows, snapshotMetadata: { isFallback: dailyFallback } }
          : { row: totals, snapshotMetadata: { isFallback: totalFallback } },
      ),
    ),
  );
};
const dailyCharts = () =>
  screen.getAllByRole("region", { name: /by (?:day|week|month) and OS/ });
const expectLegends = (names: string[]) => {
  expect(dailyCharts()).toHaveLength(4);
  for (const chart of dailyCharts()) {
    expect(
      within(chart)
        .getAllByRole("listitem")
        .map((item) => item.textContent?.split(" ·")[0]),
    ).toEqual(names);
  }
};
const chooseFilterOption = (filterName: string, optionName: string) => {
  fireEvent.click(screen.getByRole("combobox", { name: filterName }));
  fireEvent.click(screen.getByRole("option", { name: optionName }));
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock;
  // jsdom has no layout engine or ResizeObserver.
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 640,
    bottom: 280,
    width: 640,
    height: 280,
    toJSON: () => ({}),
  });
  serve();
});
afterEach(() => {
  global.fetch = originalFetch;
  global.ResizeObserver = originalResizeObserver;
  jest.restoreAllMocks();
});

// #region Selfie Check analytics
it("renders API-backed lifetime and trend sections without view tabs", async () => {
  render(<MetricsFrame appId={appId} />);
  const overview = await screen.findByRole("region", {
    name: "Analytics overview",
  });
  expect(within(overview).getByText("10")).toBeInTheDocument();
  expect(within(overview).getByText("6")).toBeInTheDocument();
  expect(screen.getByText("20 sessions")).toBeInTheDocument();
  expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "All time" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Trends" })).toBeInTheDocument();
  expectLegends(["Android", "iOS"]);
  expect(
    screen.getByRole("combobox", { name: "Time interval" }),
  ).toHaveAttribute("data-value", "daily");
  fireEvent.click(screen.getByRole("combobox", { name: "Operating System" }));
  expect(
    screen.getAllByRole("option").map((option) => option.textContent),
  ).toEqual(["All", "Android", "iOS"]);
  fireEvent.click(screen.getByRole("option", { name: "All" }));
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

it("fetches each interval's table once and resets the range to its unit", async () => {
  render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  const requestedTables = () =>
    fetchMock.mock.calls
      .map(([url]) => String(url).split("?")[1] ?? "totals")
      .sort();
  expect(requestedTables()).toEqual(["table=daily", "totals"]);
  expect(screen.getByRole("combobox", { name: "Timeframe" })).toHaveAttribute(
    "data-value",
    "14",
  );

  chooseFilterOption("Time interval", "Weekly");
  await screen.findAllByRole("region", { name: /by week and OS/ });
  expect(requestedTables()).toEqual(["table=daily", "table=weekly", "totals"]);
  expect(screen.getByRole("combobox", { name: "Timeframe" })).toHaveAttribute(
    "data-value",
    "8",
  );
  fireEvent.click(screen.getByRole("combobox", { name: "Timeframe" }));
  const rangeOptions = within(
    screen.getByRole("listbox", { name: "Timeframe" }),
  );
  expect(
    rangeOptions.getAllByRole("option").map((option) => option.textContent),
  ).toEqual(["Past 4 weeks", "Past 8 weeks", "Past 12 weeks", "All time"]);
  fireEvent.click(rangeOptions.getByRole("option", { name: "All time" }));

  chooseFilterOption("Time interval", "Daily");
  await screen.findAllByRole("region", { name: /by day and OS/ });
  expect(screen.getByRole("combobox", { name: "Timeframe" })).toHaveAttribute(
    "data-value",
    "14",
  );
  // Daily came back from the per-interval cache.
  expect(requestedTables()).toEqual(["table=daily", "table=weekly", "totals"]);
});

it("filters every daily chart without changing the lifetime section", async () => {
  render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  expectLegends(["Android", "iOS"]);

  chooseFilterOption("Timeframe", "All time");
  expectLegends(["Android", "iOS"]);
  chooseFilterOption("Operating System", "iOS");
  expectLegends(["iOS"]);
  expect(screen.getByRole("combobox", { name: "Timeframe" })).toHaveAttribute(
    "data-value",
    "all",
  );
  expect(
    screen.getByRole("combobox", { name: "Operating System" }),
  ).toHaveAttribute("data-value", "iOS");

  expect(screen.getByText("20 sessions")).toBeInTheDocument();
});

// #endregion

// #region Stale metadata and failure behavior
it.each(["total", "daily"])(
  "shows a stale-data notice for a %s fallback",
  async (table) => {
    serve(table === "total", table === "daily");
    render(<MetricsFrame appId={appId} />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "showing the last verified data",
    );
  },
);

it("shows server fallback immediately, then clears it after a fresh response", async () => {
  render(<MetricsFrame appId={appId} initialIsFallback />);
  expect(screen.getByRole("status")).toBeInTheDocument();
  await screen.findByRole("region", { name: "Analytics overview" });
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("keeps development fixture responses without metadata renderable", async () => {
  fetchMock.mockImplementation((url: string) =>
    Promise.resolve(
      response(url.includes("table=") ? { rows: [] } : { row: totals }),
    ),
  );
  render(<MetricsFrame appId={appId} />);
  expect(
    await screen.findByRole("region", { name: "Analytics overview" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it.each([404, 503])(
  "distinguishes a totals %s from usable daily data",
  async (status) => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes("table=")
          ? response({ rows: dailyRows })
          : response({}, status),
      ),
    );
    render(<MetricsFrame appId={appId} />);
    expect(
      await screen.findByText(
        status === 404
          ? "Analytics not found."
          : "Analytics are temporarily unavailable. Try again shortly.",
      ),
    ).toBeInTheDocument();
    expectLegends(["Android", "iOS"]);
  },
);

it("bounds stalled fetches and reports timeouts in both sections", async () => {
  jest.useFakeTimers();
  try {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new Error("Aborted")),
          );
        }),
    );
    render(<MetricsFrame appId={appId} />);
    await act(async () => {
      jest.advanceTimersByTime(8_000);
    });
    expect(
      within(
        screen.getByRole("region", { name: "Selfie Check funnel" }),
      ).getByText("Analytics request timed out."),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Daily Selfie Check charts" }),
      ).getByText("Analytics request timed out."),
    ).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});
// #endregion
