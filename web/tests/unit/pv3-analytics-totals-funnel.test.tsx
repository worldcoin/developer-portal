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
  it("shows the supplied completion rate in the completed funnel stage", () => {
    render(<TotalsFunnel row={row()} />);

    expect(screen.getByText("Face Capture started")).toBeInTheDocument();
    expect(screen.getByText("5,500")).toBeInTheDocument();
    expect(screen.getByText("Face Capture completed")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getByText("Proofs shared")).toBeInTheDocument();
    expect(screen.getByText("2,345")).toBeInTheDocument();
    const completion = screen.getByRole("progressbar", {
      name: "Face capture completion",
    });
    expect(completion).toHaveAttribute("aria-valuenow", "83.4");
    expect(completion).toHaveAttribute(
      "aria-valuetext",
      "83.4% of face capture sessions completed",
    );
    expect(screen.getByText("83.4%")).toBeInTheDocument();
    expect(screen.getByText("Completion rate")).toBeInTheDocument();
  });

  it("shows an unavailable completion ring when the rate is null", () => {
    render(
      <TotalsFunnel
        row={{
          ...row(),
          p_face_capture_started_to_completed_completion: null,
        }}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Face capture completion unavailable",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("progressbar", { name: "Face capture completion" }),
    ).not.toBeInTheDocument();
  });
});
