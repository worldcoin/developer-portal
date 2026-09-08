"use client";

import {
  buildDailyChartData,
  type DailyChartMetric,
  type DailyRow,
  type MetricKind,
} from "@/lib/selfie-check-analytics";
import { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Color follows the OS, not its position.
const OS_COLORS: Readonly<Record<string, string>> = {
  Android: "#A4C639",
  iOS: "#1C98F7",
};
const RATE_TICKS = [0, 0.25, 0.5, 0.75, 1] as const;

const osColor = (osName: string) => OS_COLORS[osName] ?? "#6B7280";

const formatTickDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const formatRate = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatRateTick = (value: number) => `${Math.round(value * 100)}%`;

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
  yAxisLabel: string;
}) => {
  const { points, operatingSystems } = useMemo(
    () => buildDailyChartData(props.rows, props.metric),
    [props.rows, props.metric],
  );
  const formatValue = (value: number) =>
    props.kind === "rate" ? formatRate(value) : value.toLocaleString("en-US");

  return (
    <section
      aria-label={props.title}
      className="w-full rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
    >
      <h3 className="font-world text-14 font-medium whitespace-nowrap text-portal-heading">
        {props.title}
      </h3>

      {operatingSystems.length > 0 && (
        <ul className="mt-2 flex gap-3">
          {operatingSystems.map((os) => (
            <li
              key={os.dataKey}
              className="flex items-center gap-1.5 font-world text-12 text-portal-muted"
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: osColor(os.osName) }}
              />
              {os.osName}
            </li>
          ))}
        </ul>
      )}

      {points.length === 0 ? (
        <p className="mt-6 font-world text-13 text-portal-muted">
          No daily data yet.
        </p>
      ) : (
        <div className="relative mt-4 aspect-[13/5] max-h-[360px] min-h-[280px] w-full pb-8 pl-12 outline-none [&_*]:outline-none">
          <span
            aria-hidden
            className="absolute right-0 bottom-0 left-12 text-center font-world text-12 text-portal-muted"
          >
            Day
          </span>
          <span
            aria-hidden
            className="absolute top-0 bottom-8 left-0 flex w-8 rotate-180 items-center justify-center font-world text-12 text-portal-muted [writing-mode:vertical-rl]"
          >
            {props.yAxisLabel}
          </span>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={[...points]}
              margin={{
                top: 4,
                left: 0,
                right: 12,
                bottom: 0,
              }}
              barCategoryGap="2%"
            >
              <CartesianGrid vertical={false} stroke="#f1f1f1" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                height={32}
                tickMargin={8}
                minTickGap={points.length <= 14 ? 0 : 32}
                interval={points.length <= 14 ? 0 : "preserveStartEnd"}
                tick={{ fill: "#757575", fontSize: 12 }}
                tickFormatter={formatTickDate}
              />
              <YAxis
                allowDecimals={props.kind === "rate"}
                axisLine={false}
                {...(props.kind === "rate"
                  ? {
                      domain: [0, 1.05] as const,
                      tickFormatter: formatRateTick,
                      ticks: [...RATE_TICKS],
                      width: 52,
                    }
                  : { width: 52 })}
                tick={{ fill: "#757575", fontSize: 12 }}
                tickMargin={8}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(24, 24, 24, 0.04)" }}
                itemSorter={(item) => {
                  const osName = String(item.name ?? "");
                  if (osName === "Android") return 0;
                  if (osName === "iOS") return 1;
                  if (osName === "Unknown") return 2;
                  return 3;
                }}
                labelFormatter={(value) => formatTickDate(String(value))}
                formatter={(value) =>
                  typeof value === "number" ? formatValue(value) : "—"
                }
              />
              {operatingSystems.map((os, index) =>
                props.chartType === "line" ? (
                  <Line
                    key={os.dataKey}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                    dataKey={os.dataKey}
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                    name={os.osName}
                    stroke={osColor(os.osName)}
                    strokeWidth={2}
                    type="linear"
                  />
                ) : props.chartType === "area" ? (
                  <Area
                    key={os.dataKey}
                    connectNulls={false}
                    dataKey={os.dataKey}
                    fill={osColor(os.osName)}
                    fillOpacity={0.12}
                    isAnimationActive={false}
                    name={os.osName}
                    stackId="os"
                    stroke={osColor(os.osName)}
                    strokeWidth={2}
                    type="linear"
                  />
                ) : (
                  <Bar
                    key={os.dataKey}
                    dataKey={os.dataKey}
                    name={os.osName}
                    stackId="os"
                    fill={osColor(os.osName)}
                    isAnimationActive={false}
                    maxBarSize={barMaxSize(points.length)}
                    radius={
                      index === operatingSystems.length - 1 ? [3, 3, 0, 0] : 0
                    }
                  />
                ),
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export type DailyMetricChartType = "area" | "bar" | "line";
