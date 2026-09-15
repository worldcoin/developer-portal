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
  groupDailyRowsByInterval,
  pickDailyRow,
  pickTotalsRow,
  TABLE_COLUMNS_DAILY,
  type DailyChartMetric,
  type DailyRow,
  type DailyTimeframeDays,
  type MetricKind,
  type TotalsRow,
} from "@/lib/selfie-check-analytics";
import {
  filterProofsDailyRows,
  groupProofsDailyRowsByInterval,
  PROOF_TYPE_ORDER,
  proofsAnalyticsPreview,
  type ProofsDailyMetric,
  type ProofsDimension,
} from "@/lib/proofs-analytics";
import {
  TREND_INTERVAL_OPTIONS,
  type TrendInterval,
} from "@/lib/analytics-time-interval";
import { AnalyticsAppEligibility } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DailyMetricChart,
  type DailyMetricChartType,
} from "./DailyMetricChart";
import { ProofsMetricChart } from "./ProofsMetricChart";
import { ProofsTotalsOverview } from "./ProofsTotalsOverview";
import { TotalsFunnel } from "./TotalsFunnel";
import { TotalsOverview } from "./TotalsOverview";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_PENDING_VIEW_EVENTS = 100;
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
type AnalyticsView = "proofs" | "selfie_check";
type AnalyticsViewEvent = {
  appId: string;
  teamId: string;
  view: AnalyticsView;
  source: "page_entry" | "tab_switch";
};

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

const PROOFS_USER_CHARTS = [
  {
    metric: "nUsersSharedProof",
    dimension: "proofType",
    title: "Number of users who shared 1+ proof, by day and proof type",
  },
  {
    metric: "cumulativeUniqueUsersSharedProof",
    dimension: "proofType",
    title:
      "Cumulative number of unique users who shared 1+ proof, by day and proof type",
  },
  {
    metric: "nUsersSharedProof",
    dimension: "osName",
    title: "Number of users who shared 1+ proof, by day and OS",
  },
  {
    metric: "cumulativeUniqueUsersSharedProof",
    dimension: "osName",
    title:
      "Cumulative number of unique users who shared 1+ proof, by day and OS",
  },
] as const satisfies readonly {
  metric: ProofsDailyMetric;
  dimension: ProofsDimension;
  title: string;
}[];

const PROOFS_SHARED_CHARTS = [
  {
    dimension: "proofType",
    title: "Number of proofs shared, by day and proof type",
  },
  {
    dimension: "osName",
    title: "Number of proofs shared, by day and OS",
  },
] as const satisfies readonly {
  dimension: ProofsDimension;
  title: string;
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
    className="rounded-16 border border-portal-border bg-white p-5 sm:p-6"
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
          className="group flex h-9 min-w-[132px] items-center justify-between gap-3 rounded-8 border border-portal-border bg-white px-3 text-left font-world text-[12px] leading-4 text-portal-heading transition-colors hover:border-portal-muted focus-visible:border-portal-heading focus-visible:ring-2 focus-visible:ring-portal-border/70 focus-visible:outline-none"
        >
          <span className="truncate">{selectedLabel}</span>
          <CaretIcon className="size-3.5 shrink-0 text-portal-muted transition-transform group-aria-expanded:rotate-180" />
        </SelectButton>
        <SelectOptions className="mt-2 max-h-64 rounded-12 border-portal-border bg-white p-1 shadow-portal-card">
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
  proofType?: string;
  proofTypes?: readonly string[];
  setOsName: (value: string) => void;
  setProofType?: (value: string) => void;
  setTimeframe: (value: TimeframeValue) => void;
  setTrendInterval: (value: TrendInterval) => void;
  timeframe: TimeframeValue;
  trendInterval: TrendInterval;
}) => (
  <div
    aria-label={props.ariaLabel}
    className="flex flex-wrap justify-start gap-x-5 gap-y-3"
  >
    <AnalyticsFilterSelect
      ariaLabel="Timeframe"
      label="Date range"
      onChange={(value) => props.setTimeframe(value as TimeframeValue)}
      options={TIMEFRAME_OPTIONS}
      value={props.timeframe}
    />
    <AnalyticsFilterSelect
      ariaLabel="Time interval"
      label="Time interval"
      onChange={(value) => props.setTrendInterval(value as TrendInterval)}
      options={TREND_INTERVAL_OPTIONS}
      value={props.trendInterval}
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
    {props.proofTypes &&
      props.proofType !== undefined &&
      props.setProofType && (
        <AnalyticsFilterSelect
          ariaLabel="Proof type"
          label="Proof type"
          onChange={props.setProofType}
          options={[
            { label: "All", value: "all" },
            ...props.proofTypes.map((proofType) => ({
              label: proofType,
              value: proofType,
            })),
          ]}
          value={props.proofType}
        />
      )}
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
  previewData?: Readonly<{
    totals: TotalsRow;
    daily: readonly DailyRow[];
  }>;
}) => {
  const [daily, setDaily] = useState<DailyState>(() =>
    props.previewData
      ? {
          kind: "ready",
          rows: props.previewData.daily,
          isFallback: false,
        }
      : { kind: "loading" },
  );
  const [totals, setTotals] = useState<TotalsState>(() =>
    props.previewData
      ? {
          kind: "ready",
          row: props.previewData.totals,
          isFallback: false,
        }
      : { kind: "loading" },
  );
  const [timeframe, setTimeframe] = useState<TimeframeValue>("14");
  const [osName, setOsName] = useState(ALL_OPERATING_SYSTEMS);
  const [proofType, setProofType] = useState("all");
  const [trendInterval, setTrendInterval] = useState<TrendInterval>("daily");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLElement | null>>([]);
  const teamId = useParams<{ teamId?: string }>()?.teamId;
  // useUser already shares the session/preference through Auth0's SWR cache.
  const { user, isLoading, error: authError } = useUser();
  const allowTracking = user?.hasura?.is_allow_tracking === true;
  const selectedView = useRef<AnalyticsView>("proofs");
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
    (view: AnalyticsView, source: AnalyticsViewEvent["source"]) => {
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
        if (source === "tab_switch") enqueue(view, source);
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
    captureView(selectedView.current, "page_entry");
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

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const tabList = tabListRef.current;
      const selectedTab = tabRefs.current[selectedTabIndex];
      if (!tabList || !selectedTab) return;

      const listRect = tabList.getBoundingClientRect();
      const tabRect = selectedTab.getBoundingClientRect();
      setTabIndicator({
        left: tabRect.left - listRect.left,
        width: tabRect.width,
      });
    };

    updateIndicator();
    const observer = new ResizeObserver(updateIndicator);
    if (tabListRef.current) observer.observe(tabListRef.current);
    window.addEventListener("resize", updateIndicator);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [selectedTabIndex]);

  const operatingSystems = useMemo(
    () =>
      DAILY_OS_SERIES.filter(
        ({ osName }) =>
          (osName !== "Unknown" &&
            daily.kind === "ready" &&
            daily.rows.some((row) => row.os_name === osName)) ||
          proofsAnalyticsPreview.daily.some((row) => row.osName === osName),
      ).map(({ osName }) => osName),
    [daily],
  );
  const filteredDailyRows = useMemo(() => {
    if (daily.kind !== "ready") return [];
    const timeframeOption = TIMEFRAME_OPTIONS.find(
      (option) => option.value === timeframe,
    );
    return groupDailyRowsByInterval(
      filterDailyRows(
        daily.rows.filter((row) => row.os_name !== "Unknown"),
        {
          days: timeframeOption ? timeframeOption.days : 14,
          osName: osName === ALL_OPERATING_SYSTEMS ? null : osName,
        },
      ),
      trendInterval,
    );
  }, [daily, osName, timeframe, trendInterval]);
  const filteredProofsDailyRows = useMemo(() => {
    const timeframeOption = TIMEFRAME_OPTIONS.find(
      (option) => option.value === timeframe,
    );
    return groupProofsDailyRowsByInterval(
      filterProofsDailyRows(proofsAnalyticsPreview.daily, {
        days: timeframeOption ? timeframeOption.days : 14,
        osName: osName === ALL_OPERATING_SYSTEMS ? null : osName,
        proofType: proofType === "all" ? null : proofType,
      }),
      trendInterval,
    );
  }, [osName, proofType, timeframe, trendInterval]);

  useEffect(() => {
    if (props.previewData) return;

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
        <TabGroup
          selectedIndex={selectedTabIndex}
          onChange={(index) => {
            setSelectedTabIndex(index);
            const view = index === 0 ? "proofs" : "selfie_check";
            if (selectedView.current === view) return;
            captureView(view, "tab_switch");
            selectedView.current = view;
          }}
        >
          <TabList
            aria-label="Analytics views"
            ref={tabListRef}
            className="relative flex gap-6 border-b border-portal-border"
          >
            {["Proofs", "Selfie Check"].map((label, index) => (
              <Tab
                key={label}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                className="py-3 font-world text-14 font-medium text-portal-muted transition-colors outline-none hover:text-portal-heading aria-selected:text-portal-heading data-focus:rounded-sm data-focus:outline-2 data-focus:outline-offset-4 data-focus:outline-portal-heading data-focus:outline-solid"
              >
                {label}
              </Tab>
            ))}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-[-1px] h-0.5 bg-portal-heading transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: `translateX(${tabIndicator.left}px)`,
                width: tabIndicator.width,
              }}
            />
          </TabList>
          <TabPanels className="mt-4">
            <TabPanel className="space-y-8 outline-none">
              <section className="space-y-4" aria-labelledby="proofs-all-time">
                <h2
                  id="proofs-all-time"
                  className="font-world text-18 font-semibold text-portal-heading"
                >
                  All time
                </h2>
                <ProofsTotalsOverview totals={proofsAnalyticsPreview.totals} />
              </section>
              <section className="space-y-5" aria-labelledby="proofs-trends">
                <div className="space-y-4">
                  <h2
                    id="proofs-trends"
                    className="font-world text-18 font-semibold text-portal-heading"
                  >
                    Trends
                  </h2>
                  <DailyAnalyticsFilters
                    ariaLabel="Proofs daily analytics filters"
                    operatingSystems={operatingSystems}
                    osName={osName}
                    proofType={proofType}
                    proofTypes={PROOF_TYPE_ORDER}
                    setOsName={setOsName}
                    setProofType={setProofType}
                    setTimeframe={setTimeframe}
                    setTrendInterval={setTrendInterval}
                    timeframe={timeframe}
                    trendInterval={trendInterval}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="font-world text-13 font-medium text-portal-muted">
                    Users
                  </h3>
                  <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                    {PROOFS_USER_CHARTS.map((chart) => (
                      <ProofsMetricChart
                        key={`${chart.metric}-${chart.dimension}`}
                        title={chart.title}
                        rows={filteredProofsDailyRows}
                        metric={chart.metric}
                        dimension={chart.dimension}
                        chartType={
                          chart.metric === "cumulativeUniqueUsersSharedProof"
                            ? "area"
                            : "bar"
                        }
                        timeInterval={trendInterval}
                        yAxisLabel={
                          chart.metric === "cumulativeUniqueUsersSharedProof"
                            ? "Cumulative number of users"
                            : "Number of users"
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-world text-13 font-medium text-portal-muted">
                    Proofs
                  </h3>
                  <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                    {PROOFS_SHARED_CHARTS.map((chart) => (
                      <ProofsMetricChart
                        key={chart.dimension}
                        title={chart.title}
                        rows={filteredProofsDailyRows}
                        metric="nProofsShared"
                        dimension={chart.dimension}
                        chartType="bar"
                        timeInterval={trendInterval}
                        yAxisLabel="Number of proofs"
                      />
                    ))}
                  </div>
                </div>
              </section>
            </TabPanel>
            <TabPanel className="space-y-8 outline-none">
              <section
                className="space-y-4"
                aria-labelledby="selfie-check-all-time"
              >
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
              <section
                className="space-y-4"
                aria-labelledby="selfie-check-trends"
              >
                <div className="space-y-4">
                  <h2
                    id="selfie-check-trends"
                    className="font-world text-18 font-semibold text-portal-heading"
                  >
                    Trends
                  </h2>
                  {daily.kind === "ready" && (
                    <DailyAnalyticsFilters
                      ariaLabel="Selfie Check daily analytics filters"
                      operatingSystems={operatingSystems}
                      osName={osName}
                      setOsName={setOsName}
                      setTimeframe={setTimeframe}
                      setTrendInterval={setTrendInterval}
                      timeframe={timeframe}
                      trendInterval={trendInterval}
                    />
                  )}
                </div>
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
                        timeInterval={trendInterval}
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
              </section>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </SizingWrapper>
  );
};
