"use client";

import {
  bucketAllTimeSeries,
  formatAnalyticsDate,
  formatAnalyticsDateRange,
  type AnalyticsPoint,
} from "@/lib/world-id-analytics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PeriodSelector, type AnalyticsPeriod } from "./PeriodSelector";
import { Sparkline } from "./Sparkline";

type Metric = { count: string; series: AnalyticsPoint[] };
type Response = {
  period: AnalyticsPeriod;
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
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("last_7_days");
  const [cache, setCache] = useState<
    Partial<Record<AnalyticsPeriod, Response>>
  >({});
  const [error, setError] = useState(false);
  const mounted = useRef(true);
  const periodRef = useRef(period);
  periodRef.current = period;

  const load = useCallback(
    async (requestedPeriod: AnalyticsPeriod) => {
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

  const selectPeriod = (next: AnalyticsPeriod) => {
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

  const grouped = period === "all_time";
  const buckets = grouped
    ? bucketAllTimeSeries(metric.series)
    : metric.series.map((point) => ({
        start_date: point.date,
        end_date: point.date,
        count: point.count,
      }));
  const sparkPoints = buckets.map((bucket) => ({
    count: bucket.count,
    label: grouped
      ? formatAnalyticsDateRange(bucket.start_date, bucket.end_date)
      : formatAnalyticsDate(bucket.start_date),
  }));

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-world text-13 font-normal text-portal-muted">
            Unique Verifications
          </h2>
          <div className="font-twk text-[32px] leading-none font-medium tracking-[-0.01em] text-portal-heading">
            {BigInt(metric.count).toLocaleString()}
          </div>
        </div>
        <PeriodSelector period={period} onPeriodChange={selectPeriod} />
      </div>
      <Sparkline
        points={sparkPoints}
        ariaLabel="Unique Verifications"
        className="h-40 w-full text-portal-heading"
      />
    </section>
  );
}
