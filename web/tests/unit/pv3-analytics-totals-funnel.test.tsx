/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import type { TotalsRow } from "@/lib/selfie-check-analytics";
import { TotalsFunnel } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/TotalsFunnel";
import { render, screen } from "@testing-library/react";
import React from "react";

const row = (overrides: Partial<TotalsRow> = {}): TotalsRow => ({
  appId: "app_0123456789abcdef0123456789abcdef",
  n_users_started_at_least_one_selfie_check_flow: 6_789,
  n_users_shared_at_least_one_proof: 1_234,
  n_selfie_check_started_sessions: 6_000,
  n_face_capture_started_sessions: 5_500,
  n_face_capture_completed_sessions: 5_000,
  n_proof_shared_sessions: 2_345,
  p_selfie_check_to_face_capture_started_completion: 0.917,
  p_face_capture_started_to_completed_completion: 0.834,
  p_face_capture_completed_to_proof_shared_completion: 0.469,
  ...overrides,
});

describe("TotalsFunnel", () => {
  it("shows all four session stages as a percentage of the starting count", () => {
    render(<TotalsFunnel row={row()} />);

    expect(screen.getByText("Selfie Check started")).toBeInTheDocument();
    expect(screen.getByText("6,000 sessions")).toBeInTheDocument();
    expect(screen.getByText("Face capture started")).toBeInTheDocument();
    expect(screen.getByText("5,500 sessions")).toBeInTheDocument();
    expect(screen.getByText("Face capture completed")).toBeInTheDocument();
    expect(screen.getByText("5,000 sessions")).toBeInTheDocument();
    expect(screen.getByText("Proof shared")).toBeInTheDocument();
    expect(screen.getByText("2,345 sessions")).toBeInTheDocument();

    expect(screen.getByText("100.0%")).toBeInTheDocument();
    expect(screen.getByText("91.7%")).toBeInTheDocument();
    expect(screen.getByText("83.3%")).toBeInTheDocument();
    expect(screen.getByText("39.1%")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows an unavailable percentage when the starting count is zero", () => {
    render(
      <TotalsFunnel
        row={{
          ...row(),
          n_selfie_check_started_sessions: 0,
        }}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(4);
  });
});
