"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import {
  pickDailyRow,
  pickTotalsRow,
  TABLE_COLUMNS_DAILY,
  type DailyChartMetric,
  type DailyRow,
  type MetricKind,
  type TotalsRow,
} from "@/lib/selfie-check-analytics";
import { useEffect, useState } from "react";
import { DailyMetricChart } from "./DailyMetricChart";
import { TotalsFunnel } from "./TotalsFunnel";
import { TotalsOverview } from "./TotalsOverview";

const REQUEST_TIMEOUT_MS = 8_000;

/** Daily columns charted for RPs, in display order, with display titles. */
const CHART_METRICS = [
  {
    metric: "n_users_started_selfie_check_flow",
    title: "# of Selfie Checks Started",
  },
  { metric: "n_proofs", title: "# of Proofs Shared" },
] as const satisfies readonly { metric: DailyChartMetric; title: string }[];

// Eligibility controls the tab and page; these only describe the view's data.
const requestFailureMessage = (scope: string, status: number) => {
  if (status === 404)
    return "Analytics data is not available for this view yet.";
  if (status === 503)
    return "Analytics are temporarily unavailable. Try again shortly.";
  return `${scope} request failed (${status}).`;
};

const metricKind = (metric: DailyChartMetric): MetricKind => {
  const column = TABLE_COLUMNS_DAILY.find((column) => column.key === metric);
  return column && (column.kind === "count" || column.kind === "rate")
    ? column.kind
    : "count";
};

type DailyState =
  | { kind: "loading" }
  | { kind: "ready"; rows: readonly DailyRow[] }
  | { kind: "error"; message: string };

type TotalsState =
  | { kind: "loading" }
  | { kind: "ready"; row: TotalsRow }
  | { kind: "error"; message: string };

const PlaceholderCard = (props: { label: string; message: string }) => (
  <section
    aria-label={props.label}
    className="rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
  >
    <p className="font-world text-13 text-portal-muted">{props.message}</p>
  </section>
);

/** Fetches the app's analytics: overview and funnel above the daily charts. */
export const MetricsFrame = (props: { appId: string }) => {
  const [daily, setDaily] = useState<DailyState>({ kind: "loading" });
  const [totals, setTotals] = useState<TotalsState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort("timeout"),
      REQUEST_TIMEOUT_MS,
    );
    const endpoint = `/api/v2/apps/${encodeURIComponent(props.appId)}/selfie-check-analytics`;
    const requestInit = {
      headers: { Accept: "application/json" },
      credentials: "same-origin" as const,
      signal: controller.signal,
    };

    const abortMessage = (fallback: string) =>
      controller.signal.aborted ? "Analytics request timed out." : fallback;

    const loadDaily = async () => {
      try {
        const response = await fetch(`${endpoint}?table=daily`, requestInit);
        if (!response.ok) {
          if (!active) return;
          setDaily({
            kind: "error",
            message: requestFailureMessage("Daily analytics", response.status),
          });
          return;
        }

        const payload: unknown = await response.json();
        if (!active) return;

        const rawRows =
          typeof payload === "object" &&
          payload !== null &&
          Array.isArray((payload as { rows?: unknown }).rows)
            ? ((payload as { rows: unknown[] }).rows as unknown[])
            : null;
        const rows = rawRows?.map(pickDailyRow) ?? null;

        if (
          !rows ||
          rows.some((row) => row === null || row.appId !== props.appId)
        ) {
          setDaily({
            kind: "error",
            message: "Daily analytics response was malformed.",
          });
          return;
        }

        setDaily({ kind: "ready", rows: rows as DailyRow[] });
      } catch {
        if (!active) return;
        setDaily({
          kind: "error",
          message: abortMessage("Daily analytics request failed."),
        });
      }
    };

    const loadTotals = async () => {
      try {
        const response = await fetch(endpoint, requestInit);
        if (!response.ok) {
          if (!active) return;
          setTotals({
            kind: "error",
            message: requestFailureMessage("Totals", response.status),
          });
          return;
        }

        const payload: unknown = await response.json();
        if (!active) return;

        const row = pickTotalsRow(
          typeof payload === "object" && payload !== null
            ? (payload as { row?: unknown }).row
            : null,
        );

        if (!row || row.appId !== props.appId) {
          setTotals({
            kind: "error",
            message: "Totals response was malformed.",
          });
          return;
        }

        setTotals({ kind: "ready", row });
      } catch {
        if (!active) return;
        setTotals({
          kind: "error",
          message: abortMessage("Totals request failed."),
        });
      }
    };

    void Promise.allSettled([loadDaily(), loadTotals()]).finally(() => {
      window.clearTimeout(timeout);
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [props.appId]);

  return (
    <SizingWrapper className="py-8">
      <div className="grid w-[920px] max-w-full gap-4">
        {totals.kind === "ready" ? (
          <>
            <TotalsOverview row={totals.row} />
            <TotalsFunnel row={totals.row} />
          </>
        ) : (
          <PlaceholderCard
            label="Face Authentication Verification funnel"
            message={
              totals.kind === "loading"
                ? "Loading total analytics…"
                : totals.message
            }
          />
        )}

        {daily.kind === "ready" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {CHART_METRICS.map(({ metric, title }) => (
              <DailyMetricChart
                key={metric}
                title={title}
                rows={daily.rows}
                metric={metric}
                kind={metricKind(metric)}
              />
            ))}
          </div>
        ) : (
          <PlaceholderCard
            label="Daily selfie check charts"
            message={
              daily.kind === "loading"
                ? "Loading daily analytics…"
                : daily.message
            }
          />
        )}
      </div>
    </SizingWrapper>
  );
};
