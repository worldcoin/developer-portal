"use client";
import { Chart, ChartProps } from "@/components/Chart";
import { InformationCircleIcon } from "@/components/Icons/InformationCircleIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateOverviewResponse } from "@/lib/types";
import { toFixedAmount } from "@/lib/utils";
import { useGetAffiliateOverview } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/hooks/use-get-affiliate-overview";
import { getXAxisLabels } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/utils";
import { ChartData, ChartOptions } from "chart.js";
import clsx from "clsx";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { atom, useAtom } from "jotai/index";
import React, { ReactNode, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { Stat } from "./stat";
import { TimespanSelector } from "./TimespanSelector";

dayjs.extend(utc);
dayjs.extend(tz);

const timespans: {
  label: string;
  value: AffiliateOverviewResponse["result"]["period"];
}[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];
const timespanAtom = atom(timespans[timespans.length - 2]);

const defaultDatasetConfig: Partial<ChartData<"line">["datasets"][number]> = {
  pointRadius: 0,
  pointBorderWidth: 1,
  pointHoverBorderColor: "#FFFFFF",
  pointHitRadius: 16,
  pointHoverRadius: 4,
  tension: 0,
  fill: false,
};

const orbVerificationsDatasetConfig: Partial<
  ChartData<"line">["datasets"][number]
> = {
  ...defaultDatasetConfig,
  borderColor: "#00B800",
  backgroundColor: "#00B800",
};

const idVerificationsDatasetConfig: Partial<
  ChartData<"line">["datasets"][number]
> = {
  ...defaultDatasetConfig,
  borderColor: "#008000",
  backgroundColor: "#008000",
};

const commonChartConfig: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false, // Add this to allow chart to fill container
  scales: {
    y: {
      ticks: { display: true },
      grid: {
        lineWidth: 1,
      },
    },
    x: {
      ticks: { maxTicksLimit: 10, crossAlign: "center" },
    },
  },
  plugins: {
    tooltip: {
      titleColor: "#9BA3AE",
      callbacks: {
        title: function (context) {
          return context[0].label;
        },
        label: function (context) {
          return context.formattedValue;
        },
      },
    },
  },
};

// Create a function to get chart config based on whether data is empty
const getChartConfig = (isEmpty: boolean): ChartOptions<"line"> => {
  if (!isEmpty) {
    return commonChartConfig;
  }

  return {
    ...commonChartConfig,
    scales: {
      ...commonChartConfig.scales,
      y: {
        ...commonChartConfig.scales?.y,
        ticks: {
          display: true,
          //@ts-ignore - ts says stepSize is not a valid property of CartesianTickOptions, but it is working
          stepSize: 250,
          callback: function (value) {
            if (value === 1000) return "1k";
            return value.toString();
          },
        },
        min: 0,
        max: 1000,
        grid: {
          lineWidth: 1,
        },
      },
    },
  };
};

// ==================================================================================================
// =================================== Anchor: Stat Props Interface =================================
// ==================================================================================================

// Define StatProps inline based on usage
interface StatProps {
  title: string;
  icon?: ReactNode;
  value: string | number | null | undefined;
  valuePrefix?: string;
  valueSuffix?: string;
  mainColorClassName?: string;
  // changePercentage?: number; // Excluded as per Omit in GraphCardProps
}

// ==================================================================================================
// =================================== Anchor: Graph Card Component =================================
// ==================================================================================================

interface GraphCardProps {
  isLoading: boolean;
  chartData: ChartProps["data"] | null | undefined;
  stats: StatProps[]; // Use the inline StatProps
  chartOptions: ChartOptions<"line">;
  mobileAspectRatio?: number; // e.g., 580 / 350
  emptyStateTitle: React.ReactNode;
  emptyStateDescription: React.ReactNode;
  className?: string;
  additionalStatTitle?: string | null;
  additionalStatValue?: string | null;
  tooltip?: React.ReactNode;
}

const GraphCard: React.FC<GraphCardProps> = ({
  isLoading,
  chartData,
  stats,
  chartOptions,
  mobileAspectRatio = 500 / 250, // 2:1
  emptyStateTitle,
  emptyStateDescription,
  className,
  additionalStatTitle,
  additionalStatValue,
  tooltip,
}) => {
  const [isTooltipHovered, setIsTooltipHovered] = React.useState(false);

  const mobileChartOptions = {
    ...chartOptions,
    maintainAspectRatio: false,
  };

  return (
    <div className={clsx("relative flex-1", className)}>
      {/* Info icon with tooltip on hover */}
      {tooltip && (
        <div className="absolute right-3 top-3 z-10">
          <div
            className="relative cursor-pointer"
            onPointerEnter={() => setIsTooltipHovered(true)}
            onPointerLeave={() => setIsTooltipHovered(false)}
          >
            <InformationCircleIcon className="size-4 text-grey-500" />
            {isTooltipHovered && (
              <div className="absolute right-0 top-6 min-w-32 max-w-64 whitespace-normal rounded border border-grey-200 bg-white px-3 py-2 text-12 text-grey-900 shadow-lg">
                {tooltip}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !chartData && (
        <div
          className={clsx(
            "pointer-events-none grid size-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12",
          )}
        >
          <Typography
            variant={TYPOGRAPHY.H7}
            className="text-center text-grey-500"
          >
            {emptyStateTitle}
          </Typography>
          <Typography
            variant={TYPOGRAPHY.R4}
            className="text-center text-14 text-grey-400"
          >
            {emptyStateDescription}
          </Typography>
        </div>
      )}

      {/* Combined Mobile & Desktop View */}
      {(isLoading || chartData) && (
        <div className="grid h-full grid-rows-auto/1fr gap-6">
          {/* Stats Section */}
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className={clsx("flex items-center divide-x divide-grey-200")}>
              {stats.map((statProps, index) => (
                <div
                  key={index}
                  className={clsx(
                    index === 0
                      ? "pr-6"
                      : index === stats.length - 1
                        ? "pl-6"
                        : "px-6",
                  )}
                >
                  <Stat
                    loading={isLoading}
                    title={statProps.title}
                    value={statProps.value}
                    icon={statProps.icon}
                    valuePrefix={statProps.valuePrefix}
                    valueSuffix={statProps.valueSuffix}
                    mainColorClassName={statProps.mainColorClassName}
                  />
                </div>
              ))}
            </div>

            {isLoading ? (
              <Skeleton height={42} width={150} />
            ) : (
              <TimespanSelector options={timespans} atom={timespanAtom} />
            )}
          </div>

          {isLoading && !chartData && (
            <Skeleton className="size-full min-h-[245px]" />
          )}

          {!isLoading && chartData && (
            <>
              {/* Mobile Chart (Visible on sm and below) */}
              <div className="block min-h-[245px] sm:hidden">
                <Chart data={chartData} options={mobileChartOptions} />
              </div>

              {/* Desktop Chart (Visible on sm and above) */}
              <div className="hidden min-h-[350px] sm:block">
                <Chart data={chartData} options={chartOptions} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const RewardsChart = () => {
  const [timespan] = useAtom(timespanAtom);
  const { data: appStatsData, loading: isOverviewDataLoading } =
    useGetAffiliateOverview({ period: timespan.value });

  const totalOrbRewards = useMemo(() => {
    return (
      toFixedAmount(appStatsData?.earnings.totalByType.orb.inCurrency) ?? 0
    );
  }, [appStatsData]);

  const totalIdRewards = useMemo(() => {
    return (
      toFixedAmount(appStatsData?.earnings.totalByType.nfc.inCurrency) ?? 0
    );
  }, [appStatsData]);

  const formattedVerificationsChartData = useMemo(() => {
    // Always return chart data structure, even when empty
    const formattedData: ChartProps["data"] = {
      y: [
        {
          ...orbVerificationsDatasetConfig,
          data: [],
        },
        {
          ...idVerificationsDatasetConfig,
          data: [],
        },
      ],
      x: [],
    };

    const hasData = appStatsData && appStatsData?.earnings?.periods?.length > 0;

    if (hasData) {
      // Use real data
      appStatsData.earnings.periods.forEach((stat) => {
        formattedData.x.push(
          dayjs(stat.start).format(getXAxisLabels(timespan.value)),
        );
        formattedData.y[0].data.push(stat.amountByType.orb.inCurrency);
        formattedData.y[1].data.push(stat.amountByType.nfc.inCurrency);
      });
    } else {
      // Generate empty state with dates and zero values
      const now = dayjs();
      let startDate: dayjs.Dayjs;
      let increment: dayjs.ManipulateType;
      let count: number;

      switch (timespan.value) {
        case "day":
          startDate = now.subtract(23, "hours");
          increment = "hour";
          count = 24;
          break;
        case "week":
          startDate = now.subtract(6, "days");
          increment = "day";
          count = 7;
          break;
        case "month":
          startDate = now.subtract(29, "days");
          increment = "day";
          count = 30;
          break;
        case "year":
          startDate = now.subtract(11, "months");
          increment = "month";
          count = 12;
          break;
        default:
          startDate = now.subtract(29, "days");
          increment = "day";
          count = 30;
      }

      for (let i = 0; i < count; i++) {
        const date = startDate.add(i, increment);
        formattedData.x.push(date.format(getXAxisLabels(timespan.value)));
        formattedData.y[0].data.push(0);
        formattedData.y[1].data.push(0);
      }

      // Hide lines when empty
      formattedData.y[0].borderWidth = 0;
      formattedData.y[1].borderWidth = 0;
    }

    return formattedData;
  }, [appStatsData, timespan.value]);

  const isEmpty = !appStatsData?.earnings?.periods?.length;
  const chartConfig = getChartConfig(isEmpty);

  return (
    <div className="grid flex-1">
      <GraphCard
        isLoading={isOverviewDataLoading}
        chartData={formattedVerificationsChartData}
        stats={[
          {
            title: "Orb rewards",
            mainColorClassName: "bg-system-success-500",
            value: totalOrbRewards,
            icon: <WorldIcon className="size-5" />,
          },
          {
            title: "ID rewards",
            mainColorClassName: "bg-system-success-600",
            value: totalIdRewards,
            icon: <WorldIcon className="size-5" />,
          },
        ]}
        chartOptions={chartConfig}
        emptyStateTitle={"No data available yet"}
        emptyStateDescription={"Your rewards numbers will show up here."}
      />
    </div>
  );
};
