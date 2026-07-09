"use client";

import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { useMemo, useState } from "react";
import { useCachedMetrics } from "./AppStatsGraph/StatsRow/use-cached-metrics";
import { useGetMetrics } from "./AppStatsGraph/StatCards/use-get-metrics";
import { UnifiedChart } from "./AppStatsGraph/UnifiedChart";

type TimePeriod = "weekly" | "all-time";

interface DashboardWrapperProps {
  appId: string;
}

const timePeriodOptions = [
  { value: "all-time" as TimePeriod, label: "All time" },
  { value: "weekly" as TimePeriod, label: "Weekly" },
];

const TimePeriodSelector = (props: {
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}) => (
  <Select value={props.timePeriod} onChange={props.onTimePeriodChange}>
    <SelectButton className="flex h-10 items-center justify-center gap-2 rounded-8 border border-portal-border bg-white py-2.5 pl-4 pr-3 font-world text-13 leading-none text-portal-ink outline-none transition-colors hover:bg-portal-canvas focus-visible:ring-2 focus-visible:ring-grey-300">
      <span>
        {timePeriodOptions.find((option) => option.value === props.timePeriod)
          ?.label ?? "All time"}
      </span>
      <Icon name="chevron-down" className="size-4" />
    </SelectButton>
    <SelectOptions>
      {timePeriodOptions.map((option) => (
        <SelectOption
          key={option.value}
          value={option.value}
          className="font-world text-13 text-portal-ink hover:bg-portal-canvas"
        >
          {option.label}
        </SelectOption>
      ))}
    </SelectOptions>
  </Select>
);

const StatCard = (props: {
  label: string;
  value: number | null;
  changePercent: number | null;
}) => {
  const value = props.value ?? 0;
  const change = props.changePercent;
  const isDecrease = change !== null && change < 0;

  return (
    <div className="rounded-[10px] border border-portal-border bg-white p-6">
      <div className="flex items-end gap-2">
        <div className="font-world text-19 font-medium leading-[1.2] text-portal-ink">
          {value.toLocaleString()}
        </div>
        {/* Only show the trend badge when a real comparison exists. All-time
            (and first-week weekly) have no prior period, so `change` is null —
            rendering "0%" there would misreport a flat trend. The triangle
            points down for a decrease. */}
        {change !== null ? (
          <div className="flex h-[19px] items-center gap-1 text-portal-faint">
            <span className="flex h-[5px] w-[7px] items-center justify-center">
              <Icon
                name="stat-triangle"
                className={`h-[7px] w-[5px] -scale-y-100 ${
                  isDecrease ? "-rotate-90" : "rotate-90"
                }`}
              />
            </span>
            <span className="font-world text-13 leading-[1.2]">
              {Math.abs(change).toFixed(0)}%
            </span>
          </div>
        ) : null}
      </div>
      <div className="mt-0.5 font-world text-13 leading-[1.3] text-portal-muted">
        {props.label}
      </div>
    </div>
  );
};

export const DashboardWrapper = ({ appId }: DashboardWrapperProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-time");
  const { metrics, loading: metricsLoading } = useGetMetrics(appId);

  const weeklyMetrics = useMemo(() => {
    if (!metrics) return null;
    return {
      impressions: metrics.total_impressions_last_7_days ?? null,
      sessions: metrics.total_users_last_7_days ?? null,
      users: metrics.unique_users_last_7_days ?? null,
      newUsers: metrics.new_users_last_7_days ?? null,
    };
  }, [metrics]);

  const allTimeMetrics = useMemo(() => {
    if (!metrics) return null;
    return {
      impressions: metrics.total_impressions ?? null,
      sessions: metrics.total_users ?? null,
      users: metrics.unique_users ?? null,
      newUsers: metrics.unique_users ?? null,
    };
  }, [metrics]);

  const metricsWithChange = useCachedMetrics(
    appId,
    timePeriod === "weekly" ? weeklyMetrics : allTimeMetrics,
    metricsLoading,
    timePeriod,
  );

  return (
    <section className="w-full">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:gap-6">
        <h1 className="font-world text-26 font-medium leading-[1.2] text-portal-heading">
          Overview
        </h1>
        <TimePeriodSelector
          timePeriod={timePeriod}
          onTimePeriodChange={setTimePeriod}
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <StatCard
          label="Impressions"
          value={metricsWithChange.impressions}
          changePercent={metricsWithChange.impressionsChange}
        />
        <StatCard
          label="Sessions"
          value={metricsWithChange.sessions}
          changePercent={metricsWithChange.sessionsChange}
        />
        <StatCard
          label="Total users"
          value={metricsWithChange.users}
          changePercent={metricsWithChange.usersChange}
        />
      </div>

      <div className="mt-8">
        <UnifiedChart appId={appId} />
      </div>
    </section>
  );
};
