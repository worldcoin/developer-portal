/** @jest-environment jsdom */
import "../fixtures/browser-text-encoding";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";
import type { DailyRow, TotalsRow } from "@/lib/selfie-check-analytics";
import { appId } from "../fixtures/selfie-check-analytics";
import posthog from "posthog-js";
import { StrictMode } from "react";

// #region I/O mocks
jest.mock("@auth0/nextjs-auth0", () => ({ useUser: jest.fn() }));
jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId: "team_0123456789abcdef0123456789abcdef" }),
}));
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn(), has_opted_out_capturing: jest.fn() },
}));
const fetchMock = jest.fn();
const originalFetch = global.fetch;
const originalResizeObserver = global.ResizeObserver;
const originalPostHogDisabled = process.env.NEXT_PUBLIC_POSTHOG_DISABLED;
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
        url.includes("daily")
          ? { rows: dailyRows, snapshotMetadata: { isFallback: dailyFallback } }
          : { row: totals, snapshotMetadata: { isFallback: totalFallback } },
      ),
    ),
  );
};
const dailyCharts = () =>
  screen.getAllByRole("region", { name: /by day and OS/ });
const expectLegends = (names: string[]) => {
  expect(dailyCharts()).toHaveLength(4);
  for (const chart of dailyCharts()) {
    expect(
      within(chart)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(names);
  }
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.NEXT_PUBLIC_POSTHOG_DISABLED;
  jest.mocked(posthog.capture).mockReset();
  jest
    .mocked(posthog.has_opted_out_capturing)
    .mockReset()
    .mockReturnValue(false);
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
  if (originalPostHogDisabled === undefined)
    delete process.env.NEXT_PUBLIC_POSTHOG_DISABLED;
  else process.env.NEXT_PUBLIC_POSTHOG_DISABLED = originalPostHogDisabled;
  global.fetch = originalFetch;
  global.ResizeObserver = originalResizeObserver;
  jest.restoreAllMocks();
});

// #region Lifetime and daily analytics
it("renders lifetime metrics by default and all daily charts in the daily tab", async () => {
  render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  expect(screen.getByText("10")).toBeInTheDocument();
  expect(screen.getByText("6")).toBeInTheDocument();
  expect(screen.getByText("20 sessions")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "All time" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(
    screen.queryByRole("region", { name: /by day and OS/ }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
  expectLegends(["Android", "iOS"]);
  expect(
    within(screen.getByRole("combobox", { name: "Operating System" }))
      .getAllByRole("option")
      .map((option) => option.textContent),
  ).toEqual(["All", "Android", "iOS", "Unknown"]);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

it("filters every daily chart without changing the lifetime section", async () => {
  render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
  expectLegends(["Android", "iOS"]);

  fireEvent.change(screen.getByRole("combobox", { name: "Timeframe" }), {
    target: { value: "all" },
  });
  expectLegends(["Android", "iOS", "Unknown"]);
  fireEvent.change(screen.getByRole("combobox", { name: "Operating System" }), {
    target: { value: "iOS" },
  });
  expectLegends(["iOS"]);
  expect(screen.getByRole("combobox", { name: "Timeframe" })).toHaveValue(
    "all",
  );
  expect(
    screen.getByRole("combobox", { name: "Operating System" }),
  ).toHaveValue("iOS");

  fireEvent.click(screen.getByRole("tab", { name: "All time" }));
  expect(screen.getByText("20 sessions")).toBeInTheDocument();
});
// #endregion

// #region Analytics view selection events
const selectionEvents = () => jest.mocked(posthog.capture).mock.calls;
const selectTab = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name }));
  });
};
const expectedSelection = (
  view: "totals" | "daily",
  source: "page_entry" | "tab_switch",
  selectedAppId = appId,
) => [
  "selfie_check_analytics_view_selected",
  {
    appId: selectedAppId,
    teamId: "team_0123456789abcdef0123456789abcdef",
    view,
    source,
  },
];

it("captures entry once through Strict Mode, fetch completion, and rerenders", async () => {
  const content = (
    <StrictMode>
      <MetricsFrame appId={appId} />
    </StrictMode>
  );
  const { rerender } = render(content);
  expect(selectionEvents()).toEqual([
    expectedSelection("totals", "page_entry"),
  ]);
  await screen.findByRole("region", { name: "Analytics overview" });
  rerender(content);
  fireEvent.click(screen.getByRole("tab", { name: "All time" }));
  expect(selectionEvents()).toEqual([
    expectedSelection("totals", "page_entry"),
  ]);
});

it("captures both directions and revisits, but not filters or the active tab", async () => {
  const { rerender } = render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  await selectTab("Daily trends");
  await selectTab("Daily trends");
  fireEvent.change(screen.getByRole("combobox", { name: "Timeframe" }), {
    target: { value: "7" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Operating System" }), {
    target: { value: "iOS" },
  });
  rerender(<MetricsFrame appId={appId} initialIsFallback />);
  await selectTab("All time");
  await selectTab("Daily trends");
  expect(selectionEvents()).toEqual([
    expectedSelection("totals", "page_entry"),
    expectedSelection("daily", "tab_switch"),
    expectedSelection("totals", "tab_switch"),
    expectedSelection("daily", "tab_switch"),
  ]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("captures a fresh entry after leaving and returning to the same app", async () => {
  const { unmount } = render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  unmount();
  render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  expect(selectionEvents()).toEqual([
    expectedSelection("totals", "page_entry"),
    expectedSelection("totals", "page_entry"),
  ]);
});

it("captures keyboard navigation in both directions", async () => {
  render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  const totalsTab = screen.getByRole("tab", { name: "All time" });
  act(() => totalsTab.focus());
  fireEvent.keyDown(totalsTab, { key: "ArrowRight" });
  const dailyTab = screen.getByRole("tab", { name: "Daily trends" });
  expect(dailyTab).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(dailyTab, { key: "ArrowLeft" });
  expect(totalsTab).toHaveAttribute("aria-selected", "true");
  expect(selectionEvents()).toEqual([
    expectedSelection("totals", "page_entry"),
    expectedSelection("daily", "tab_switch"),
    expectedSelection("totals", "tab_switch"),
  ]);
});

it("captures a new app entry using the actual selected tab and current app ID", async () => {
  const { rerender } = render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
  const nextAppId = "app_fedcba9876543210fedcba9876543210";
  fetchMock.mockResolvedValue(response({}, 503));
  await act(async () => rerender(<MetricsFrame appId={nextAppId} />));
  fireEvent.click(screen.getByRole("tab", { name: "All time" }));
  expect(selectionEvents()).toEqual([
    expectedSelection("totals", "page_entry"),
    expectedSelection("daily", "tab_switch"),
    expectedSelection("daily", "page_entry", nextAppId),
    expectedSelection("totals", "tab_switch", nextAppId),
  ]);
});

it.each(["environment", "opt-out"])(
  "does not capture entry or switches when disabled by %s",
  async (reason) => {
    if (reason === "environment")
      process.env.NEXT_PUBLIC_POSTHOG_DISABLED = "true";
    else jest.mocked(posthog.has_opted_out_capturing).mockReturnValue(true);
    render(<MetricsFrame appId={appId} />);
    await screen.findByRole("region", { name: "Analytics overview" });
    fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
    expect(screen.getByRole("tab", { name: "Daily trends" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(posthog.capture).not.toHaveBeenCalled();
  },
);

it("keeps navigation working when PostHog throws", async () => {
  jest.mocked(posthog.capture).mockImplementation(() => {
    throw new Error("PostHog unavailable");
  });
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  render(<MetricsFrame appId={appId} />);
  await screen.findByRole("region", { name: "Analytics overview" });
  fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
  expect(screen.getByRole("tab", { name: "Daily trends" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(warn).toHaveBeenCalledTimes(2);
});
// #endregion

// #region Stale metadata and failure behavior
it.each(["total", "daily"])(
  "shows a stale-data notice for a %s fallback in both tabs",
  async (table) => {
    serve(table === "total", table === "daily");
    render(<MetricsFrame appId={appId} />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "showing the last verified data",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
    expect(screen.getByRole("status")).toHaveTextContent(
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
      response(url.includes("daily") ? { rows: [] } : { row: totals }),
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
        url.includes("daily")
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
    fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
    expectLegends(["Android", "iOS"]);
  },
);

it("bounds stalled fetches and reports timeouts in each tab", async () => {
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
    fireEvent.click(screen.getByRole("tab", { name: "Daily trends" }));
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
