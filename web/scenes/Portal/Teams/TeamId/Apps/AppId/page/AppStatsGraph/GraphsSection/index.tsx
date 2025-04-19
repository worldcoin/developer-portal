"use client";

import { useFetchAppStatsQuery } from "../graphql/client/fetch-app-stats.generated";

import { Chart, ChartProps } from "@/components/Chart";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType, TransactionStatus } from "@/lib/types";
import { ChartData, ChartOptions } from "chart.js";
import clsx from "clsx";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { useGetMetrics } from "../StatCards/use-get-metrics";
import { Stat } from "./stat";
import { useGetAccumulativeTransactions } from "./use-get-accumulative-transactions";

dayjs.extend(utc);
dayjs.extend(tz);

const labelDateFormat = "MMM YYYY";
const notificationOpenRateLabelDateFormat = "MMM DD";

const defaultDatasetConfig: Partial<ChartData<"line">["datasets"][number]> = {
  pointRadius: 0,
  pointBorderWidth: 1,
  pointHoverBorderColor: "#FFFFFF",
  pointHitRadius: 16,
  pointHoverRadius: 4,
  tension: 0,
  fill: false,
};

const verificationsDatasetConfig: Partial<
  ChartData<"line">["datasets"][number]
> = {
  ...defaultDatasetConfig,
  borderColor: "#4940E0",
};
const transactionsDatasetConfig: Partial<
  ChartData<"line">["datasets"][number]
> = {
  ...defaultDatasetConfig,
  borderColor: "#4292F4",
};
const uniqueUsersDatasetConfig: Partial<ChartData<"line">["datasets"][number]> =
  {
    ...defaultDatasetConfig,
    borderColor: "#00C3B6",
    backgroundColor: "#00C3B6",
  };

const openRateDatasetConfig: Partial<ChartData<"line">["datasets"][number]> = {
  ...defaultDatasetConfig,
  borderColor: "#00C3B6",
  backgroundColor: "#00C3B6",
};

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

const startsAt = new Date(0).toISOString();

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
}

const GraphCard: React.FC<GraphCardProps> = ({
  isLoading,
  chartData,
  stats,
  chartOptions,
  mobileAspectRatio = 580 / 350, // Default aspect ratio
  emptyStateTitle,
  emptyStateDescription,
  className,
}) => {
  const mobileChartOptions = {
    ...chartOptions,
    aspectRatio: mobileAspectRatio,
  };

  return (
    <div className={clsx("flex-1", className)}>
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
        <div className="rounded-2xl border border-grey-200 py-5">
          {/* Stats Section (Conditional Padding) */}
          <div
            className={clsx(
              "grid px-6 sm:pr-0",
              stats.length > 1 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {stats.map((statProps, index) => (
              <Stat
                key={index}
                title={statProps.title}
                value={statProps.value}
                valuePrefix={statProps.valuePrefix}
                valueSuffix={statProps.valueSuffix}
                mainColorClassName={statProps.mainColorClassName}
              />
            ))}
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

// ==================================================================================================
// ================================ Anchor: Graphs Section Component ================================
// ==================================================================================================

export const GraphsSection = () => {
  const { appId } = useParams() as { teamId: string; appId: string };
  const { metrics, loading: metricsLoading } = useGetMetrics(
    "app_f1e44837a5e3c2af4da8925b46027645",
  );

  const { data: appStatsData, loading: appStatsLoading } =
    useFetchAppStatsQuery({
      variables: {
        appId,
        startsAt,
        timeSpan: "day",
      },
    });

  const { transactions: transactionsData, loading: transactionsLoading } =
    useGetAccumulativeTransactions(appId);

  // ==================================================================================================
  // ========================== Anchor: Helper Functions to get overall data ==========================
  // ==================================================================================================
  const transactions = useMemo(
    () => transactionsData?.accumulativePayments,
    [transactionsData?.accumulativePayments],
  );
  const accumulatedTransactionAmountUSD = useMemo(
    () => transactionsData?.accumulatedTokenAmountUSD,
    [transactionsData?.accumulatedTokenAmountUSD],
  );

  const stats = useMemo(
    () => appStatsData?.app_stats,
    [appStatsData?.app_stats],
  );

  const totalVerifications = useMemo(() => {
    const appStatsLength = appStatsData?.app_stats.length;
    if (!appStatsLength) return 0;

    const verifications =
      appStatsData?.app_stats[appStatsLength - 1].verifications ?? 0;
    return verifications;
  }, [appStatsData?.app_stats]);

  const totalUniqueUsers = useMemo(() => {
    const appStatsLength = appStatsData?.app_stats.length;
    if (!appStatsLength) return 0;

    const unique_users =
      appStatsData?.app_stats[appStatsLength - 1].unique_users ?? 0;
    return unique_users;
  }, [appStatsData?.app_stats]);

  const engine = useMemo(
    () => appStatsData?.app?.[0]?.engine,
    [appStatsData?.app],
  );

  // ==================================================================================================
  // ================================= Anchor: Formatting Chart Data ==================================
  // ==================================================================================================
  const formattedNotificationOpenRateChartData = useMemo(() => {
    if (
      metricsLoading ||
      !metrics?.open_rate_last_14_days ||
      !metrics?.open_rate_last_14_days.length
    ) {
      return null;
    }

    const formattedData: ChartProps["data"] = {
      y: [
        {
          ...openRateDatasetConfig,
          data: [],
        },
      ],
      x: [],
    };

    metrics.open_rate_last_14_days.forEach((stat) => {
      formattedData.x.push(
        dayjs(stat.date).format(notificationOpenRateLabelDateFormat),
      );
      formattedData.y[0].data.push(stat.value * 100);
    });
    console.log(formattedData);
    return formattedData;
  }, [metrics?.open_rate_last_14_days, metricsLoading]);

  const formattedVerificationsChartData = useMemo(() => {
    if (!stats || !stats.length) {
      return null;
    }

    const formattedData: ChartProps["data"] = {
      y: [
        {
          ...verificationsDatasetConfig,
          data: [],
        },
        {
          ...uniqueUsersDatasetConfig,
          data: [],
        },
      ],

      x: [],
    };

    stats.forEach((stat) => {
      formattedData.x.push(dayjs(stat.date).format(labelDateFormat));
      formattedData.y[0].data.push(stat.verifications);
      formattedData.y[1].data.push(stat.unique_users);
    });

    return formattedData;
  }, [stats]);

  const formattedTransactionsChartData = useMemo(() => {
    if (!transactions || !transactions.length) {
      return null;
    }

    const formattedData: ChartProps["data"] = {
      y: [
        {
          ...transactionsDatasetConfig,
          data: [],
        },
      ],

      x: [],
    };

    transactions?.forEach((stat) => {
      formattedData.x.push(dayjs(stat.updatedAt).format(labelDateFormat));
      if (stat.transactionStatus === TransactionStatus.Mined) {
        formattedData.y[0].data.push(Number(stat.inputTokenAmount));
      }
    });

    return formattedData;
  }, [transactions]);

  // ==================================================================================================
  // ====================================== Anchor: Render Section ====================================
  // ==================================================================================================

  return (
    <div className="grid flex-1 grid-cols-1 grid-rows-3 gap-2 lg:grid-cols-2 lg:grid-rows-1">
      {/* Verifications Graph */}
      <GraphCard
        isLoading={appStatsLoading}
        chartData={formattedVerificationsChartData}
        stats={[
          {
            title: "Verifications",
            mainColorClassName: "bg-additional-blue-500",
            value: totalVerifications,
          },
          {
            title: "Unique users",
            mainColorClassName: "bg-additional-sea-500",
            value: totalUniqueUsers,
          },
        ]}
        chartOptions={commonChartConfig}
        emptyStateTitle={
          engine === EngineType.OnChain
            ? "Analytics are not available for on-chain apps yet"
            : "No data available yet"
        }
        emptyStateDescription={
          engine === EngineType.OnChain
            ? "Please refer to your smart contract for verification data"
            : "Your verification numbers will show up here."
        }
      />
      {/* Payments Graph */}
      <GraphCard
        isLoading={transactionsLoading}
        chartData={formattedTransactionsChartData}
        stats={[
          {
            title: "Payments",
            valuePrefix: "$",
            value: accumulatedTransactionAmountUSD,
          },
        ]}
        chartOptions={commonChartConfig}
        emptyStateTitle="No data available yet"
        emptyStateDescription="Your payment numbers will show up here."
      />
      {/* Notifications Graph */}
      <GraphCard
        isLoading={metricsLoading}
        chartData={formattedNotificationOpenRateChartData}
        stats={(() => {
          if (!formattedNotificationOpenRateChartData) return [];
          const notificationData =
            formattedNotificationOpenRateChartData.y[0].data;
          const lastDataPoint = notificationData[notificationData.length - 1];
          const lastOpenRateValue =
            typeof lastDataPoint === "number" ? lastDataPoint.toFixed(1) : "NA";
          return [
            {
              title: "Notifications open rate",
              valueSuffix: "%",
              value: lastOpenRateValue,
            },
          ];
        })()}
        chartOptions={commonChartConfig}
        emptyStateTitle="No data available yet"
        emptyStateDescription="Your notification open rate will show up here."
      />
    </div>
  );
};
