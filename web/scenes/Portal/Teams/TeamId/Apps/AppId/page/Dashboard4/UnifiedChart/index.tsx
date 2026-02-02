"use client";

import { Chart } from "@/components/Chart";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ChartOptions } from "chart.js";
import clsx from "clsx";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ChartTabs, ChartTabType } from "./ChartTabs";
import { useChartData } from "./use-chart-data";

const commonChartConfig: ChartOptions<"line"> = {
  layout: {
    padding: { left: 0, bottom: 0 },
  },
  scales: {
    y: {
      display: true,
      beginAtZero: true,
      border: {
        display: false,
      },
      grid: {
        color: "#E5E7EB", // gray-200
        lineWidth: 1,
      },
      ticks: {
        display: true,
        padding: 12,
        color: "#9CA3AF", // gray-400
        font: {
          family: "GT America",
          size: 12,
        },
        maxTicksLimit: 5,
        precision: 0,
      },
    },
    x: {
      border: {
        display: false,
      },
      grid: {
        display: false,
      },
      ticks: {
        maxTicksLimit: 6,
        crossAlign: "center",
        color: "#9CA3AF", // gray-400
        font: {
          family: "GT America",
          size: 12,
        },
      },
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
      {/* Header with tabs */}
      <ChartTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
            <div className="block pl-2 sm:hidden">
              <Chart data={chartData} options={mobileChartOptions} />
            </div>

            {/* Desktop Chart */}
            <div className="hidden pl-2 sm:block">
              <Chart data={chartData} options={commonChartConfig} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
