/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";

// #region Mocks
const fetchMock = jest.fn();
global.fetch = fetchMock;

// recharts measures its container with ResizeObserver, which jsdom lacks.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";

const dailyRow = (overrides: Record<string, unknown> = {}) => ({
  appId,
  day: "2026-08-25",
  os_name: "iOS",
  n_users_started_selfie_check_flow: 10,
  n_proofs: 2,
  n_proof_users: 8,
  cumulative_n_proofs: 27,
  cumulative_n_proof_users: 20,
  n_face_auth_started_sessions: 10,
  n_face_auth_completed_sessions: 8,
  p_face_auth_completion: 0.8,
  ...overrides,
});

const totalsRow = (overrides: Record<string, unknown> = {}) => ({
  appId,
  n_users_started_selfie_check_flow: 4210,
  n_proofs: 84,
  n_proof_users: 70,
  n_face_auth_started_sessions: 240,
  n_face_auth_completed_sessions: 168,
  p_face_auth_completion: 0.7,
  ...overrides,
});

const meta = { dataAsOf: "2026-08-26T21:00:00.000Z", isFallback: false };

const mockEndpoints = ({
  dailyRows = [
    dailyRow(),
    dailyRow({ day: "2026-08-26", os_name: "Android", n_proofs: 4 }),
  ],
  dailyStatus = 200,
  totals = totalsRow(),
  totalsStatus = 200,
}: {
  dailyRows?: unknown[];
  dailyStatus?: number;
  totals?: Record<string, unknown>;
  totalsStatus?: number;
} = {}) => {
  fetchMock.mockImplementation((input: RequestInfo | URL) =>
    Promise.resolve(
      String(input).includes("table=daily")
        ? new Response(
            JSON.stringify({
              appId,
              tablePrefix: "daily/",
              rows: dailyRows,
              meta,
            }),
            { status: dailyStatus },
          )
        : new Response(
            JSON.stringify({ appId, tablePrefix: "total/", row: totals, meta }),
            { status: totalsStatus },
          ),
    ),
  );
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MetricsFrame [funnel + daily charts]", () => {
  it("renders the totals funnel above the two daily charts", async () => {
    mockEndpoints();

    render(<MetricsFrame appId={appId} />);

    await screen.findByText("Face auth started");
    const funnel = screen.getByLabelText("Selfie check funnel");
    expect(funnel).toHaveTextContent("240");
    expect(funnel).toHaveTextContent("Face auth completed");
    expect(funnel).toHaveTextContent("168");
    expect(funnel).toHaveTextContent("70.0% of previous");
    expect(funnel).toHaveTextContent("Proofs shared");
    expect(funnel).toHaveTextContent("84");
    expect(funnel).toHaveTextContent("50.0% of previous");

    expect(
      await screen.findByText("Users started selfie check"),
    ).toBeInTheDocument();
    expect(screen.getByText("Proofs")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a dash for a null funnel stage instead of a fake zero", async () => {
    mockEndpoints({
      totals: totalsRow({ n_face_auth_completed_sessions: null }),
    });

    render(<MetricsFrame appId={appId} />);

    await screen.findByText("Face auth started");
    expect(screen.getByLabelText("Selfie check funnel")).toHaveTextContent("—");
  });

  it("keeps the funnel visible while daily data is unavailable", async () => {
    mockEndpoints({ dailyStatus: 503 });

    render(<MetricsFrame appId={appId} />);

    expect(await screen.findByText("Face auth started")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Analytics are temporarily unavailable. Try again shortly.",
      ),
    ).toBeInTheDocument();
  });

  it("describes missing daily data distinctly from an outage", async () => {
    mockEndpoints({ dailyStatus: 404 });

    render(<MetricsFrame appId={appId} />);

    expect(
      await screen.findByText(
        "Analytics data is not available for this view yet.",
      ),
    ).toBeInTheDocument();
  });

  it("rejects a malformed daily payload instead of charting it", async () => {
    mockEndpoints({
      dailyRows: [dailyRow({ appId: "app_ffffffffffffffffffffffffffffffff" })],
    });

    render(<MetricsFrame appId={appId} />);

    expect(
      await screen.findByText("Daily analytics response was malformed."),
    ).toBeInTheDocument();
  });
});
