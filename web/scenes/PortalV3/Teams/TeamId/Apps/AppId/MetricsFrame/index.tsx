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
import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import { DailyMetricChart } from "./DailyMetricChart";

const REQUEST_TIMEOUT_MS = 8_000;

/** Daily columns charted for RPs, in display order. */
const CHART_METRICS = [
  "n_users_started_selfie_check_flow",
  "n_proofs",
] as const satisfies readonly DailyChartMetric[];

/** Totals stat tiles, in display order. */
const TOTAL_TILES = [
  { key: "n_proofs", label: "Proofs", kind: "count" },
  {
    key: "n_users_started_selfie_check_flow",
    label: "Users started selfie check",
    kind: "count",
  },
  {
    key: "n_proof_users",
    label: "Users completed selfie check",
    kind: "count",
  },
  {
    key: "p_face_auth_completion",
    label: "Face auth completion",
    kind: "rate",
  },
] as const satisfies readonly {
  key: keyof Omit<TotalsRow, "appId">;
  label: string;
  kind: MetricKind;
}[];

const countFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatTileValue = (value: number | null, kind: MetricKind) => {
  if (typeof value !== "number") return "—";
  return kind === "rate"
    ? percentFormatter.format(value)
    : countFormatter.format(value);
};

const chartSpec = (metric: DailyChartMetric) => {
  const column = TABLE_COLUMNS_DAILY.find((column) => column.key === metric);
  const kind: MetricKind =
    column && (column.kind === "count" || column.kind === "rate")
      ? column.kind
      : "count";
  return {
    title: column?.label ?? metric,
    kind,
  };
};

type MetricsView = "daily" | "total";

type DailyState =
  | { kind: "loading" }
  | { kind: "ready"; rows: readonly DailyRow[] }
  | { kind: "error"; message: string };

type TotalsState =
  | { kind: "loading" }
  | { kind: "ready"; row: TotalsRow }
  | { kind: "error"; message: string };

const PillButton = (props: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={props.active}
    onClick={props.onClick}
    className={clsx(
      "rounded-full border px-4 py-1.5 font-world text-13 transition-colors",
      props.active
        ? "border-portal-ink bg-portal-ink text-white"
        : "border-portal-border bg-white text-portal-muted hover:text-portal-ink",
    )}
  >
    {props.children}
  </button>
);

const PlaceholderCard = (props: { label: string; message: string }) => (
  <section
    aria-label={props.label}
    className="rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
  >
    <p className="font-world text-13 text-portal-muted">{props.message}</p>
  </section>
);

/** Fetches the app's analytics and renders daily charts or totals tiles. */
export const MetricsFrame = (props: { appId: string }) => {
  const [view, setView] = useState<MetricsView>("daily");
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
            message: `Daily analytics request failed (${response.status}).`,
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
            message: `Totals request failed (${response.status}).`,
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
        <div className="flex gap-2" role="group" aria-label="Metrics view">
          <PillButton
            active={view === "daily"}
            onClick={() => setView("daily")}
          >
            Daily metrics
          </PillButton>
          <PillButton
            active={view === "total"}
            onClick={() => setView("total")}
          >
            Total metrics
          </PillButton>
        </div>

        {view === "daily" &&
          (daily.kind === "ready" ? (
            <div className="flex flex-wrap gap-4">
              {CHART_METRICS.map((metric) => {
                const { title, kind } = chartSpec(metric);
                return (
                  <DailyMetricChart
                    key={metric}
                    title={title}
                    rows={daily.rows}
                    metric={metric}
                    kind={kind}
                  />
                );
              })}
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
          ))}

        {view === "total" &&
          (totals.kind === "ready" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {TOTAL_TILES.map((tile) => (
                <section
                  key={tile.key}
                  aria-label={tile.label}
                  className="flex min-h-[144px] flex-col justify-between rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
                >
                  <p className="font-world text-13 text-portal-muted">
                    {tile.label}
                  </p>
                  <p className="font-world text-32 leading-none font-medium text-portal-heading">
                    {formatTileValue(totals.row[tile.key], tile.kind)}
                  </p>
                </section>
              ))}
            </div>
          ) : (
            <PlaceholderCard
              label="Total selfie check metrics"
              message={
                totals.kind === "loading"
                  ? "Loading total analytics…"
                  : totals.message
              }
            />
          ))}
      </div>
    </SizingWrapper>
  );
};
