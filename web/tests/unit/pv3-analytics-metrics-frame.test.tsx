/** @jest-environment jsdom */
import "../fixtures/browser-text-encoding";
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";
import { parseTotalsTable } from "@/api/helpers/selfie-check-analytics/format-tables";
import { appId, totalsCsv } from "../fixtures/selfie-check-analytics";

// #region I/O mocks
jest.mock("@auth0/nextjs-auth0", () => ({ useUser: jest.fn() }));
const fetchMock = jest.fn();
const originalFetch = global.fetch;
// #endregion

// #region Test Data
const row = parseTotalsTable(totalsCsv()).records.get(appId);
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
          ? { rows: [], meta: { isFallback: dailyFallback } }
          : { row, meta: { isFallback: totalFallback } },
      ),
    ),
  );
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock;
  serve();
});
afterEach(() => {
  global.fetch = originalFetch;
});

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
    Promise.resolve(response(url.includes("daily") ? { rows: [] } : { row })),
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
        url.includes("daily") ? response({ rows: [] }) : response({}, status),
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
  },
);

it("bounds stalled fetches and reports timeouts", async () => {
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
    expect(screen.getAllByText("Analytics request timed out.")).toHaveLength(2);
  } finally {
    jest.useRealTimers();
  }
});
// #endregion
