/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import React, { type ReactNode } from "react";

let mockChartWidth = 640;
beforeEach(() => {
  mockChartWidth = 640;
});

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
  Label: ({ value }: { value: string }) => <span>{value}</span>,
  ComposedChart: (props: {
    barCategoryGap?: string;
    children: ReactNode;
    margin?: { right?: number };
  }) => (
    <div
      data-testid="composed-chart"
      data-bar-category-gap={props.barCategoryGap}
      data-right-margin={props.margin?.right}
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
  ResponsiveContainer: (props: {
    children: ReactNode;
    onResize?: (width: number, height: number) => void;
  }) => {
    React.useEffect(() => {
      props.onResize?.(mockChartWidth, 280);
    }, [props.onResize, mockChartWidth]);
    return <div>{props.children}</div>;
  },
  Tooltip: (props: { itemSorter: (item: { name?: string }) => number }) => {
    const { DefaultTooltipContent } = jest.requireActual("recharts");
    return (
      <div data-testid="tooltip">
        <DefaultTooltipContent
          itemSorter={props.itemSorter}
          payload={[
            { name: "Unknown", value: 2 },
            { name: "iOS", value: 6 },
            { name: "Android", value: 4 },
          ]}
        />
      </div>
    );
  },
  XAxis: (props: {
    interval?: number | string;
    minTickGap?: number;
    angle?: number;
    height?: number;
    textAnchor?: string;
  }) => (
    <div
      data-testid="x-axis"
      data-interval={props.interval}
      data-min-tick-gap={props.minTickGap}
      data-angle={props.angle}
      data-height={props.height}
      data-text-anchor={props.textAnchor}
    />
  ),
  YAxis: (props: {
    allowDecimals: boolean;
    allowDataOverflow?: boolean;
    domain?: [number, number];
    tickFormatter?: (value: number) => string;
  }) => (
    <div
      data-testid="y-axis"
      data-allow-decimals={props.allowDecimals}
      data-allow-data-overflow={props.allowDataOverflow}
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
  it.each([
    { chartType: "bar", metric: "n_users_shared_a_proof", kind: "count" },
    { chartType: "line", metric: "p_face_capture_completion", kind: "rate" },
    {
      chartType: "area",
      metric: "cumulative_n_users_shared_a_proof",
      kind: "count",
    },
  ] as const)(
    "keeps axes for zero-only $chartType data and shows an OS with a single nonzero day",
    ({ chartType, metric, kind }) => {
      const zeroRows = ["Android", "Unknown"].flatMap((os) =>
        Array.from({ length: 7 }, (_, index) => ({
          ...row(os, 0, `2026-09-0${index + 1}`),
          [metric]: 0,
        })),
      );
      const chart = (dailyRows: readonly DailyRow[]) => (
        <DailyMetricChart
          title="Daily metric"
          rows={dailyRows}
          metric={metric}
          kind={kind}
          chartType={chartType}
          yAxisLabel="Value"
        />
      );
      const view = render(chart(zeroRows));

      expect(screen.getByText("No data available")).toBeInTheDocument();
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
      expect(screen.getByTestId("y-axis")).toHaveAttribute(
        "data-domain",
        kind === "rate" ? "0,1.05" : "0,1",
      );
      expect(screen.getByTestId("y-axis")).toHaveAttribute(
        "data-allow-data-overflow",
        "true",
      );
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(screen.queryByTestId(chartType)).not.toBeInTheDocument();
      expect(screen.queryByTestId("tooltip")).not.toBeInTheDocument();

      view.rerender(
        chart(
          zeroRows.map((row, index) =>
            index === 6 ? { ...row, [metric]: 1 } : row,
          ),
        ),
      );

      expect(screen.queryByText("No data available")).not.toBeInTheDocument();
      expect(screen.getByTestId(chartType)).toHaveAttribute(
        "data-name",
        "Android",
      );
      expect(
        within(screen.getAllByRole("list")[0]).getByText("Android"),
      ).toBeInTheDocument();
      expect(
        within(screen.getAllByRole("list")[0]).queryByText("Unknown"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();

      view.rerender(chart(zeroRows));
      expect(screen.getByText("No data available")).toBeInTheDocument();
      expect(screen.queryByTestId(chartType)).not.toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    },
  );

  it("keeps an empty chart when there are no rows", () => {
    render(
      <DailyMetricChart
        title="Daily proofs"
        rows={[]}
        metric="n_users_shared_a_proof"
        kind="count"
        chartType="bar"
        yAxisLabel="Number of users"
      />,
    );
    expect(screen.getByText("No data available")).toBeInTheDocument();
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    expect(screen.queryByTestId("bar")).not.toBeInTheDocument();
  });

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
    expect(
      within(screen.getByTestId("tooltip"))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Android : 4", "iOS : 6", "Unknown : 2"]);
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

  it("keeps every short-range date and rotates crowded labels as the chart resizes", () => {
    const fourteenDays = Array.from({ length: 14 }, (_, index) =>
      row("Android", 4, `2026-08-${String(index + 18).padStart(2, "0")}`),
    );
    const chart = () => (
      <DailyMetricChart
        title="Number of users who shared a Selfie Check proof, by day and OS"
        rows={fourteenDays}
        metric="n_users_shared_a_proof"
        kind="count"
        chartType="bar"
        yAxisLabel="Number of users"
      />
    );
    mockChartWidth = 320;
    const view = render(chart());

    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-interval", "0");
    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-angle", "-90");
    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-height", "56");
    expect(screen.getByTestId("x-axis")).toHaveAttribute(
      "data-text-anchor",
      "end",
    );

    mockChartWidth = 900;
    view.rerender(chart());

    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-interval", "0");
    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-angle", "0");
    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-height", "32");
    expect(screen.getByTestId("x-axis")).toHaveAttribute(
      "data-text-anchor",
      "middle",
    );
  });

  it.each([7, 14])(
    "reserves space for the last date in a %i-day chart even when narrow",
    (days) => {
      const dailyRows = Array.from({ length: days }, (_, index) =>
        row("Android", 4, `2026-09-${String(index + 1).padStart(2, "0")}`),
      );
      const chart = () => (
        <DailyMetricChart
          title="Daily completion rate"
          rows={dailyRows}
          metric="p_face_capture_completion"
          kind="rate"
          chartType="line"
          yAxisLabel="Average completion rate"
        />
      );
      mockChartWidth = 900;
      const view = render(chart());
      const rightMargin = Number(
        screen.getByTestId("composed-chart").dataset.rightMargin,
      );

      expect(rightMargin).toBeGreaterThanOrEqual(26);
      expect(screen.getByTestId("x-axis")).toHaveAttribute(
        "data-interval",
        "0",
      );
      expect(screen.getByTestId("x-axis")).toHaveAttribute("data-angle", "0");

      mockChartWidth = 180;
      view.rerender(chart());

      expect(screen.getByTestId("composed-chart")).toHaveAttribute(
        "data-right-margin",
        String(rightMargin),
      );
      expect(screen.getByTestId("x-axis")).toHaveAttribute(
        "data-interval",
        "0",
      );
      expect(screen.getByTestId("x-axis")).toHaveAttribute("data-angle", "-90");
    },
  );

  it("lets long ranges skip dates instead of forcing crowded labels", () => {
    mockChartWidth = 320;
    render(
      <DailyMetricChart
        title="Daily users"
        rows={Array.from({ length: 15 }, (_, index) =>
          row("Android", 4, `2026-08-${String(index + 1).padStart(2, "0")}`),
        )}
        metric="n_users_shared_a_proof"
        kind="count"
        chartType="bar"
        yAxisLabel="Number of users"
      />,
    );

    expect(screen.getByTestId("x-axis")).toHaveAttribute(
      "data-interval",
      "preserveStartEnd",
    );
    expect(screen.getByTestId("x-axis")).toHaveAttribute(
      "data-min-tick-gap",
      "32",
    );
    expect(screen.getByTestId("x-axis")).toHaveAttribute("data-angle", "0");
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
