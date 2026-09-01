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

// Color follows the OS, not its position: classic Android Green (#A4C639
// deepened along its own hue until it passes the lightness band and 3:1
// contrast on the white card) and Apple system blue for iOS. The pair clears
// every palette check. Unknown OSes fall back to purple, then muted gray.
const OS_COLORS: Readonly<Record<string, string>> = {
  Android: "#7d992b",
  iOS: "#007aff",
};
const FALLBACK_OS_COLORS = ["#6600cc", "#757575"] as const;

const osColor = (osName: string, index: number) =>
  OS_COLORS[osName] ??
  FALLBACK_OS_COLORS[Math.min(index, FALLBACK_OS_COLORS.length - 1)];

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
      className="w-full rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
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
                  style={{ backgroundColor: osColor(os.osName, index) }}
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
        <div className="mt-4 aspect-video w-full outline-none [&_*]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...points]}
              margin={{ top: 4, left: 12, right: 12, bottom: 0 }}
              barCategoryGap="15%"
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
                  stackId="os"
                  fill={osColor(os.osName, index)}
                  isAnimationActive={false}
                  maxBarSize={20}
                  radius={
                    index === operatingSystems.length - 1 ? [3, 3, 0, 0] : 0
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
