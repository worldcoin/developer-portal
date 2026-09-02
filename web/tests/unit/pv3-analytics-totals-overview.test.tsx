/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import type { TotalsRow } from "@/lib/selfie-check-analytics";
import { TotalsOverview } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/TotalsOverview";
import { render, screen, within } from "@testing-library/react";
import React from "react";

const row = (overrides: Partial<TotalsRow> = {}): TotalsRow => ({
  appId: "app_0123456789abcdef0123456789abcdef",
  n_users_started_selfie_check_flow: 6_789,
  n_proofs: 2_345,
  n_proof_users: 1_234,
  n_face_auth_started_sessions: 6_000,
  n_face_auth_completed_sessions: 5_000,
  p_face_auth_completion: 0.83,
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
    render(<TotalsOverview row={row({ n_proof_users: null })} />);

    const proofUsers = screen.getByText("Proof users").closest("article");
    expect(proofUsers).not.toBeNull();
    expect(within(proofUsers!).getByText("—")).toBeInTheDocument();
  });
});
