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
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

// Validated categorical pair (portal blue + snapped portal purple): passes the
// lightness band, chroma floor, CVD separation, and 3:1 surface contrast on the
// white card. Assigned to series in fixed alphabetical order, never cycled;
// series beyond the pair fold into muted gray.
const SERIES_COLORS = ["#007cfb", "#6600cc"] as const;
const OVERFLOW_SERIES_COLOR = "#757575";

const seriesColor = (index: number) =>
  SERIES_COLORS[index] ?? OVERFLOW_SERIES_COLOR;

const formatTickDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export const DailyMetricChart = (props: {
  title: string;
  rows: readonly DailyRow[];
  metric: DailyChartMetric;
  kind: MetricKind;
}) => {
  const { points, series } = useMemo(
    () => buildDailyChartData(props.rows, props.metric),
    [props.rows, props.metric],
  );

  // Counts by OS compose to an additive total, so they stack; rates do not.
  const stackId = props.kind === "count" ? "os" : undefined;

  return (
    <section
      aria-label={props.title}
      className="w-[452px] max-w-full rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-world text-14 font-medium text-portal-heading">
          {props.title}
        </h3>
        {series.length > 0 && (
          <ul className="flex items-center gap-3">
            {series.map((name, index) => (
              <li
                key={name}
                className="flex items-center gap-1.5 font-world text-12 text-portal-muted"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: seriesColor(index) }}
                />
                {name}
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
        <div className="mt-4 aspect-video w-full [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[...points]}
              margin={{ top: 4, left: 12, right: 12, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f1f1f1" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tick={{ fill: "#757575", fontSize: 12 }}
                tickFormatter={formatTickDate}
              />
              <Tooltip
                cursor={{ stroke: "#b8b8b8", strokeWidth: 1 }}
                labelFormatter={(value) => formatTickDate(String(value))}
              />
              {series.map((name, index) => (
                <Area
                  key={name}
                  dataKey={name}
                  type="natural"
                  stackId={stackId}
                  connectNulls={false}
                  stroke={seriesColor(index)}
                  strokeWidth={2}
                  fill={seriesColor(index)}
                  fillOpacity={0.4}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
