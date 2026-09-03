/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import type { TotalsRow } from "@/lib/selfie-check-analytics";
import { TotalsOverview } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/TotalsOverview";
import { render, screen, within } from "@testing-library/react";
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
  p_face_capture_started_to_completed_completion: 0.909,
  p_face_capture_completed_to_proof_shared_completion: 0.469,
  ...overrides,
});

describe("TotalsOverview", () => {
  it("shows the unique-user and session totals without repeating proofs shared", () => {
    render(<TotalsOverview row={row()} />);

    const overview = screen.getByRole("region", {
      name: "Analytics overview",
    });
    expect(within(overview).getByText("Proof users")).toBeInTheDocument();
    expect(
      within(overview).getByText("Users who started Selfie Check"),
    ).toBeInTheDocument();
    expect(within(overview).getByText("1,234")).toBeInTheDocument();
    expect(within(overview).getByText("6,789")).toBeInTheDocument();
    expect(
      within(overview).queryByText("Proofs shared"),
    ).not.toBeInTheDocument();
    expect(within(overview).queryByText("2,345")).not.toBeInTheDocument();
  });

  it("shows an unavailable value when the proof-user total is null", () => {
    render(
      <TotalsOverview row={row({ n_users_shared_at_least_one_proof: null })} />,
    );

    const proofUsers = screen.getByText("Proof users").closest("article");
    expect(proofUsers).not.toBeNull();
    expect(within(proofUsers!).getByText("—")).toBeInTheDocument();
  });
});
