"use client";

import { Chart } from "@/components/Chart";
import { ChartOptions } from "chart.js";
import clsx from "clsx";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ChartTabs, ChartTabType } from "./ChartTabs";
import { useChartData } from "./use-chart-data";

const axisTicks = {
  color: "#9c9c9c", // portal-subtle
  font: { family: "World Pro", size: 12 },
};

const commonChartConfig: ChartOptions<"line"> = {
  layout: {
    padding: { left: 0, bottom: 0 },
  },
  scales: {
    y: {
      display: true,
      beginAtZero: true,
      border: { display: false },
      grid: {
        color: "#f1f1f1", // portal-border
        lineWidth: 1,
      },
      ticks: {
        display: true,
        padding: 12,
        maxTicksLimit: 5,
        precision: 0,
        ...axisTicks,
      },
    },
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: { maxTicksLimit: 6, crossAlign: "center", ...axisTicks },
    },
  },
};

const desktopAspectRatio = 1180 / 280;
const mobileAspectRatio = 500 / 200;

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
      <span className="font-world text-13 text-portal-muted">{label}</span>
      <span className="font-world text-13 font-medium text-portal-text">
        {valuePrefix}
        {formattedValue ?? "—"}
        {valueSuffix}
      </span>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center">
    <div className="font-world text-19 font-medium leading-[1.2] text-portal-muted">
      No available data
    </div>
    <div className="mt-1 font-world text-15 leading-[1.3] text-portal-subtle">
      Your data will show up here
    </div>
  </div>
);

interface UnifiedChartProps {
  appId: string;
}

export const UnifiedChart = ({ appId }: UnifiedChartProps) => {
  const [activeTab, setActiveTab] = useState<ChartTabType>("verifications");

  const { chartData, isLoading, stats, additionalStats } = useChartData(
    appId,
    activeTab,
  );

  const mobileChartOptions: ChartOptions<"line"> = {
    ...commonChartConfig,
    aspectRatio: mobileAspectRatio,
  };

  const desktopChartOptions: ChartOptions<"line"> = {
    ...commonChartConfig,
    aspectRatio: desktopAspectRatio,
  };

  return (
    <div className="flex flex-col gap-y-4">
      {/* Header with tabs */}
      <ChartTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Chart area */}
      <div className="rounded-[10px] border border-portal-border">
        {/* Loading state */}
        {isLoading && (
          <div className="py-5">
            <div className="flex gap-4 px-6 pb-4">
              <Skeleton width={120} height={24} />
              <Skeleton width={100} height={24} />
            </div>
            <div
              className="block px-5 sm:hidden"
              style={{ aspectRatio: mobileAspectRatio }}
            >
              <Skeleton className="size-full rounded-xl" />
            </div>
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
            <div className="h-6 px-6 pb-4" />
            <div
              className="grid content-center justify-items-center px-12 sm:hidden"
              style={{ aspectRatio: mobileAspectRatio }}
            >
              <EmptyState />
            </div>
            <div
              className="hidden content-center justify-items-center px-12 sm:grid"
              style={{ aspectRatio: desktopAspectRatio }}
            >
              <EmptyState />
            </div>
          </div>
        )}

        {/* Chart with stats */}
        {!isLoading && chartData && (
          <div className="py-5">
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
            <div className="block pl-2 sm:hidden">
              <Chart data={chartData} options={mobileChartOptions} />
            </div>

            {/* Desktop Chart */}
            <div className="hidden pl-2 sm:block">
              <Chart data={chartData} options={desktopChartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
