"use client";

import {
  buildDailyChartData,
  type DailyChartMetric,
  type DailyRow,
  type MetricKind,
} from "@/lib/selfie-check-analytics";
import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Color follows the OS, not its position. Android uses a golden amber that
// stays distinct from iOS blue while retaining 3:1 contrast on the white card.
const OS_COLORS: Readonly<Record<string, string>> = {
  Android: "#b88700",
  iOS: "#007aff",
};
const RATE_TICKS = [0, 0.25, 0.5, 0.75, 1] as const;

const osColor = (osName: string) => OS_COLORS[osName];

const formatTickDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const formatRate = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatRateTick = (value: number) => `${Math.round(value * 100)}%`;

export const DailyMetricChart = (props: {
  title: string;
  rows: readonly DailyRow[];
  metric: DailyChartMetric;
  kind: MetricKind;
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
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="min-w-[220px] flex-1 font-world text-14 font-medium text-portal-heading">
          {props.title}
        </h3>
        {operatingSystems.length > 0 && (
          <ul className="flex shrink-0 items-center gap-3">
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
      </div>

      {points.length === 0 ? (
        <p className="mt-6 font-world text-13 text-portal-muted">
          No daily data yet.
        </p>
      ) : (
        <div className="relative mt-4 aspect-video w-full pb-8 pl-12 outline-none [&_*]:outline-none">
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
            {props.kind === "rate" ? "Users (%)" : "Users (#)"}
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
              barCategoryGap="15%"
            >
              <CartesianGrid vertical={false} stroke="#f1f1f1" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                height={32}
                tickMargin={8}
                minTickGap={32}
                tick={{ fill: "#757575", fontSize: 12 }}
                tickFormatter={formatTickDate}
              />
              <YAxis
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
                labelFormatter={(value) => formatTickDate(String(value))}
                formatter={(value) =>
                  typeof value === "number" ? formatValue(value) : "—"
                }
              />
              {operatingSystems.map((os, index) =>
                props.kind === "rate" ? (
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
                ) : (
                  <Bar
                    key={os.dataKey}
                    dataKey={os.dataKey}
                    name={os.osName}
                    stackId="os"
                    fill={osColor(os.osName)}
                    isAnimationActive={false}
                    maxBarSize={20}
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
