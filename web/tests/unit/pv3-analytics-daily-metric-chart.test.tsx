/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";

jest.mock("recharts", () => ({
  Bar: (props: { name: string; stackId?: string }) => (
    <div
      data-testid="bar"
      data-name={props.name}
      data-stack-id={props.stackId}
    />
  ),
  BarChart: (props: { children: ReactNode }) => <div>{props.children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: (props: { children: ReactNode }) => (
    <div>{props.children}</div>
  ),
  Tooltip: () => null,
  XAxis: () => null,
}));

import { DailyMetricChart } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame/DailyMetricChart";
import type { DailyRow } from "@/lib/selfie-check-analytics";

const appId = "app_0123456789abcdef0123456789abcdef";

const row = (osName: string, proofs: number): DailyRow => ({
  appId,
  day: "2026-08-31",
  os_name: osName,
  n_users_started_selfie_check_flow: 10,
  n_proofs: proofs,
  n_proof_users: 4,
  cumulative_n_proofs: 30,
  cumulative_n_proof_users: 20,
  n_face_auth_started_sessions: 10,
  n_face_auth_completed_sessions: 8,
  p_face_auth_completion: 0.8,
});

it("stacks each day's OS series into one bar", () => {
  render(
    <DailyMetricChart
      title="# of Proofs Shared"
      rows={[row("iOS", 6), row("Android", 4)]}
      metric="n_proofs"
      kind="count"
    />,
  );

  const bars = screen.getAllByTestId("bar");
  expect(bars).toHaveLength(2);
  expect(bars.map((bar) => bar.dataset.name)).toEqual(["Android", "iOS"]);
  expect(bars.every((bar) => bar.dataset.stackId === "os")).toBe(true);
});
