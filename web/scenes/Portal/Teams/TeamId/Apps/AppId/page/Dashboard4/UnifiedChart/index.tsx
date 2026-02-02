"use client";

import { Chart } from "@/components/Chart";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ChartOptions } from "chart.js";
import clsx from "clsx";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ChartTabs, ChartTabType } from "./ChartTabs";
import { useChartData } from "./use-chart-data";

const commonChartConfig: ChartOptions<"line"> = {
  scales: {
    y: {
      ticks: { display: false },
      grid: {
        lineWidth: 0,
      },
    },
    x: {
      ticks: { maxTicksLimit: 3, crossAlign: "center" },
    },
  },
};

const desktopAspectRatio = 1180 / 350;
const mobileAspectRatio = 500 / 250;

interface TimePeriodOption {
  value: string;
  label: string;
}

const timePeriodOptions: TimePeriodOption[] = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
];

interface StatDisplayProps {
  label: string;
  value: number | string | null | undefined;
  valuePrefix?: string;
  valueSuffix?: string;
  colorClassName?: string;
}

const StatDisplay = ({
  label,
  value,
  valuePrefix,
  valueSuffix,
  colorClassName,
}: StatDisplayProps) => {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className="flex items-center gap-x-2">
      {colorClassName && (
        <div className={clsx("size-2 rounded-full", colorClassName)} />
      )}
      <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
        {label}
      </Typography>
      <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
        {valuePrefix}
        {formattedValue ?? "—"}
        {valueSuffix}
      </Typography>
    </div>
  );
};

interface UnifiedChartProps {
  appId: string;
}

export const UnifiedChart = ({ appId }: UnifiedChartProps) => {
  const [activeTab, setActiveTab] = useState<ChartTabType>("verifications");
  const [timePeriod, setTimePeriod] = useState("monthly");

  const { chartData, isLoading, stats, additionalStats } = useChartData(
    appId,
    activeTab
  );

  const mobileChartOptions = {
    ...commonChartConfig,
    aspectRatio: mobileAspectRatio,
  };

  return (
    <div className="flex flex-col gap-y-4">
      {/* Header with tabs and time period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ChartTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <Select value={timePeriod} onChange={setTimePeriod}>
          <SelectButton className="flex h-10 w-32 items-center justify-between rounded-lg border border-gray-200 bg-white px-4">
            <span className="font-gta text-base font-normal text-zinc-700">
              {timePeriodOptions.find((o) => o.value === timePeriod)?.label}
            </span>
            <CaretIcon className="size-5 text-gray-400" />
          </SelectButton>
          <SelectOptions>
            {timePeriodOptions.map((option) => (
              <SelectOption
                key={option.value}
                value={option.value}
                className="font-gta text-base text-zinc-700 hover:bg-gray-50"
              >
                {option.label}
              </SelectOption>
            ))}
          </SelectOptions>
        </Select>
      </div>

      {/* Chart area */}
      <div className="rounded-2xl border border-grey-200">
        {/* Loading state */}
        {isLoading && (
          <div className="py-5">
            {/* Stats skeleton */}
            <div className="flex gap-4 px-6 pb-4">
              <Skeleton width={120} height={24} />
              <Skeleton width={100} height={24} />
            </div>
            {/* Chart skeleton - mobile */}
            <div
              className="block px-5 sm:hidden"
              style={{ aspectRatio: mobileAspectRatio }}
            >
              <Skeleton className="size-full rounded-xl" />
            </div>
            {/* Chart skeleton - desktop */}
            <div
              className="hidden px-5 sm:block"
              style={{ aspectRatio: desktopAspectRatio }}
            >
              <Skeleton className="size-full rounded-xl" />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !chartData && (
          <div className="py-5">
            {/* Empty stats placeholder */}
            <div className="h-6 px-6 pb-4" />
            {/* Empty chart area - mobile */}
            <div
              className="grid content-center justify-center justify-items-center gap-y-2 px-12 sm:hidden"
              style={{ aspectRatio: mobileAspectRatio }}
            >
              <Typography
                variant={TYPOGRAPHY.H6}
                className="text-center text-gray-500"
              >
                No available data
              </Typography>
              <Typography
                variant={TYPOGRAPHY.R3}
                className="text-center text-gray-400"
              >
                Your data will show up here
              </Typography>
            </div>
            {/* Empty chart area - desktop */}
            <div
              className="hidden content-center justify-center justify-items-center gap-y-2 px-12 sm:grid"
              style={{ aspectRatio: desktopAspectRatio }}
            >
              <Typography
                variant={TYPOGRAPHY.H6}
                className="text-center text-gray-500"
              >
                No available data
              </Typography>
              <Typography
                variant={TYPOGRAPHY.R3}
                className="text-center text-gray-400"
              >
                Your data will show up here
              </Typography>
            </div>
          </div>
        )}

        {/* Chart with stats */}
        {!isLoading && chartData && (
          <div className="py-5">
            {/* Stats row */}
            <div className="flex flex-wrap gap-4 px-6 pb-4">
              {stats.map((stat, index) => (
                <StatDisplay
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  valuePrefix={stat.valuePrefix}
                  valueSuffix={stat.valueSuffix}
                  colorClassName={stat.colorClassName}
                />
              ))}
              {additionalStats && (
                <StatDisplay
                  label={additionalStats.label}
                  value={additionalStats.value}
                />
              )}
            </div>

            {/* Mobile Chart */}
            <div className="block sm:hidden">
              <Chart data={chartData} options={mobileChartOptions} />
            </div>

            {/* Desktop Chart */}
            <div className="hidden sm:block">
              <Chart data={chartData} options={commonChartConfig} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
