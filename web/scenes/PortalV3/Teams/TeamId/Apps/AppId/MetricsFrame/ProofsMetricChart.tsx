"use client";

import {
  buildProofsChartData,
  getProofsSeriesColor,
  type ProofsDailyMetric,
  type ProofsDailyRow,
  type ProofsDimension,
} from "@/lib/proofs-analytics";
import { type TrendInterval } from "@/lib/analytics-time-interval";
import { type DailyMetricChartType } from "./DailyMetricChart";
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

const Y_AXIS_WIDTH = 52;
const DATE_LABEL_WIDTH = 44;
const CHART_RIGHT_MARGIN = DATE_LABEL_WIDTH / 2 + 4;
const BAR_LABEL_TOP_MARGIN = 28;

const intervalLabel: Record<TrendInterval, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const getSampleIndexes = (pointCount: number, labelCount: number) => [
  ...new Set(
    Array.from({ length: Math.min(pointCount, labelCount) }, (_, index) =>
      Math.round((index * (pointCount - 1)) / (labelCount - 1)),
    ),
  ),
];

/** Renders a few evenly spaced cumulative totals rather than every point. */
const SampledValueLabel = (props: {
  color: string;
  index?: number;
  labelOffset: number;
  sampleIndexes: readonly number[];
  value?: unknown;
  width?: number;
  x?: number;
  y?: number;
}) => {
  if (
    !props.sampleIndexes.includes(props.index ?? -1) ||
    typeof props.value !== "number" ||
    props.value <= 0
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
      {props.value.toLocaleString("en-US")}
    </text>
  );
};

const formatTickDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const barMaxSize = (pointCount: number) => {
  if (pointCount <= 7) return 80;
  if (pointCount <= 14) return 50;
  return 20;
};

export const ProofsMetricChart = (props: {
  title: string;
  rows: readonly ProofsDailyRow[];
  metric: ProofsDailyMetric;
  dimension: ProofsDimension;
  chartType: DailyMetricChartType;
  timeInterval: TrendInterval;
  yAxisLabel: string;
}) => {
  const [chartWidth, setChartWidth] = useState(0);
  const { points, series } = useMemo(
    () =>
      buildProofsChartData(
        props.rows,
        props.metric,
        props.dimension,
        props.timeInterval,
        props.chartType === "bar" || props.chartType === "area",
      ),
    [
      props.rows,
      props.metric,
      props.dimension,
      props.timeInterval,
      props.chartType,
    ],
  );
  const hasVisibleSeries = series.length > 0;
  const showEveryDate = points.length <= 14;
  const chartPoints = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        stackTotal: series.reduce(
          (total, name) =>
            total + (typeof point[name] === "number" ? point[name] : 0),
          0,
        ),
      })),
    [points, series],
  );
  const tooltipSeries = useMemo(
    () =>
      series.map((name) => ({
        color: getProofsSeriesColor(props.dimension, name),
        name,
      })),
    [props.dimension, series],
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
  const rotateDates =
    showEveryDate &&
    points.length > 1 &&
    (chartWidth - Y_AXIS_WIDTH - CHART_RIGHT_MARGIN) / points.length <
      DATE_LABEL_WIDTH;

  return (
    <section
      aria-label={props.title}
      className="w-full min-w-0 rounded-16 border border-portal-border bg-white p-5"
    >
      <h4 className="font-world text-14 font-medium text-portal-heading">
        {props.title}
      </h4>
      <div className="mt-3 min-h-[18px]">
        {hasVisibleSeries && (
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {series.map((name) => (
              <li
                key={name}
                className="flex items-center gap-1.5 font-world text-12 text-portal-muted"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: getProofsSeriesColor(
                      props.dimension,
                      name,
                    ),
                  }}
                />
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative mt-4 aspect-[13/5] max-h-[360px] min-h-[280px] w-full pb-8 pl-12 font-world tabular-nums [&_.recharts-surface]:rounded-sm [&_.recharts-surface]:focus-visible:outline-2 [&_.recharts-surface]:focus-visible:outline-offset-4 [&_.recharts-surface]:focus-visible:outline-portal-border">
        <span
          aria-hidden
          className="absolute right-0 bottom-0 left-12 text-center font-world text-12 text-portal-muted"
        >
          {intervalLabel[props.timeInterval]}
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
            key={series.join(",")}
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
              stroke="#EDEEF0"
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
              tick={{ fill: "#757575", fontSize: 12 }}
              tickFormatter={formatTickDate}
            />
            <YAxis
              width={Y_AXIS_WIDTH}
              allowDecimals={false}
              allowDataOverflow={!hasVisibleSeries}
              axisLine={false}
              domain={[0, hasVisibleSeries ? "auto" : 1]}
              tick={{ fill: "#757575", fontSize: 11 }}
              tickMargin={8}
              tickLine={false}
            />
            {hasVisibleSeries ? (
              <Tooltip
                content={
                  props.chartType === "bar" || props.chartType === "area" ? (
                    <StackedMetricTooltip
                      formatLabel={(value) => formatTickDate(value)}
                      formatValue={(value) => value.toLocaleString("en-US")}
                      series={tooltipSeries}
                    />
                  ) : undefined
                }
                cursor={
                  props.chartType === "bar"
                    ? { fill: "rgba(24, 24, 24, 0.025)" }
                    : { stroke: "#D1D5DB", strokeDasharray: "3 5" }
                }
                contentStyle={{
                  border: "1px solid #EDEEF0",
                  borderRadius: 12,
                  padding: "12px 16px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
                  fontSize: 12,
                }}
                labelStyle={{
                  color: "#171717",
                  fontWeight: 500,
                  marginBottom: 6,
                }}
                itemStyle={{ padding: "3px 0" }}
                separator=": "
                itemSorter={({ name }) => series.indexOf(String(name))}
                labelFormatter={(value) => formatTickDate(String(value))}
                formatter={(value) =>
                  typeof value === "number"
                    ? value.toLocaleString("en-US")
                    : "—"
                }
              />
            ) : (
              <Label
                position="center"
                value="No data available"
                className="font-world text-13"
                fill="#757575"
                stroke="white"
                strokeWidth={4}
                paintOrder="stroke"
              />
            )}
            {props.chartType === "bar" && (
              <BarStack radius={[2, 2, 0, 0]}>
                {series.map((name, index) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    name={name}
                    fill={getProofsSeriesColor(props.dimension, name)}
                    isAnimationActive={false}
                    maxBarSize={barMaxSize(points.length)}
                  >
                    {showAllBarLabels && index === series.length - 1 && (
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
              series.map((name, index) =>
                props.chartType === "line" ? (
                  <Line
                    key={name}
                    activeDot={{ r: 4, stroke: "white", strokeWidth: 2 }}
                    connectNulls={false}
                    dataKey={name}
                    dot={
                      points.length <= 14 ? { r: 2.5, strokeWidth: 1.5 } : false
                    }
                    isAnimationActive={false}
                    name={name}
                    stroke={getProofsSeriesColor(props.dimension, name)}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    type="linear"
                  />
                ) : (
                  <Area
                    key={name}
                    connectNulls={false}
                    dataKey={name}
                    fill={getProofsSeriesColor(props.dimension, name)}
                    fillOpacity={0.1}
                    isAnimationActive={false}
                    name={name}
                    stackId="dimension"
                    stroke={getProofsSeriesColor(props.dimension, name)}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    activeDot={{ r: 4, stroke: "white", strokeWidth: 2 }}
                    type="linear"
                  >
                    {showCumulativeLabels && index === series.length - 1 && (
                      <LabelList
                        content={
                          <SampledValueLabel
                            color="#525252"
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
      </div>
    </section>
  );
};
