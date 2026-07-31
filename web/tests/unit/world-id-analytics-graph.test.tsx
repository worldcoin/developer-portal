/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { makeAnalyticsResponse } from "../contracts/world-id-analytics-endpoint";
import { WorldIdAnalyticsGraph } from "../contracts/world-id-analytics-ui";

// #region Mocks
const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;
// #endregion

// #region Test Data
const appId = "app_00000000000000000000000000000001";
const actionId = "action_v4_0000000000000000000000000001";

const responseBody = (input?: {
  period?: "last_7_days" | "all_time";
  appCount?: string;
  appPoints?: Array<{ date: string; count: string }>;
  actionCount?: string;
  actionPoints?: Array<{ date: string; count: string }>;
}) =>
  makeAnalyticsResponse({
    period: input?.period ?? "last_7_days",
    app: {
      count: input?.appCount ?? "3",
      series: input?.appPoints ?? [
        { date: "2026-07-28", count: "0" },
        { date: "2026-07-29", count: "1" },
        { date: "2026-07-30", count: "2" },
      ],
    },
    legacyActions: [],
    actions: [
      {
        id: actionId,
        count: input?.actionCount ?? "3",
        series: input?.actionPoints ?? [
          { date: "2026-07-28", count: "0" },
          { date: "2026-07-29", count: "1" },
          { date: "2026-07-30", count: "2" },
        ],
      },
    ],
  });

const ok = (body = responseBody()) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);

const deferredResponse = () => {
  let resolve!: (response: Response) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Response>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const renderAppGraph = () =>
  render(
    <WorldIdAnalyticsGraph
      appId={appId}
      environment="production"
      scope={{ type: "app" }}
    />,
  );

const renderActionGraph = () =>
  render(
    <WorldIdAnalyticsGraph
      appId={appId}
      environment="production"
      scope={{ type: "action", source: "v4", actionId }}
    />,
  );

const choosePeriod = async (label: "All Time" | "Last 7 Days") => {
  fireEvent.click(
    screen.getByRole("button", { name: "Unique Verifications period" }),
  );
  fireEvent.click(await screen.findByRole("option", { name: label }));
};

const requested = (callIndex = 0) => {
  const input = fetchMock.mock.calls[callIndex][0] as string | URL | Request;
  const raw =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.toString()
        : input;
  return new URL(raw, "http://localhost");
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-07-30T12:00:00.000Z"));
  fetchMock.mockImplementation(() => ok());
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

afterEach(() => {
  jest.useRealTimers();
});
// #endregion

// #region Initial period and display
describe("WorldIdAnalyticsGraph [initial period]", () => {
  it("renders a structural loading state before the first response", () => {
    const pending = deferredResponse();
    fetchMock.mockImplementationOnce(() => pending.promise);

    renderAppGraph();

    expect(
      screen.getByRole("status", {
        name: "Loading Unique Verifications",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/stale|delayed|watermark/i),
    ).not.toBeInTheDocument();
  });

  it("requests Last 7 Days by default and displays its point sum", async () => {
    renderAppGraph();

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unique Verifications period" }),
    ).toHaveTextContent("Last 7 Days");
    expect(requested().pathname).toBe(
      `/api/portal/apps/${appId}/world-id-analytics`,
    );
    expect(requested().searchParams.get("environment")).toBe("production");
    expect(requested().searchParams.get("period")).toBe("last_7_days");
    expect(requested().searchParams.has("action_ids")).toBe(false);
    expect(
      screen.getByRole("img", { name: "Unique Verifications" }),
    ).toBeInTheDocument();
  });

  it("selects a requested source-specific action block", async () => {
    fetchMock.mockImplementation(() =>
      ok(
        responseBody({
          appCount: "99",
          actionCount: "4",
          actionPoints: [
            { date: "2026-07-29", count: "1" },
            { date: "2026-07-30", count: "3" },
          ],
        }),
      ),
    );

    renderActionGraph();

    expect(await screen.findByText("4")).toBeInTheDocument();
    expect(screen.queryByText("99")).not.toBeInTheDocument();
    expect(requested().searchParams.get("action_ids")).toBe(actionId);
  });

  it("renders zero as a flat graph instead of hiding the chart", async () => {
    fetchMock.mockImplementation(() =>
      ok(
        responseBody({
          appCount: "0",
          appPoints: [
            { date: "2026-07-28", count: "0" },
            { date: "2026-07-29", count: "0" },
            { date: "2026-07-30", count: "0" },
          ],
        }),
      ),
    );

    renderAppGraph();

    expect(await screen.findByText("0")).toBeInTheDocument();
    const graph = screen.getByRole("img", {
      name: "Unique Verifications",
    });
    expect(graph).toBeVisible();
    expect(graph.querySelector("polyline")).toHaveAttribute(
      "data-flat-zero",
      "true",
    );
  });

  it("does not persist period selection in the page URL", async () => {
    window.history.replaceState({}, "", "/world-id-4-0?tab=actions");
    fetchMock
      .mockImplementationOnce(() => ok())
      .mockImplementationOnce(() =>
        ok(responseBody({ period: "all_time", appCount: "8" })),
      );
    renderAppGraph();
    await screen.findByText("3");

    await choosePeriod("All Time");
    expect(await screen.findByText("8")).toBeInTheDocument();

    expect(window.location.search).toBe("?tab=actions");
  });

  it("uses the portal error language for an initial hard failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    renderAppGraph();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load Unique Verifications",
    );
  });

  it("treats an initial non-2xx response as a hard failure", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: "unavailable" }),
    } as Response);

    renderAppGraph();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load Unique Verifications",
    );
    expect(
      screen.queryByRole("img", { name: "Unique Verifications" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region All Time lazy loading and cache
describe("WorldIdAnalyticsGraph [All Time loading]", () => {
  it("lazy-loads All Time once and reuses it for the mounted page", async () => {
    fetchMock
      .mockImplementationOnce(() => ok())
      .mockImplementationOnce(() =>
        ok(
          responseBody({
            period: "all_time",
            appCount: "10",
            appPoints: [
              { date: "2026-07-20", count: "4" },
              { date: "2026-07-30", count: "6" },
            ],
          }),
        ),
      );
    renderAppGraph();
    await screen.findByText("3");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await choosePeriod("All Time");
    expect(await screen.findByText("10")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requested(1).searchParams.get("period")).toBe("all_time");

    await choosePeriod("Last 7 Days");
    expect(screen.getByText("3")).toBeInTheDocument();
    await choosePeriod("All Time");
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps Last 7 Days visible while the first All Time request is pending", async () => {
    const pending = deferredResponse();
    fetchMock
      .mockImplementationOnce(() => ok())
      .mockImplementationOnce(() => pending.promise);
    renderAppGraph();
    await screen.findByText("3");

    await choosePeriod("All Time");

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Unique Verifications" }),
    ).toBeVisible();

    await act(async () => {
      pending.resolve(
        await ok(responseBody({ period: "all_time", appCount: "10" })),
      );
    });
    expect(await screen.findByText("10")).toBeInTheDocument();
  });

  it("keeps cached All Time points after an All Time refresh error", async () => {
    fetchMock
      .mockImplementationOnce(() => ok())
      .mockImplementationOnce(() =>
        ok(responseBody({ period: "all_time", appCount: "10" })),
      )
      .mockRejectedValueOnce(new Error("offline"));
    renderAppGraph();
    await screen.findByText("3");

    await choosePeriod("All Time");
    await screen.findByText("10");

    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Unique Verifications" }),
    ).toBeVisible();
  });
});
// #endregion

// #region Refresh behavior
describe("WorldIdAnalyticsGraph [refresh]", () => {
  it("refreshes every five minutes while visible and immediately on focus", async () => {
    renderAppGraph();
    await screen.findByText("3");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it("does not run the interval refresh while the page is hidden", async () => {
    renderAppGraph();
    await screen.findByText("3");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    await act(async () => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes immediately when a hidden page becomes visible again", async () => {
    renderAppGraph();
    await screen.findByText("3");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    await act(async () => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("keeps current points visible while a background refresh is pending", async () => {
    const pending = deferredResponse();
    fetchMock
      .mockImplementationOnce(() => ok())
      .mockImplementationOnce(() => pending.promise);
    renderAppGraph();
    await screen.findByText("3");

    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Unique Verifications" }),
    ).toBeVisible();

    await act(async () => {
      pending.resolve(await ok(responseBody({ appCount: "6" })));
    });
    expect(await screen.findByText("6")).toBeInTheDocument();
  });

  it("keeps the last successful graph after a refresh error", async () => {
    fetchMock
      .mockImplementationOnce(() => ok())
      .mockRejectedValueOnce(new Error("offline"));
    renderAppGraph();
    await screen.findByText("3");

    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Unique Verifications" }),
    ).toBeVisible();
    expect(
      screen.queryByText(/stale|delayed|watermark/i),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region Grouped UTC tooltips
describe("WorldIdAnalyticsGraph [grouped UTC tooltip]", () => {
  it("renders both UTC boundaries for the first and last grouped ranges", async () => {
    fetchMock
      .mockImplementationOnce(() => ok())
      .mockImplementationOnce(() =>
        ok(
          responseBody({
            period: "all_time",
            appCount: "36",
            appPoints: Array.from({ length: 8 }, (_, index) => ({
              date: `2026-01-${(index + 1).toString().padStart(2, "0")}`,
              count: (index + 1).toString(),
            })),
          }),
        ),
      );
    renderAppGraph();
    await screen.findByText("3");
    await choosePeriod("All Time");
    await screen.findByText("36");

    const graph = screen.getByRole("img", { name: "Unique Verifications" });
    Object.defineProperty(graph, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 700,
        top: 0,
        width: 700,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    fireEvent.mouseMove(graph, { clientX: 1, clientY: 50 });
    expect(
      await screen.findByText(/Jan 1, 2026.*Jan 2, 2026/),
    ).toBeInTheDocument();

    fireEvent.mouseMove(graph, { clientX: 699, clientY: 50 });
    expect(
      await screen.findByText(/Jan 8, 2026.*Jan 8, 2026/),
    ).toBeInTheDocument();
  });
});
// #endregion
