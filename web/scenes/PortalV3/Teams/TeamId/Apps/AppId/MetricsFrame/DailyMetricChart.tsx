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
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

// Validated categorical pair (portal blue + snapped portal purple): passes the
// lightness band, chroma floor, CVD separation, and 3:1 surface contrast on the
// white card. Assigned to operating systems in fixed alphabetical order, never
// cycled; OSes beyond the pair fold into muted gray.
const OS_COLORS = ["#007cfb", "#6600cc"] as const;
const OVERFLOW_OS_COLOR = "#757575";

const osColor = (index: number) => OS_COLORS[index] ?? OVERFLOW_OS_COLOR;

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
  const { points, operatingSystems } = useMemo(
    () => buildDailyChartData(props.rows, props.metric),
    [props.rows, props.metric],
  );

  const formatValue = (value: number) =>
    props.kind === "rate"
      ? `${(value * 100).toFixed(1)}%`
      : value.toLocaleString("en-US");

  return (
    <section
      aria-label={props.title}
      className="w-[452px] max-w-full rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-world text-14 font-medium text-portal-heading">
          {props.title}
        </h3>
        {operatingSystems.length > 0 && (
          <ul className="flex items-center gap-3">
            {operatingSystems.map((os, index) => (
              <li
                key={os.dataKey}
                className="flex items-center gap-1.5 font-world text-12 text-portal-muted"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: osColor(index) }}
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
        <div className="mt-4 aspect-video w-full [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...points]}
              margin={{ top: 4, left: 12, right: 12, bottom: 0 }}
              barGap={2}
              barCategoryGap="30%"
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
                cursor={{ fill: "rgba(24, 24, 24, 0.04)" }}
                labelFormatter={(value) => formatTickDate(String(value))}
                formatter={(value) =>
                  typeof value === "number" ? formatValue(value) : "—"
                }
              />
              {operatingSystems.map((os, index) => (
                <Bar
                  key={os.dataKey}
                  dataKey={os.dataKey}
                  name={os.osName}
                  fill={osColor(index)}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={8}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
