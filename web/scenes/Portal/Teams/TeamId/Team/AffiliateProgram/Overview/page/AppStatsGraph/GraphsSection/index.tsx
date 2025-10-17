"use client";
import { Chart, ChartProps } from "@/components/Chart";
import { InformationCircleIcon } from "@/components/Icons/InformationCircleIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useGetAffiliateOverview } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-overview";
import { ChartData, ChartOptions } from "chart.js";
import clsx from "clsx";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { Stat } from "./stat";
import { TimespanSelector } from "./TimespanSelector";
import { atom, useAtom } from "jotai/index";
import { AffiliateOverviewResponse } from "@/lib/types";

dayjs.extend(utc);
dayjs.extend(tz);

const labelDateFormat = "DD.MM";
const timespans: {
  label: string;
  value: AffiliateOverviewResponse["period"];
}[] = [
  { label: "Daily", value: "day" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Yearly", value: "year" },
];
const timespanAtom = atom(timespans[timespans.length - 1]);

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
  borderColor: "#4940E0",
  backgroundColor: "#4940E0",
};

const idVerificationsDatasetConfig: Partial<
  ChartData<"line">["datasets"][number]
> = {
  ...defaultDatasetConfig,
  borderColor: "#00C3B6",
  backgroundColor: "#00C3B6",
};

const commonChartConfig: ChartOptions<"line"> = {
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
};

// ==================================================================================================
// =================================== Anchor: Stat Props Interface =================================
// ==================================================================================================

// Define StatProps inline based on usage
interface StatProps {
  title: string;
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
    aspectRatio: mobileAspectRatio,
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

      {/* Loading Skeleton */}
      {isLoading && (
        <div
          className="w-full rounded-2xl"
          style={{ aspectRatio: mobileAspectRatio }}
        >
          <Skeleton className="inset-0 size-full rounded-2xl" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !chartData && (
        <div
          className={clsx(
            "pointer-events-none grid size-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12",
          )}
          style={{ aspectRatio: mobileAspectRatio }}
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
      {!isLoading && chartData && (
        <div>
          {/* Stats Section (Conditional Padding) */}

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className={clsx("flex items-center divide-x divide-gray-200")}>
              {stats.map((statProps, index) => (
                <div
                  className={clsx(
                    index === 0
                      ? "pr-6"
                      : index === stats.length - 1
                        ? "pl-6"
                        : "px-6",
                  )}
                >
                  <Stat
                    key={index}
                    title={statProps.title}
                    value={statProps.value}
                    valuePrefix={statProps.valuePrefix}
                    valueSuffix={statProps.valueSuffix}
                    mainColorClassName={statProps.mainColorClassName}
                  />
                </div>
              ))}
            </div>

            <TimespanSelector options={timespans} atom={timespanAtom} />
          </div>

          {/* Mobile Chart (Visible on sm and below) */}
          <div className="block sm:hidden">
            <Chart data={chartData} options={mobileChartOptions} />
          </div>

          {/* Desktop Chart (Visible on sm and above) */}
          <div className="hidden sm:block">
            <Chart data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

// const isEligibleForNotificationBadge = (
//   avg_notification_open_rate: number | null,
//   has7DaysOfNotificationOpenRateData: boolean,
// ) => {
//   if (!avg_notification_open_rate) return false;
//   if (!has7DaysOfNotificationOpenRateData) return false;
//
//   return avg_notification_open_rate > 0.1;
// };

// ==================================================================================================
// ================================ Anchor: Graphs Section Component ================================
// ==================================================================================================

export const GraphsSection = () => {
  useParams() as { teamId: string; appId: string };
  const [timespan] = useAtom(timespanAtom);
  const { data: appStatsData, loading: appStatsLoading } =
    useGetAffiliateOverview({ period: timespan.value });

  // ==================================================================================================
  // ========================== Anchor: Helper Functions to get overall data ==========================
  // ==================================================================================================
  // const payments = useMemo(
  //   () => paymentsData?.accumulativePayments,
  //   [paymentsData?.accumulativePayments],
  // );
  // const accumulatedPaymentsAmountUSD = useMemo(
  //   () => paymentsData?.accumulatedTokenAmountUSD,
  //   [paymentsData?.accumulatedTokenAmountUSD],
  // );

  // const stats = useMemo(
  //   () => appStatsData?.app_stats,
  //   [appStatsData?.app_stats],
  // );

  const totalOrbVerifications = useMemo(() => {
    return appStatsData?.verifications.orb ?? 0;
  }, [appStatsData]);

  const totalIdVerifications = useMemo(() => {
    return appStatsData?.verifications.nfc ?? 0;
  }, [appStatsData]);

  // const totalUniqueUsers = useMemo(() => {
  //   const appStatsLength = appStatsData?.app_stats.length;
  //   if (!appStatsLength) return 0;
  //
  //   const unique_users =
  //     appStatsData?.app_stats[appStatsLength - 1].unique_users ?? 0;
  //   return unique_users;
  // }, [appStatsData?.app_stats]);

  // const engine = useMemo(
  //   () => appStatsData?.app?.[0]?.engine,
  //   [appStatsData?.app],
  // );

  // ==================================================================================================
  // ================================= Anchor: Formatting Chart Data ==================================
  // ==================================================================================================
  // const formattedNotificationOpenRateChartData = useMemo(() => {
  //   if (
  //     metricsLoading ||
  //     !metrics?.open_rate_last_14_days ||
  //     !metrics?.open_rate_last_14_days.length
  //   ) {
  //     return null;
  //   }
  //
  //   const formattedData: ChartProps["data"] = {
  //     y: [
  //       {
  //         ...openRateDatasetConfig,
  //         data: [],
  //       },
  //     ],
  //     x: [],
  //   };
  //
  //   metrics.open_rate_last_14_days.forEach((stat) => {
  //     formattedData.x.push(
  //       dayjs(stat.date).format(notificationOpenRateLabelDateFormat),
  //     );
  //     formattedData.y[0].data.push(stat.value * 100);
  //   });
  //   console.log(formattedData);
  //   return formattedData;
  // }, [metrics?.open_rate_last_14_days, metricsLoading]);

  // const formattedNotificationOptInRate = useMemo(() => {
  //   if (metricsLoading || metrics?.notification_opt_in_rate == null) {
  //     return null;
  //   }
  //
  //   return (metrics.notification_opt_in_rate * 100).toFixed(2) + "%";
  // }, [metrics?.notification_opt_in_rate, metricsLoading]);

  const formattedVerificationsChartData = useMemo(() => {
    if (!appStatsData) {
      return null;
    }

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

    appStatsData.verifications.periods.forEach((stat) => {
      formattedData.x.push(dayjs(stat.start).format(labelDateFormat));
      formattedData.y[0].data.push(stat.orb);
      formattedData.y[1].data.push(stat.nfc);
    });

    return formattedData;
  }, [appStatsData]);

  // const averageOpenRate = useMemo(() => {
  //   if (
  //     metricsLoading ||
  //     !metrics?.open_rate_last_14_days ||
  //     !metrics?.open_rate_last_14_days.length
  //   ) {
  //     return null;
  //   }
  //
  //   return (
  //     metrics?.open_rate_last_14_days?.reduce(
  //       (acc, curr) => acc + curr.value,
  //       0,
  //     ) / metrics?.open_rate_last_14_days?.length
  //   );
  // }, [metrics?.open_rate_last_14_days, metricsLoading]);

  // const has7DaysOfNotificationOpenRateData = useMemo(
  //   () =>
  //     metricsLoading ||
  //     !metrics?.open_rate_last_14_days ||
  //     metrics?.open_rate_last_14_days?.length >= 7,
  //   [metrics?.open_rate_last_14_days, metricsLoading],
  // );
  //
  // const formattedAverageOpenRate = useMemo(
  //   () => (averageOpenRate == null ? null : (averageOpenRate * 100).toFixed(2)),
  //   [averageOpenRate],
  // );
  // ==================================================================================================
  // ====================================== Anchor: Render Section ====================================
  // ==================================================================================================

  return (
    <div className="grid flex-1">
      {/* Verifications Graph */}
      <GraphCard
        isLoading={appStatsLoading}
        chartData={formattedVerificationsChartData}
        stats={[
          {
            title: "Orb verifications",
            mainColorClassName: "bg-blue-500",
            value: totalOrbVerifications,
          },
          {
            title: "ID verifications",
            mainColorClassName: "bg-additional-sea-500",
            value: totalIdVerifications,
          },
        ]}
        additionalStatTitle={true ? "Total opt-in rate" : null}
        additionalStatValue={"123"}
        chartOptions={commonChartConfig}
        emptyStateTitle={"No data available yet"}
        emptyStateDescription={"Your verification numbers will show up here."}
      />

      {/* Payments Graph */}
      {/*      <GraphCard
        isLoading={transactionsLoading}
        chartData={formattedPaymentsChartData}
        stats={[
          {
            title: "Payments",
            valuePrefix: "$",
            value: accumulatedPaymentsAmountUSD,
            mainColorClassName: "bg-additional-blue-500",
          },
        ]}
        chartOptions={commonChartConfig}
        emptyStateTitle="No data available yet"
        emptyStateDescription="Your payment numbers will show up here."
      />*/}
      {/* Notifications Open Rate Graph */}
      {/*      <GraphCard
        isLoading={metricsLoading}
        chartData={formattedNotificationOpenRateChartData}
        stats={(() => {
          if (!formattedNotificationOpenRateChartData) return [];

          return [
            {
              title: "Notifications open rate",
              valueSuffix: "%",
              value: formattedAverageOpenRate,
              mainColorClassName: "bg-additional-lightOrange-500",
            },
          ];
        })()}
        additionalStatTitle={
          formattedNotificationOptInRate ? "Total opt-in rate" : null
        }
        additionalStatValue={formattedNotificationOptInRate}
        chartOptions={commonChartConfig}
        emptyStateTitle="No data available yet"
        emptyStateDescription="Your notification open rate will show up here."
        tooltip={
          isEligibleForNotificationBadge(
            averageOpenRate,
            has7DaysOfNotificationOpenRateData,
          ) ? (
            <span>
              Your average open rate ({formattedAverageOpenRate}%) is above the
              10% threshold. Your app is eligible for a notification badge.
            </span>
          ) : null
        }
      />*/}
    </div>
  );
};
