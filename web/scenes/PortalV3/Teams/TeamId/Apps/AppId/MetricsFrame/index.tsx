"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import {
  DAILY_OS_SERIES,
  filterDailyRows,
  pickDailyRow,
  pickTotalsRow,
  TABLE_COLUMNS_DAILY,
  type DailyChartMetric,
  type DailyRow,
  type MetricKind,
  type TotalsRow,
} from "@/lib/selfie-check-analytics";
import {
  DEFAULT_RANGE,
  PERIOD_NOUN,
  RANGE_OPTIONS,
  rangePeriods,
  TREND_INTERVAL_OPTIONS,
  type TrendInterval,
} from "@/lib/analytics-time-interval";
import { AnalyticsAppEligibility } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { useUser } from "@auth0/nextjs-auth0/client";
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
const MAX_PENDING_VIEW_EVENTS = 100;
const ALL_OPERATING_SYSTEMS = "all";

/** Only one view remains; kept so the tracking event schema is unchanged. */
type AnalyticsView = "selfie_check";
type AnalyticsViewEvent = {
  appId: string;
  teamId: string;
  view: AnalyticsView;
  source: "page_entry";
};

/** Trend metrics in contract order; titles end with ", by <period> and OS". */
const CHART_METRICS = [
  {
    metric: "n_users_started_selfie_check_flow",
    title: "Number of users who started 1+ Selfie Check flow",
    chartType: "bar",
    yAxisLabel: "Number of users",
  },
  {
    metric: "p_face_capture_completion",
    title: "Average Face capture completion rate",
    chartType: "line",
    yAxisLabel: "Average completion rate",
  },
  {
    metric: "n_users_shared_a_proof",
    title: "Number of users who shared 1+ Selfie Check proof",
    chartType: "bar",
    yAxisLabel: "Number of users",
  },
  {
    metric: "cumulative_n_users_shared_a_proof",
    title: "Cumulative unique users who shared 1+ Selfie Check proof",
    chartType: "area",
    yAxisLabel: "Cumulative number of users",
  },
] as const satisfies readonly {
  metric: DailyChartMetric;
  title: string;
  chartType: DailyMetricChartType;
  yAxisLabel: string;
}[];

const analyticsEndpoint = (appId: string) =>
  `/api/v2/apps/${encodeURIComponent(appId)}/selfie-check-analytics`;
const requestInit = (signal: AbortSignal) => ({
  headers: { Accept: "application/json" },
  credentials: "same-origin" as const,
  signal,
});
const intervalLabel = (interval: TrendInterval) =>
  TREND_INTERVAL_OPTIONS.find((option) => option.value === interval)?.label ??
  "Daily";
const chartTitle = (title: string, interval: TrendInterval) =>
  `${title}, by ${PERIOD_NOUN[interval]} and OS`;

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

type ReadyDailyState = Extract<DailyState, { kind: "ready" }>;

/** One period table per interval, scoped to the app they were fetched for. */
type PeriodTablesState = {
  appId: string;
  tables: Record<TrendInterval, DailyState>;
};

const LOADING_PERIOD_TABLES: PeriodTablesState["tables"] = {
  daily: { kind: "loading" },
  weekly: { kind: "loading" },
  monthly: { kind: "loading" },
};

type TotalsState =
  | { kind: "loading" }
  | { kind: "ready"; row: TotalsRow; isFallback: boolean }
  | { kind: "absent"; message: string }
  | { kind: "error"; message: string };

const PlaceholderCard = (props: { label: string; message: string }) => (
  <section
    aria-label={props.label}
    className="rounded-16 border border-portal-border bg-surface p-5 sm:p-6"
  >
    <p className="font-world text-13 text-portal-muted">{props.message}</p>
  </section>
);

type FilterOption = Readonly<{ label: string; value: string }>;

const AnalyticsFilterSelect = (props: {
  ariaLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly FilterOption[];
  value: string;
}) => {
  const selectedLabel =
    props.options.find((option) => option.value === props.value)?.label ??
    props.value;

  return (
    <div className="grid gap-1 font-world text-13 text-portal-heading sm:flex sm:items-center sm:gap-2">
      <span>{props.label}</span>
      <Select value={props.value} onChange={props.onChange}>
        <SelectButton
          aria-label={props.ariaLabel}
          data-value={props.value}
          role="combobox"
          className="group flex h-9 min-w-[132px] items-center justify-between gap-3 rounded-8 border border-portal-border bg-surface px-3 text-left font-world text-[12px] leading-4 text-portal-heading transition-colors hover:border-portal-muted focus-visible:border-portal-heading focus-visible:ring-2 focus-visible:ring-portal-border/70 focus-visible:outline-none"
        >
          <span className="truncate">{selectedLabel}</span>
          <CaretIcon className="size-3.5 shrink-0 text-portal-muted transition-transform group-aria-expanded:rotate-180" />
        </SelectButton>
        <SelectOptions className="mt-2 max-h-64 rounded-12 border-portal-border bg-surface p-1 shadow-portal-card">
          {props.options.map((option) => (
            <SelectOption
              key={option.value}
              value={option.value}
              className="rounded-8 px-3 py-2 font-world text-[12px] leading-4 text-portal-heading data-[focus]:bg-portal-canvas data-[headlessui-state*=selected]:bg-portal-canvas data-[headlessui-state*=selected]:text-portal-heading"
            >
              {option.label}
            </SelectOption>
          ))}
        </SelectOptions>
      </Select>
    </div>
  );
};

const DailyAnalyticsFilters = (props: {
  ariaLabel: string;
  operatingSystems: readonly string[];
  osName: string;
  range: string;
  setOsName: (value: string) => void;
  setRange: (value: string) => void;
  setTrendInterval: (value: TrendInterval) => void;
  trendInterval: TrendInterval;
}) => (
  <div
    aria-label={props.ariaLabel}
    className="flex flex-wrap justify-start gap-x-5 gap-y-3"
  >
    {/* Interval first: the date-range presets are expressed in its unit. */}
    <AnalyticsFilterSelect
      ariaLabel="Time interval"
      label="Time interval"
      onChange={(value) => props.setTrendInterval(value as TrendInterval)}
      options={TREND_INTERVAL_OPTIONS}
      value={props.trendInterval}
    />
    <AnalyticsFilterSelect
      ariaLabel="Timeframe"
      label="Date range"
      onChange={props.setRange}
      options={RANGE_OPTIONS[props.trendInterval]}
      value={props.range}
    />
    <AnalyticsFilterSelect
      ariaLabel="Operating System"
      label="Operating system"
      onChange={props.setOsName}
      options={[
        { label: "All", value: ALL_OPERATING_SYSTEMS },
        ...props.operatingSystems.map((operatingSystem) => ({
          label: operatingSystem,
          value: operatingSystem,
        })),
      ]}
      value={props.osName}
    />
  </div>
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
  // Each interval reads its own warehouse table; tables stay cached per app so
  // switching back is instant. The ref lets the fetch effect skip cached tables
  // without depending on the state itself.
  const [periodTables, setPeriodTables] = useState<PeriodTablesState>({
    appId: props.appId,
    tables: LOADING_PERIOD_TABLES,
  });
  const periodTablesRef = useRef(periodTables);
  periodTablesRef.current = periodTables;
  const [totals, setTotals] = useState<TotalsState>({ kind: "loading" });
  const [osName, setOsName] = useState(ALL_OPERATING_SYSTEMS);
  const [trendInterval, setTrendInterval] = useState<TrendInterval>("daily");
  const [range, setRange] = useState(DEFAULT_RANGE.daily);
  const daily: DailyState =
    periodTables.appId === props.appId
      ? periodTables.tables[trendInterval]
      : { kind: "loading" };
  const readyPeriodTables = useMemo(
    () =>
      periodTables.appId === props.appId
        ? Object.values(periodTables.tables).filter(
            (table): table is ReadyDailyState => table.kind === "ready",
          )
        : [],
    [periodTables, props.appId],
  );
  // A range only makes sense in its interval's unit, so switching resets it.
  const changeTrendInterval = useCallback((interval: TrendInterval) => {
    setTrendInterval(interval);
    setRange(DEFAULT_RANGE[interval]);
  }, []);
  const teamId = useParams<{ teamId?: string }>()?.teamId;
  // useUser already shares the session/preference through Auth0's SWR cache.
  const { user, isLoading, error: authError } = useUser();
  const allowTracking = user?.hasura?.is_allow_tracking === true;
  const selectedView = useRef<AnalyticsView>("selfie_check");
  const lastPageEntry = useRef<string | null>(null);
  const pendingViews = useRef<AnalyticsViewEvent[]>([]);
  const overflowReported = useRef(false);
  const readyUser = useRef<typeof user>(undefined);
  const account = useRef({ subject: user?.sub, resolved: !isLoading });

  const flushViews = useCallback(() => {
    if (isLoading && !authError) return;
    // Remove before sending: SDK failures must not cause duplicate retries.
    const events = pendingViews.current.splice(0);
    overflowReported.current = false;
    if (!events.length) return;
    try {
      if (authError) {
        console.warn("Discarded analytics views after authentication failed", {
          dependency: "auth0",
          failureClass: authError.name,
          eventCount: events.length,
        });
        return;
      }
      if (
        !allowTracking ||
        process.env.NEXT_PUBLIC_POSTHOG_DISABLED === "true" ||
        posthog.has_opted_out_capturing()
      )
        return;
      for (const properties of events) {
        posthog.capture("selfie_check_analytics_view_selected", properties);
      }
    } catch (error) {
      // Telemetry must never prevent entry or tab navigation.
      console.warn("Failed to capture analytics view selection", {
        dependency: "posthog",
        failureClass: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }, [allowTracking, authError, isLoading]);

  const captureView = useCallback(
    (source: AnalyticsViewEvent["source"]) => {
      try {
        // Initial resolution owns early clicks; later account changes do not.
        if (account.current.resolved && account.current.subject !== user?.sub) {
          pendingViews.current = [];
          lastPageEntry.current = null;
          overflowReported.current = false;
          readyUser.current = undefined;
        }
        account.current = {
          subject: user?.sub,
          resolved: account.current.resolved || !isLoading || !!authError,
        };
        const discard =
          !!authError ||
          (!isLoading && !allowTracking) ||
          process.env.NEXT_PUBLIC_POSTHOG_DISABLED === "true";
        if (discard) {
          if (authError) flushViews();
          pendingViews.current = [];
          overflowReported.current = false;
        }
        if (!teamId) return;
        const enqueue = (
          view: AnalyticsView,
          source: AnalyticsViewEvent["source"],
        ) => {
          const properties = { appId: props.appId, teamId, view, source };
          if (process.env.NODE_ENV === "development") {
            console.info(
              "[analytics] selfie_check_analytics_view_selected (local preview)",
              properties,
            );
          }
          if (discard) return;
          if (pendingViews.current.length < MAX_PENDING_VIEW_EVENTS) {
            pendingViews.current.push(properties);
          } else if (!overflowReported.current) {
            overflowReported.current = true;
            console.warn("Analytics view queue full; dropping new selections", {
              dependency: "auth0",
              failureClass: "PendingQueueOverflow",
              limit: MAX_PENDING_VIEW_EVENTS,
            });
          }
        };
        const entry = `${teamId}:${props.appId}`;
        if (lastPageEntry.current !== entry) {
          lastPageEntry.current = entry;
          enqueue(selectedView.current, "page_entry");
        }
        if (readyUser.current === user) flushViews();
      } catch (error) {
        console.warn("Failed to queue analytics view selection", {
          dependency: "posthog",
          failureClass: error instanceof Error ? error.name : "UnknownError",
        });
      }
    },
    [
      props.appId,
      teamId,
      user,
      isLoading,
      authError,
      allowTracking,
      flushViews,
    ],
  );

  useEffect(() => {
    captureView("page_entry");
    let active = true;
    // Let the ancestor provider reconcile identity/consent before draining.
    queueMicrotask(() => {
      if (!active || isLoading) return;
      readyUser.current = user;
      flushViews();
    });
    return () => {
      active = false;
      readyUser.current = undefined;
    };
  }, [captureView, flushViews, isLoading, user]);

  // Any loaded table decides which OS options exist, so the filter bar stays
  // put while another interval is still loading.
  const operatingSystems = useMemo(
    () =>
      DAILY_OS_SERIES.filter(
        ({ osName }) =>
          osName !== "Unknown" &&
          readyPeriodTables.some((table) =>
            table.rows.some((row) => row.os_name === osName),
          ),
      ).map(({ osName }) => osName),
    [readyPeriodTables],
  );
  const periods = rangePeriods(trendInterval, range);
  const filteredDailyRows = useMemo(() => {
    if (daily.kind !== "ready") return [];
    return filterDailyRows(
      daily.rows.filter((row) => row.os_name !== "Unknown"),
      {
        interval: trendInterval,
        periods,
        osName: osName === ALL_OPERATING_SYSTEMS ? null : osName,
      },
    );
  }, [daily, osName, periods, trendInterval]);

  // Totals load once per app; the same effect resets the period-table cache.
  useEffect(() => {
    const appId = props.appId;
    setTotals({ kind: "loading" });
    setPeriodTables({ appId, tables: LOADING_PERIOD_TABLES });

    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort("timeout"),
      REQUEST_TIMEOUT_MS,
    );

    const loadTotals = async () => {
      try {
        const response = await fetch(
          analyticsEndpoint(appId),
          requestInit(controller.signal),
        );
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

        if (!row || row.appId !== appId) {
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
          message: controller.signal.aborted
            ? "Analytics request timed out."
            : "Totals request failed.",
        });
      }
    };

    void loadTotals().finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [props.appId]);

  // The selected interval's table loads on demand and is cached for the app.
  // A table that is not "ready" (mid-flight switch, error, or 403) is fetched
  // again the next time this effect runs for it: switching to another interval
  // and back, or a page reload. Reselecting the already selected interval is a
  // no-op, so it does not retry.
  useEffect(() => {
    const appId = props.appId;
    const table = trendInterval;
    const cached = periodTablesRef.current;
    if (cached.appId === appId && cached.tables[table].kind === "ready") return;

    const setTable = (state: DailyState) =>
      setPeriodTables((current) => ({
        appId,
        tables: {
          ...(current.appId === appId ? current.tables : LOADING_PERIOD_TABLES),
          [table]: state,
        },
      }));
    const scope = `${intervalLabel(table)} analytics`;

    setTable({ kind: "loading" });
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort("timeout"),
      REQUEST_TIMEOUT_MS,
    );

    const loadTable = async () => {
      try {
        const response = await fetch(
          `${analyticsEndpoint(appId)}?table=${table}`,
          requestInit(controller.signal),
        );
        if (!response.ok) {
          if (!active) return;
          setTable({
            kind: response.status === 403 ? "absent" : "error",
            message: requestFailureMessage(scope, response.status),
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

        if (!rows || rows.some((row) => row === null || row.appId !== appId)) {
          setTable({
            kind: "error",
            message: `${scope} response was malformed.`,
          });
          return;
        }

        setTable({
          kind: "ready",
          rows: rows as DailyRow[],
          isFallback: isFallbackResponse(payload),
        });
      } catch {
        if (!active) return;
        setTable({
          kind: "error",
          message: controller.signal.aborted
            ? "Analytics request timed out."
            : `${scope} request failed.`,
        });
      }
    };

    void loadTable().finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [props.appId, trendInterval]);

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
            Analytics
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
        <section className="space-y-4" aria-labelledby="selfie-check-all-time">
          <h2
            id="selfie-check-all-time"
            className="font-world text-18 font-semibold text-portal-heading"
          >
            All time
          </h2>
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
        </section>
        <section className="space-y-4" aria-labelledby="selfie-check-trends">
          <div className="space-y-4">
            <h2
              id="selfie-check-trends"
              className="font-world text-18 font-semibold text-portal-heading"
            >
              Trends
            </h2>
            {/* Also shown on error: the interval picker is the only way to
                reach a healthy weekly or monthly table without a reload. */}
            {(readyPeriodTables.length > 0 || daily.kind === "error") && (
              <DailyAnalyticsFilters
                ariaLabel="Selfie Check daily analytics filters"
                operatingSystems={operatingSystems}
                osName={osName}
                range={range}
                setOsName={setOsName}
                setRange={setRange}
                setTrendInterval={changeTrendInterval}
                trendInterval={trendInterval}
              />
            )}
          </div>
          {/* Keep the same chart shells mounted across loading/error states
              (message swaps in for the plotted data) instead of unmounting
              to a shorter placeholder — that collapse used to yank the page
              back to the top whenever the interval filter changed. */}
          <section
            aria-label="Daily Selfie Check charts"
            className="grid min-w-0 gap-6 lg:grid-cols-2"
          >
            {CHART_METRICS.map((chart, index) => (
              <DailyMetricChart
                key={chart.metric}
                title={chartTitle(chart.title, trendInterval)}
                rows={daily.kind === "ready" ? filteredDailyRows : []}
                metric={chart.metric}
                kind={metricKind(chart.metric)}
                chartType={chart.chartType}
                timeInterval={trendInterval}
                yAxisLabel={chart.yAxisLabel}
                emptyMessage={
                  daily.kind === "ready"
                    ? undefined
                    : index === 0
                      ? daily.kind === "loading"
                        ? `Loading ${intervalLabel(trendInterval).toLowerCase()} analytics…`
                        : daily.message
                      : " "
                }
              />
            ))}
          </section>
        </section>
      </div>
    </SizingWrapper>
  );
};
