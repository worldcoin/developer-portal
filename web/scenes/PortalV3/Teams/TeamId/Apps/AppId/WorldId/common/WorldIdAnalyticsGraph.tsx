"use client";

import {
  bucketAllTimeSeries,
  formatAnalyticsDateRange,
  type AnalyticsPoint,
} from "@/lib/world-id-analytics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Metric = { count: string; series: AnalyticsPoint[] };
type Response = {
  period: "last_7_days" | "all_time";
  app: Metric;
  legacy_actions: Array<Metric & { id: string }>;
  actions: Array<Metric & { id: string }>;
};
type Scope =
  | { type: "app" }
  | { type: "action"; source: "legacy" | "v4"; actionId: string };

export function WorldIdAnalyticsGraph(props: {
  appId: string;
  environment: "staging" | "production";
  scope: Scope;
  compact?: boolean;
}) {
  const [period, setPeriod] = useState<"last_7_days" | "all_time">(
    "last_7_days",
  );
  const [cache, setCache] = useState<Partial<Record<typeof period, Response>>>(
    {},
  );
  const [error, setError] = useState(false);
  const mounted = useRef(true);
  const periodRef = useRef(period);
  periodRef.current = period;

  const load = useCallback(
    async (requestedPeriod: typeof period) => {
      try {
        const params = new URLSearchParams({
          environment: props.environment,
          period: requestedPeriod,
        });
        if (props.scope.type === "action") {
          params.set("action_ids", props.scope.actionId);
        }
        const response = await fetch(
          `/api/portal/apps/${props.appId}/world-id-analytics?${params}`,
        );
        if (!response.ok) throw new Error("analytics request failed");
        const body = (await response.json()) as Response;
        if (mounted.current) {
          setCache((current) => ({ ...current, [requestedPeriod]: body }));
          setError(false);
        }
      } catch {
        if (mounted.current) setError(true);
      }
    },
    [props.appId, props.environment, props.scope],
  );

  useEffect(() => {
    mounted.current = true;
    void load("last_7_days");
    const refresh = () => {
      if (document.visibilityState === "visible") void load(periodRef.current);
    };
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const selectPeriod = (next: typeof period) => {
    setPeriod(next);
    if (!cache[next]) void load(next);
  };
  const response = cache[period] ?? cache.last_7_days;
  const metric = useMemo(() => {
    if (!response) return undefined;
    if (props.scope.type === "app") return response.app;
    const actionId = props.scope.actionId;
    const list =
      props.scope.source === "legacy"
        ? response.legacy_actions
        : response.actions;
    return list.find((item) => item.id === actionId);
  }, [props.scope, response]);

  if (!metric && error) {
    return <div role="alert">Failed to load Unique Verifications</div>;
  }
  if (!metric) {
    return (
      <div
        role="status"
        aria-label="Loading Unique Verifications"
        className="h-24 animate-pulse rounded-xl bg-grey-100"
      />
    );
  }
  const buckets =
    period === "all_time"
      ? bucketAllTimeSeries(metric.series)
      : metric.series.map((point) => ({
          start_date: point.date,
          end_date: point.date,
          count: point.count,
        }));
  const max = Math.max(1, ...buckets.map((point) => Number(point.count)));
  const points = buckets
    .map((point, index) => {
      const x =
        buckets.length === 1 ? 50 : (index / (buckets.length - 1)) * 100;
      return `${x},${40 - (Number(point.count) / max) * 36}`;
    })
    .join(" ");

  return (
    <section className={props.compact ? "space-y-1" : "space-y-4"}>
      <h2 className={props.compact ? "text-13" : "text-18 font-semibold"}>
        Unique Verifications
      </h2>
      <div
        className={
          props.compact ? "text-20 font-semibold" : "text-32 font-semibold"
        }
      >
        {metric.count}
      </div>
      {!props.compact && (
        <div className="flex gap-2">
          {(["last_7_days", "all_time"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={period === item}
              onClick={() => selectPeriod(item)}
            >
              {item === "last_7_days" ? "Last 7 Days" : "All Time"}
            </button>
          ))}
        </div>
      )}
      <svg
        role="img"
        aria-label="Unique Verifications"
        viewBox="0 0 100 40"
        className={props.compact ? "h-10 w-full" : "h-40 w-full"}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const index = Math.min(
            buckets.length - 1,
            Math.max(
              0,
              Math.floor(
                ((event.clientX - rect.left) / rect.width) * buckets.length,
              ),
            ),
          );
          event.currentTarget.setAttribute(
            "aria-description",
            `${formatAnalyticsDateRange(buckets[index].start_date, buckets[index].end_date)}: ${buckets[index].count}`,
          );
        }}
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
          data-flat-zero={
            buckets.every((point) => point.count === "0") ? "true" : undefined
          }
        />
        {buckets.map((bucket) => (
          <title key={bucket.start_date}>
            {formatAnalyticsDateRange(bucket.start_date, bucket.end_date)}:{" "}
            {bucket.count}
          </title>
        ))}
      </svg>
    </section>
  );
}
