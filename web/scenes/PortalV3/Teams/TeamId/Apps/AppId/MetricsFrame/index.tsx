"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import {
  DAILY_OS_SERIES,
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
import { AnalyticsAppEligibility } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  { label: "All time", value: "all", days: null },
] as const satisfies readonly {
  label: string;
  value: string;
  days: DailyTimeframeDays;
}[];

type TimeframeValue = (typeof TIMEFRAME_OPTIONS)[number]["value"];
type AnalyticsView = "totals" | "daily";

/** Daily metrics displayed in the same order as the analytics contract. */
const CHART_METRICS = [
  {
    metric: "n_users_started_selfie_check_flow",
    title: "Number of users who started 1+ Selfie Check flow, by day and OS",
    chartType: "bar",
    yAxisLabel: "Number of users",
  },
  {
    metric: "p_face_capture_completion",
    title: "Average Face capture completion rate, by day and OS",
    chartType: "line",
    yAxisLabel: "Average completion rate",
  },
  {
    metric: "n_users_shared_a_proof",
    title: "Number of users who shared 1+ Selfie Check proof, by day and OS",
    chartType: "bar",
    yAxisLabel: "Number of users",
  },
  {
    metric: "cumulative_n_users_shared_a_proof",
    title:
      "Cumulative unique users who shared 1+ Selfie Check proof, by day and OS",
    chartType: "area",
    yAxisLabel: "Cumulative number of users",
  },
] as const satisfies readonly {
  metric: DailyChartMetric;
  title: string;
  chartType: DailyMetricChartType;
  yAxisLabel: string;
}[];

// Eligibility controls access to the page; these only describe the view's data.
const requestFailureMessage = (scope: string, status: number) => {
  if (status === 403)
    return "Selfie Check analytics aren't available for this app yet. Contact us to learn more.";
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
  | { kind: "ready"; rows: readonly DailyRow[]; isFallback: boolean }
  | { kind: "absent" | "error"; message: string };

type TotalsState =
  | { kind: "loading" }
  | { kind: "ready"; row: TotalsRow; isFallback: boolean }
  | { kind: "absent"; message: string }
  | { kind: "error"; message: string };

const PlaceholderCard = (props: { label: string; message: string }) => (
  <section
    aria-label={props.label}
    className="rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
  >
    <p className="font-world text-13 text-portal-muted">{props.message}</p>
  </section>
);

const isFallbackResponse = (payload: unknown): boolean =>
  typeof payload === "object" &&
  payload !== null &&
  (payload as { snapshotMetadata?: { isFallback?: unknown } }).snapshotMetadata
    ?.isFallback === true;

/** Separates lifetime performance from daily exploration in the two view tabs. */
export const MetricsFrame = (props: {
  appId: string;
  initialIsFallback?: boolean;
}) => {
  const [daily, setDaily] = useState<DailyState>({ kind: "loading" });
  const [totals, setTotals] = useState<TotalsState>({ kind: "loading" });
  const [timeframe, setTimeframe] = useState<TimeframeValue>("14");
  const [osName, setOsName] = useState(ALL_OPERATING_SYSTEMS);
  const teamId = useParams<{ teamId?: string }>()?.teamId;
  const selectedView = useRef<AnalyticsView>("totals");
  const lastPageEntry = useRef<string | null>(null);

  const captureView = useCallback(
    (view: AnalyticsView, source: "page_entry" | "tab_switch") => {
      try {
        if (
          !teamId ||
          process.env.NEXT_PUBLIC_POSTHOG_DISABLED === "true" ||
          posthog.has_opted_out_capturing()
        )
          return;
        posthog.capture("selfie_check_analytics_view_selected", {
          appId: props.appId,
          teamId,
          view,
          source,
        });
      } catch (error) {
        // Telemetry must never prevent entry or tab navigation.
        console.warn("Failed to capture analytics view selection", {
          dependency: "posthog",
          failureClass: error instanceof Error ? error.name : "UnknownError",
        });
      }
    },
    [props.appId, teamId],
  );

  useEffect(() => {
    if (!teamId) return;
    const entry = `${teamId}:${props.appId}`;
    if (lastPageEntry.current === entry) return;
    // Preserve the guard through Strict Mode effect replay, not real remounts.
    lastPageEntry.current = entry;
    captureView(selectedView.current, "page_entry");
  }, [props.appId, teamId, captureView]);

  const operatingSystems = useMemo(
    () =>
      daily.kind === "ready"
        ? DAILY_OS_SERIES.filter(({ osName }) =>
            daily.rows.some((row) => row.os_name === osName),
          ).map(({ osName }) => osName)
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
            kind: response.status === 403 ? "absent" : "error",
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

        setDaily({
          kind: "ready",
          rows: rows as DailyRow[],
          isFallback: isFallbackResponse(payload),
        });
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
            kind:
              response.status === 403 || response.status === 404
                ? "absent"
                : "error",
            message:
              response.status === 404
                ? "Analytics not found."
                : requestFailureMessage("Totals", response.status),
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

        setTotals({
          kind: "ready",
          row,
          isFallback: isFallbackResponse(payload),
        });
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
    <SizingWrapper
      className="py-6"
      gridClassName="grid-cols-[minmax(24px,1fr)_minmax(0,1120px)_minmax(24px,1fr)]"
    >
      {(totals.kind === "absent" || daily.kind === "absent") && (
        <AnalyticsAppEligibility appId={props.appId} enabled={false} />
      )}
      <div className="mx-auto w-full max-w-[1120px] space-y-6">
        <div className="space-y-2">
          <h1 className="font-world text-24 font-semibold text-portal-heading">
            Selfie Check analytics
          </h1>
          <div className="font-world text-12 text-portal-muted">
            * Data updates every hour
          </div>
          {((totals.kind === "ready"
            ? totals.isFallback
            : totals.kind !== "absent" && props.initialIsFallback) ||
            (daily.kind === "ready" && daily.isFallback)) && (
            <p role="status" className="font-world text-13 text-portal-muted">
              Analytics may be out of date. A refresh failed; showing the last
              verified data.
            </p>
          )}
        </div>
        <TabGroup
          onChange={(index) => {
            const view = index === 0 ? "totals" : "daily";
            if (selectedView.current === view) return;
            selectedView.current = view;
            captureView(view, "tab_switch");
          }}
        >
          <TabList
            aria-label="Analytics views"
            className="flex gap-6 border-b border-portal-border"
          >
            {["All time", "Daily trends"].map((label) => (
              <Tab
                key={label}
                className="-mb-px border-b-2 border-transparent py-3 font-world text-14 font-medium text-portal-muted transition-colors outline-none hover:text-portal-heading aria-selected:border-portal-heading aria-selected:text-portal-heading data-focus:rounded-sm data-focus:outline-2 data-focus:outline-offset-4 data-focus:outline-portal-heading data-focus:outline-solid"
              >
                {label}
              </Tab>
            ))}
          </TabList>
          <TabPanels className="mt-4">
            <TabPanel className="space-y-4 outline-none">
              {totals.kind === "ready" ? (
                <div className="space-y-4">
                  <TotalsOverview row={totals.row} />
                  <div className="space-y-3">
                    <h3 className="font-world text-14 font-medium text-portal-heading">
                      Session conversion funnel
                    </h3>
                    <TotalsFunnel row={totals.row} />
                  </div>
                </div>
              ) : (
                <PlaceholderCard
                  label="Selfie Check funnel"
                  message={
                    totals.kind === "loading"
                      ? "Loading total analytics…"
                      : totals.message
                  }
                />
              )}
            </TabPanel>
            <TabPanel className="space-y-4 outline-none">
              {daily.kind === "ready" && (
                <div
                  aria-label="Daily analytics filters"
                  className="flex flex-wrap justify-start gap-2"
                >
                  <label className="grid gap-1 font-world text-13 text-portal-heading sm:flex sm:items-center sm:gap-2">
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
                  <label className="grid gap-1 font-world text-13 text-portal-heading sm:flex sm:items-center sm:gap-2">
                    Operating System
                    <select
                      aria-label="Operating System"
                      className="h-9 rounded-8 border border-portal-border bg-white px-3 font-world text-13 text-portal-heading"
                      value={osName}
                      onChange={(event) => setOsName(event.target.value)}
                    >
                      <option value={ALL_OPERATING_SYSTEMS}>All</option>
                      {operatingSystems.map((operatingSystem) => (
                        <option key={operatingSystem} value={operatingSystem}>
                          {operatingSystem}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              {daily.kind === "ready" ? (
                <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                  {CHART_METRICS.map((chart) => (
                    <DailyMetricChart
                      key={chart.metric}
                      title={chart.title}
                      rows={filteredDailyRows}
                      metric={chart.metric}
                      kind={metricKind(chart.metric)}
                      chartType={chart.chartType}
                      yAxisLabel={chart.yAxisLabel}
                    />
                  ))}
                </div>
              ) : (
                <PlaceholderCard
                  label="Daily Selfie Check charts"
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
