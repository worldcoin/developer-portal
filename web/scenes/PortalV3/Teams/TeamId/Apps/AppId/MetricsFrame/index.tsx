"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import {
  filterDailyRows,
  pickDailyRow,
  pickTotalsRow,
  TABLE_COLUMNS_DAILY,
  type DailyChartMetric,
  type DailyRow,
  type DailyTimeframeDays,
  type MetricKind,
  type TotalsRow,
} from "@/lib/selfie-check-analytics";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useEffect, useMemo, useState } from "react";
import {
  DailyMetricChart,
  type DailyMetricChartType,
} from "./DailyMetricChart";
import { TotalsFunnel } from "./TotalsFunnel";
import { TotalsOverview } from "./TotalsOverview";

const REQUEST_TIMEOUT_MS = 8_000;
const ALL_OPERATING_SYSTEMS = "all";

const TIMEFRAME_OPTIONS = [
  { label: "Past 7 days", value: "7", days: 7 },
  { label: "Past 14 days", value: "14", days: 14 },
  { label: "Past 30 days", value: "30", days: 30 },
  { label: "All available", value: "all", days: null },
] as const satisfies readonly {
  label: string;
  value: string;
  days: DailyTimeframeDays;
}[];

type TimeframeValue = (typeof TIMEFRAME_OPTIONS)[number]["value"];

/** Daily columns charted for RPs, in display order, with display titles. */
const CHART_METRICS = [
  {
    metric: "n_users_started_selfie_check_flow",
    label: "Users Starting 1+ Selfie Check",
    title: "Users starting Selfie Check, by day",
    chartType: "bar",
    yAxisLabel: "Number of users",
  },
  {
    metric: "p_face_capture_completion",
    label: "Completion Rate",
    title: "Average face capture completion rate, by day",
    chartType: "line",
    yAxisLabel: "Average completion rate",
  },
  {
    metric: "n_users_shared_a_proof",
    label: "Users Shared 1+ Proof",
    title: "Users sharing a Selfie Check proof, by day",
    chartType: "bar",
    yAxisLabel: "Number of users",
  },
  {
    metric: "cumulative_n_users_shared_a_proof",
    label: "Cumulative users Shared 1+ proof",
    title: "Cumulative unique users who shared a proof, by day",
    chartType: "area",
    yAxisLabel: "Cumulative number of users",
  },
] as const satisfies readonly {
  metric: DailyChartMetric;
  label: string;
  title: string;
  chartType: DailyMetricChartType;
  yAxisLabel: string;
}[];

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

/** Separate lifetime performance from daily exploration without shrinking charts. */
export const MetricsFrame = (props: { appId: string }) => {
  const [daily, setDaily] = useState<DailyState>({ kind: "loading" });
  const [totals, setTotals] = useState<TotalsState>({ kind: "loading" });
  const [timeframe, setTimeframe] = useState<TimeframeValue>("14");
  const [osName, setOsName] = useState(ALL_OPERATING_SYSTEMS);
  const [selectedMetric, setSelectedMetric] = useState<DailyChartMetric>(
    CHART_METRICS[0].metric,
  );
  const activeChart = CHART_METRICS.find(
    ({ metric }) => metric === selectedMetric,
  )!;

  const operatingSystems = useMemo(
    () =>
      daily.kind === "ready"
        ? [...new Set(daily.rows.map((row) => row.os_name))].sort()
        : [],
    [daily],
  );
  const filteredDailyRows = useMemo(() => {
    if (daily.kind !== "ready") return [];
    const timeframeOption = TIMEFRAME_OPTIONS.find(
      (option) => option.value === timeframe,
    );
    return filterDailyRows(daily.rows, {
      days: timeframeOption ? timeframeOption.days : 14,
      osName: osName === ALL_OPERATING_SYSTEMS ? null : osName,
    });
  }, [daily, osName, timeframe]);

  useEffect(() => {
    setDaily({ kind: "loading" });
    setTotals({ kind: "loading" });

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
    <SizingWrapper className="py-6">
      <div className="mx-auto grid w-full max-w-[920px] gap-4">
        <h1 className="font-world text-24 font-semibold text-portal-heading">
          Selfie Check analytics
        </h1>
        <TabGroup>
          <TabList
            aria-label="Analytics views"
            className="flex gap-6 border-b border-portal-border"
          >
            {["All time", "Daily trends"].map((label) => (
              <Tab
                key={label}
                className="-mb-px border-b-2 border-transparent py-3 font-world text-14 font-medium text-portal-muted transition-colors hover:text-portal-heading focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portal-heading aria-selected:border-portal-heading aria-selected:text-portal-heading"
              >
                {label}
              </Tab>
            ))}
          </TabList>
          <TabPanels className="mt-5">
            <TabPanel className="grid gap-4">
              {totals.kind === "ready" ? (
                <>
                  <TotalsOverview row={totals.row} />
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <h2 className="font-world text-14 font-medium text-portal-heading">
                        Session conversion funnel
                      </h2>
                      <p className="font-world text-12 text-portal-muted">
                        Percentages are relative to Selfie Check starts
                      </p>
                    </div>
                    <TotalsFunnel row={totals.row} />
                  </div>
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
            </TabPanel>
            <TabPanel className="grid gap-4">
              <div className="flex flex-wrap items-end justify-end gap-3">
                {daily.kind === "ready" && (
                  <div
                    aria-label="Daily analytics filters"
                    className="flex flex-wrap gap-2"
                  >
                    <label className="grid gap-1 font-world text-11 text-portal-muted sm:flex sm:items-center sm:gap-2">
                      Timeframe
                      <select
                        aria-label="Timeframe"
                        className="h-9 rounded-8 border border-portal-border bg-white px-3 font-world text-13 text-portal-heading"
                        value={timeframe}
                        onChange={(event) =>
                          setTimeframe(event.target.value as TimeframeValue)
                        }
                      >
                        {TIMEFRAME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 font-world text-11 text-portal-muted sm:flex sm:items-center sm:gap-2">
                      Operating system
                      <select
                        aria-label="Operating system"
                        className="h-9 rounded-8 border border-portal-border bg-white px-3 font-world text-13 text-portal-heading"
                        value={osName}
                        onChange={(event) => setOsName(event.target.value)}
                      >
                        <option value={ALL_OPERATING_SYSTEMS}>
                          All systems
                        </option>
                        {operatingSystems.map((operatingSystem) => (
                          <option key={operatingSystem} value={operatingSystem}>
                            {operatingSystem}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
              {daily.kind === "ready" ? (
                <>
                  <div
                    role="group"
                    aria-label="Daily metric"
                    className="grid grid-cols-2 gap-1 rounded-[10px] border border-portal-border bg-grey-50 p-1 sm:grid-cols-4"
                  >
                    {CHART_METRICS.map(({ metric, label }) => (
                      <button
                        key={metric}
                        type="button"
                        aria-pressed={selectedMetric === metric}
                        onClick={() => setSelectedMetric(metric)}
                        className="min-h-9 rounded-[7px] px-3 py-2 font-world text-13 leading-[18px] font-medium text-balance text-portal-muted transition-colors hover:text-portal-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portal-heading aria-pressed:bg-white aria-pressed:text-portal-heading aria-pressed:shadow-sm"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <DailyMetricChart
                    title={activeChart.title}
                    rows={filteredDailyRows}
                    metric={activeChart.metric}
                    kind={metricKind(activeChart.metric)}
                    chartType={activeChart.chartType}
                    yAxisLabel={activeChart.yAxisLabel}
                  />
                </>
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
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </SizingWrapper>
  );
};
