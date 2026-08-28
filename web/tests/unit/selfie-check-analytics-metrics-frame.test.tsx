/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

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

const totalsBody = JSON.stringify({
  appId,
  tablePrefix: "total/",
  row: {
    appId,
    n_users_started_selfie_check_flow: 4210,
    n_proofs: 1337,
    n_proof_users: 98,
    n_face_auth_started_sessions: 240,
    n_face_auth_completed_sessions: 168,
    p_face_auth_completion: 0.705559,
  },
  meta: { dataAsOf: "2026-08-26T21:00:00.000Z", isFallback: false },
});

const mockEndpoints = ({
  dailyStatus,
  totalsStatus = 200,
}: {
  dailyStatus: number;
  totalsStatus?: number;
}) => {
  fetchMock.mockImplementation((input: RequestInfo | URL) =>
    Promise.resolve(
      String(input).includes("table=daily")
        ? new Response(null, { status: dailyStatus })
        : new Response(totalsBody, { status: totalsStatus }),
    ),
  );
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MetricsFrame [per-view availability]", () => {
  it("describes missing data distinctly from an outage", async () => {
    mockEndpoints({ dailyStatus: 404 });

    render(<MetricsFrame appId={appId} />);

    expect(
      await screen.findByText(
        "Analytics data is not available for this view yet.",
      ),
    ).toBeInTheDocument();
  });

  it("describes an outage as temporary without removing navigation", async () => {
    mockEndpoints({ dailyStatus: 503 });

    render(<MetricsFrame appId={appId} />);

    expect(
      await screen.findByText(
        "Analytics are temporarily unavailable. Try again shortly.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Total metrics" }),
    ).toBeInTheDocument();
  });

  it("keeps totals working while daily is unavailable", async () => {
    mockEndpoints({ dailyStatus: 503 });

    render(<MetricsFrame appId={appId} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Total metrics" }),
    );

    expect(await screen.findByText("1,337")).toBeInTheDocument();
    expect(screen.getByText("70.56%")).toBeInTheDocument();
  });
});
