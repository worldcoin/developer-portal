/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";

jest.mock("recharts", () => ({
  Bar: (props: { fill: string; name: string; stackId?: string }) => (
    <div
      data-testid="bar"
      data-fill={props.fill}
      data-name={props.name}
      data-stack-id={props.stackId}
    />
  ),
  CartesianGrid: () => null,
  ComposedChart: (props: { children: ReactNode }) => (
    <div>{props.children}</div>
  ),
  Line: (props: { name: string; stroke: string; type: string }) => (
    <div
      data-testid="line"
      data-name={props.name}
      data-stroke={props.stroke}
      data-type={props.type}
    />
  ),
  ResponsiveContainer: (props: { children: ReactNode }) => (
    <div>{props.children}</div>
  ),
  Tooltip: () => null,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: (props: {
    allowDecimals: boolean;
    domain?: [number, number];
    tickFormatter?: (value: number) => string;
  }) => (
    <div
      data-testid="y-axis"
      data-allow-decimals={props.allowDecimals}
      data-domain={props.domain?.join(",")}
      data-midpoint-label={props.tickFormatter?.(0.5)}
    />
  ),
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

const rows = [row("iOS", 6), row("Android", 4)];

describe("DailyMetricChart", () => {
  it("stacks each day's OS series for count metrics", () => {
    render(
      <DailyMetricChart
        title="Selfie Check proof users"
        rows={rows}
        metric="n_proof_users"
        kind="count"
      />,
    );

    const bars = screen.getAllByTestId("bar");
    expect(bars).toHaveLength(2);
    expect(bars.map((bar) => bar.dataset.name)).toEqual(["Android", "iOS"]);
    expect(bars.map((bar) => bar.dataset.fill)).toEqual(["#b88700", "#007aff"]);
    expect(bars.every((bar) => bar.dataset.stackId === "os")).toBe(true);
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Users (#)")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-allow-decimals",
      "false",
    );
  });

  it("draws completion rates as straight OS lines on a zero-to-100-percent axis", () => {
    render(
      <DailyMetricChart
        title="Face Capture Completion Rate"
        rows={rows}
        metric="p_face_auth_completion"
        kind="rate"
      />,
    );

    const lines = screen.getAllByTestId("line");
    expect(lines.map((line) => line.dataset.name)).toEqual(["Android", "iOS"]);
    expect(lines.map((line) => line.dataset.stroke)).toEqual([
      "#b88700",
      "#007aff",
    ]);
    expect(lines.every((line) => line.dataset.type === "linear")).toBe(true);
    expect(screen.queryByTestId("bar")).not.toBeInTheDocument();
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-domain",
      "0,1.05",
    );
    expect(screen.getByText("Sessions (%)")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-allow-decimals",
      "true",
    );
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-midpoint-label",
      "50%",
    );
  });
});
