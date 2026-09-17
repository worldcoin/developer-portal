"use client";

import {
  buildDailyChartData,
  type DailyChartMetric,
  type DailyRow,
  type MetricKind,
} from "@/lib/selfie-check-analytics";
import { type TrendInterval } from "@/lib/analytics-time-interval";
import { StackedMetricTooltip } from "./StackedMetricTooltip";
import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarStack,
  CartesianGrid,
  ComposedChart,
  Label,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RATE_TICKS = [0, 0.25, 0.5, 0.75, 1] as const;
const Y_AXIS_WIDTH = 52;
const DATE_LABEL_WIDTH = 44;
// The final date is centered on the last point, so reserve its right half.
const CHART_RIGHT_MARGIN = DATE_LABEL_WIDTH / 2 + 4;
const BAR_LABEL_TOP_MARGIN = 28;

const formatTickDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const formatRate = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatRateTick = (value: number) => `${Math.round(value * 100)}%`;

const intervalLabel: Record<TrendInterval, string> = {
  daily: "Day",
  weekly: "Week",
  monthly: "Month",
};

const getSampleIndexes = (pointCount: number, labelCount: number) => [
  ...new Set(
    Array.from({ length: Math.min(pointCount, labelCount) }, (_, index) =>
      Math.round((index * (pointCount - 1)) / (labelCount - 1)),
    ),
  ),
];

/** Renders a few evenly spaced labels, optionally alternating between series. */
const SampledValueLabel = (props: {
  color: string;
  formatValue: (value: number) => string;
  index?: number;
  labelOffset: number;
  sampleIndexes: readonly number[];
  seriesCount?: number;
  seriesIndex?: number;
  value?: unknown;
  width?: number;
  x?: number;
  y?: number;
}) => {
  const samplePosition = props.sampleIndexes.indexOf(props.index ?? -1);
  if (
    samplePosition === -1 ||
    typeof props.value !== "number" ||
    props.value <= 0 ||
    (props.seriesIndex !== undefined &&
      props.seriesCount !== undefined &&
      samplePosition % props.seriesCount !== props.seriesIndex)
  ) {
    return null;
  }

  return (
    <text
      fill={props.color}
      fontSize={11}
      fontWeight={500}
      textAnchor="middle"
      x={Number(props.x ?? 0) + Number(props.width ?? 0) / 2}
      y={Number(props.y ?? 0) + props.labelOffset}
    >
      {props.formatValue(props.value)}
    </text>
  );
};

/** Keep sparse weekly bars readable while keeping longer ranges compact. */
const barMaxSize = (pointCount: number) => {
  if (pointCount <= 7) return 80;
  if (pointCount <= 14) return 50;
  return 20;
};

export const DailyMetricChart = (props: {
  title: string;
  rows: readonly DailyRow[];
  metric: DailyChartMetric;
  kind: MetricKind;
  chartType: DailyMetricChartType;
  timeInterval?: TrendInterval;
  yAxisLabel: string;
  /** Renders in place of the chart, keeping the card's footprint stable
   * across loading/error states so switching intervals doesn't collapse
   * the page layout and jump the scroll position. */
  emptyMessage?: string;
}) => {
  const [chartWidth, setChartWidth] = useState(0);
  const { points, operatingSystems } = useMemo(
    () => buildDailyChartData(props.rows, props.metric),
    [props.rows, props.metric],
  );
  const hasVisibleSeries = operatingSystems.length > 0;
  const isRate = props.kind === "rate";
  const formatValue = (value: number) =>
    isRate ? formatRate(value) : value.toLocaleString("en-US");
  const showEveryDate = points.length <= 14;
  const chartPoints = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        stackTotal: operatingSystems.reduce((total, operatingSystem) => {
          const value = point[operatingSystem.dataKey];
          return total + (typeof value === "number" ? value : 0);
        }, 0),
      })),
    [operatingSystems, points],
  );
  const tooltipSeries = useMemo(
    () =>
      operatingSystems.map(({ color, osName }) => ({
        color,
        name: osName,
      })),
    [operatingSystems],
  );
  const showAllBarLabels =
    props.chartType === "bar" && hasVisibleSeries && points.length <= 14;
  const showBarLabels = showAllBarLabels;
  const showCumulativeLabels =
    hasVisibleSeries &&
    props.chartType === "area" &&
    (chartWidth > 0 || points.length <= 7);
  const cumulativeLabelIndexes = useMemo(
    () => getSampleIndexes(points.length, 3),
    [points.length],
  );
  const hasTopDataLabels = showBarLabels || showCumulativeLabels;
  // Keep every short-range date, turning labels only when they cannot fit.
  const rotateDates =
    showEveryDate &&
    points.length > 1 &&
    (chartWidth - Y_AXIS_WIDTH - CHART_RIGHT_MARGIN) / points.length <
      DATE_LABEL_WIDTH;

  return (
    <section
      aria-label={props.title}
      className="w-full min-w-0 rounded-16 border border-portal-border bg-surface p-5"
    >
      <h3 className="font-world text-14 font-medium text-portal-heading">
        {props.title}
      </h3>

      <div className="mt-3 min-h-[18px]">
        {!props.emptyMessage && hasVisibleSeries && (
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {operatingSystems.map((os) => (
              <li
                key={os.dataKey}
                className="flex items-center gap-1.5 font-world text-12 text-portal-muted"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: os.color }}
                />
                {os.osName}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative mt-4 aspect-[13/5] max-h-[360px] min-h-[280px] w-full pb-8 pl-12 font-world tabular-nums [&_.recharts-surface]:rounded-sm [&_.recharts-surface]:focus-visible:outline-2 [&_.recharts-surface]:focus-visible:outline-offset-4 [&_.recharts-surface]:focus-visible:outline-portal-border">
        {props.emptyMessage ? (
          <div className="flex h-full w-full items-center justify-center pb-8 text-center">
            <p className="font-world text-13 text-portal-muted">
              {props.emptyMessage}
            </p>
          </div>
        ) : (
          <>
            <span
              aria-hidden
              className="absolute right-0 bottom-0 left-12 text-center font-world text-12 text-portal-muted"
            >
              {intervalLabel[props.timeInterval ?? "daily"]}
            </span>
            <span
              aria-hidden
              className="absolute top-0 bottom-8 left-0 flex w-8 rotate-180 items-center justify-center font-world text-12 text-portal-muted [writing-mode:vertical-rl]"
            >
              {props.yAxisLabel}
            </span>
            <ResponsiveContainer
              width="100%"
              height="100%"
              onResize={setChartWidth}
            >
              <ComposedChart
                // Recharts stacks series in registration order. Reset that order
                // when filters add or remove an OS so it always matches the legend.
                key={operatingSystems.map((os) => os.dataKey).join(",")}
                data={chartPoints}
                margin={{
                  top: hasTopDataLabels ? BAR_LABEL_TOP_MARGIN : 8,
                  left: 0,
                  right: CHART_RIGHT_MARGIN,
                  bottom: 0,
                }}
                barCategoryGap="2%"
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  height={rotateDates ? 56 : 32}
                  angle={rotateDates ? -90 : 0}
                  textAnchor={rotateDates ? "end" : "middle"}
                  tickMargin={8}
                  minTickGap={showEveryDate ? 0 : 32}
                  interval={showEveryDate ? 0 : "preserveStartEnd"}
                  tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
                  tickFormatter={formatTickDate}
                />
                <YAxis
                  width={Y_AXIS_WIDTH}
                  allowDecimals={isRate}
                  // Honor the explicit scale even when there are no plotted series.
                  allowDataOverflow={!hasVisibleSeries}
                  axisLine={false}
                  domain={
                    isRate ? [0, 1.05] : [0, hasVisibleSeries ? "auto" : 1]
                  }
                  tickFormatter={isRate ? formatRateTick : undefined}
                  ticks={isRate ? [...RATE_TICKS] : undefined}
                  tick={{ fill: "var(--chart-tick)", fontSize: 11 }}
                  tickMargin={8}
                  tickLine={false}
                />
                {hasVisibleSeries ? (
                  <Tooltip
                    content={
                      props.chartType === "bar" ||
                      props.chartType === "area" ? (
                        <StackedMetricTooltip
                          formatLabel={(value) => formatTickDate(value)}
                          formatValue={formatValue}
                          series={tooltipSeries}
                        />
                      ) : undefined
                    }
                    cursor={
                      props.chartType === "bar"
                        ? { fill: "var(--chart-cursor)" }
                        : {
                            stroke: "var(--chart-cursor-line)",
                            strokeDasharray: "3 5",
                          }
                    }
                    contentStyle={{
                      border: "1px solid var(--chart-grid)",
                      backgroundColor: "var(--color-surface-raised)",
                      color: "var(--chart-label)",
                      borderRadius: 12,
                      padding: "12px 16px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
                      fontSize: 12,
                    }}
                    labelStyle={{
                      color: "var(--chart-label)",
                      fontWeight: 500,
                      marginBottom: 6,
                    }}
                    itemStyle={{ padding: "3px 0" }}
                    separator=": "
                    itemSorter={({ name }) =>
                      operatingSystems.findIndex((os) => os.osName === name)
                    }
                    labelFormatter={(value) => formatTickDate(String(value))}
                    formatter={(value) =>
                      typeof value === "number" ? formatValue(value) : "—"
                    }
                  />
                ) : (
                  <Label
                    position="center"
                    value="No data available"
                    className="font-world text-13"
                    fill="var(--chart-tick)"
                    stroke="var(--color-surface)"
                    strokeWidth={4}
                    paintOrder="stroke"
                  />
                )}
                {/* Round the whole stack, including days where its last OS is zero or absent. */}
                {props.chartType === "bar" && (
                  <BarStack radius={[2, 2, 0, 0]}>
                    {operatingSystems.map((os, index) => (
                      <Bar
                        key={os.dataKey}
                        dataKey={os.dataKey}
                        name={os.osName}
                        fill={os.color}
                        isAnimationActive={false}
                        maxBarSize={barMaxSize(points.length)}
                      >
                        {showAllBarLabels &&
                          index === operatingSystems.length - 1 && (
                            <LabelList
                              dataKey="stackTotal"
                              fill="#525252"
                              fontSize={11}
                              formatter={(value) =>
                                typeof value === "number" && value > 0
                                  ? value.toLocaleString("en-US")
                                  : ""
                              }
                              offset={8}
                              position="top"
                            />
                          )}
                      </Bar>
                    ))}
                  </BarStack>
                )}
                {props.chartType !== "bar" &&
                  operatingSystems.map((os, index) =>
                    props.chartType === "line" ? (
                      <Line
                        key={os.dataKey}
                        activeDot={{ r: 4, stroke: "white", strokeWidth: 2 }}
                        connectNulls={false}
                        dataKey={os.dataKey}
                        dot={
                          points.length <= 14
                            ? { r: 2.5, strokeWidth: 1.5 }
                            : false
                        }
                        isAnimationActive={false}
                        name={os.osName}
                        stroke={os.color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        type="linear"
                      />
                    ) : (
                      <Area
                        key={os.dataKey}
                        connectNulls={false}
                        dataKey={os.dataKey}
                        fill={os.color}
                        fillOpacity={0.1}
                        isAnimationActive={false}
                        name={os.osName}
                        stackId="os"
                        stroke={os.color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        activeDot={{ r: 4, stroke: "white", strokeWidth: 2 }}
                        type="linear"
                      >
                        {showCumulativeLabels &&
                          index === operatingSystems.length - 1 && (
                            <LabelList
                              content={
                                <SampledValueLabel
                                  color="#525252"
                                  formatValue={formatValue}
                                  labelOffset={-8}
                                  sampleIndexes={cumulativeLabelIndexes}
                                />
                              }
                              dataKey="stackTotal"
                            />
                          )}
                      </Area>
                    ),
                  )}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </section>
  );
};

export type DailyMetricChartType = "area" | "bar" | "line";
