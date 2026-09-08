/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";

jest.mock("recharts", () => ({
  Area: (props: {
    fill: string;
    name: string;
    stackId?: string;
    stroke: string;
  }) => (
    <div
      data-testid="area"
      data-fill={props.fill}
      data-name={props.name}
      data-stack-id={props.stackId}
      data-stroke={props.stroke}
    />
  ),
  Bar: (props: {
    fill: string;
    maxBarSize?: number;
    name: string;
    stackId?: string;
  }) => (
    <div
      data-testid="bar"
      data-fill={props.fill}
      data-max-bar-size={props.maxBarSize}
      data-name={props.name}
      data-stack-id={props.stackId}
    />
  ),
  CartesianGrid: () => null,
  ComposedChart: (props: { barCategoryGap?: string; children: ReactNode }) => (
    <div
      data-testid="composed-chart"
      data-bar-category-gap={props.barCategoryGap}
    >
      {props.children}
    </div>
  ),
  Line: (props: {
    children?: ReactNode;
    name: string;
    stroke: string;
    type: string;
  }) => (
    <div
      data-testid="line"
      data-name={props.name}
      data-stroke={props.stroke}
      data-type={props.type}
    >
      {props.children}
    </div>
  ),
  ResponsiveContainer: (props: { children: ReactNode }) => (
    <div>{props.children}</div>
  ),
  Tooltip: () => null,
  XAxis: (props: { interval?: number | string; minTickGap?: number }) => (
    <div
      data-testid="x-axis"
      data-interval={props.interval}
      data-min-tick-gap={props.minTickGap}
    />
  ),
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

const row = (osName: string, proofs: number, day = "2026-08-31"): DailyRow => ({
  appId,
  day,
  os_name: osName,
  n_users_started_selfie_check_flow: 10,
  n_users_shared_a_proof: proofs,
  cumulative_n_users_shared_a_proof: 20,
  p_face_capture_completion: 0.8,
});

const rows = [row("Unknown", 2), row("iOS", 6), row("Android", 4)];
describe("DailyMetricChart", () => {
  it("stacks each day's OS series for count metrics", () => {
    render(
      <DailyMetricChart
        title="Number of users who shared a Selfie Check proof, by day and OS"
        rows={rows}
        metric="n_users_shared_a_proof"
        kind="count"
        chartType="bar"
        yAxisLabel="Number of users"
      />,
    );

    const bars = screen.getAllByTestId("bar");
    expect(bars).toHaveLength(3);
    expect(bars.map((bar) => bar.dataset.name)).toEqual([
      "Android",
      "iOS",
      "Unknown",
    ]);
    expect(bars.map((bar) => bar.dataset.fill)).toEqual([
      "#A4C639",
      "#1C98F7",
      "#6B7280",
    ]);
    expect(bars.map((bar) => bar.dataset.maxBarSize)).toEqual([
      "80",
      "80",
      "80",
    ]);
    expect(screen.getByTestId("composed-chart")).toHaveAttribute(
      "data-bar-category-gap",
      "2%",
    );
    expect(bars.every((bar) => bar.dataset.stackId === "os")).toBe(true);
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Number of users")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-allow-decimals",
      "false",
    );
    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-interval", "0");
  });

  it("uses a thinner bar cap for the default 14-day range", () => {
    const fourteenDays = Array.from({ length: 14 }, (_, index) =>
      row("Android", 4, `2026-08-${String(index + 18).padStart(2, "0")}`),
    );

    render(
      <DailyMetricChart
        title="Number of users who shared a Selfie Check proof, by day and OS"
        rows={fourteenDays}
        metric="n_users_shared_a_proof"
        kind="count"
        chartType="bar"
        yAxisLabel="Number of users"
      />,
    );

    expect(screen.getByTestId("bar")).toHaveAttribute(
      "data-max-bar-size",
      "50",
    );
    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-interval", "0");
  });

  it("draws completion rates as straight OS lines on a zero-to-100-percent axis", () => {
    render(
      <DailyMetricChart
        title="Average Face capture"
        rows={rows}
        metric="p_face_capture_completion"
        kind="rate"
        chartType="line"
        yAxisLabel="Average completion rate"
      />,
    );

    const lines = screen.getAllByTestId("line");
    expect(lines.map((line) => line.dataset.name)).toEqual([
      "Android",
      "iOS",
      "Unknown",
    ]);
    expect(lines.map((line) => line.dataset.stroke)).toEqual([
      "#A4C639",
      "#1C98F7",
      "#6B7280",
    ]);
    expect(lines.every((line) => line.dataset.type === "linear")).toBe(true);
    expect(screen.queryByTestId("bar")).not.toBeInTheDocument();
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-domain",
      "0,1.05",
    );
    expect(screen.getByText("Average completion rate")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-allow-decimals",
      "true",
    );
    expect(screen.getByTestId("y-axis")).toHaveAttribute(
      "data-midpoint-label",
      "50%",
    );
  });

  it("draws the cumulative users metric as stacked OS areas", () => {
    render(
      <DailyMetricChart
        title="Cumulative number of unique users who shared a Selfie Check proof, by day and OS"
        rows={rows}
        metric="cumulative_n_users_shared_a_proof"
        kind="count"
        chartType="area"
        yAxisLabel="Cumulative number of users"
      />,
    );

    const areas = screen.getAllByTestId("area");
    expect(areas.map((area) => area.dataset.name)).toEqual([
      "Android",
      "iOS",
      "Unknown",
    ]);
    expect(areas.map((area) => area.dataset.fill)).toEqual([
      "#A4C639",
      "#1C98F7",
      "#6B7280",
    ]);
    expect(areas.every((area) => area.dataset.stackId === "os")).toBe(true);
    expect(screen.queryByTestId("bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("line")).not.toBeInTheDocument();
    expect(screen.getByText("Cumulative number of users")).toBeInTheDocument();
  });
});
