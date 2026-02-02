"use client";

import { ChartProps } from "@/components/Chart";
import { EngineType, TransactionStatus } from "@/lib/types";
import { ChartData } from "chart.js";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useMemo } from "react";
import { useFetchAppStatsQuery } from "../../AppStatsGraph/graphql/client/fetch-app-stats.generated";
import { useGetAccumulativeTransactions } from "../../AppStatsGraph/GraphsSection/use-get-accumulative-transactions";
import { useGetMetrics } from "../../AppStatsGraph/StatCards/use-get-metrics";
import { ChartTabType } from "./ChartTabs";

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
  backgroundColor: "#4940E0",
};

const paymentsDatasetConfig: Partial<ChartData<"line">["datasets"][number]> = {
  ...defaultDatasetConfig,
  borderColor: "#4292F4",
  backgroundColor: "#4292F4",
};

const uniqueUsersDatasetConfig: Partial<
  ChartData<"line">["datasets"][number]
> = {
  ...defaultDatasetConfig,
  borderColor: "#00C3B6",
  backgroundColor: "#00C3B6",
};

const openRateDatasetConfig: Partial<ChartData<"line">["datasets"][number]> = {
  ...defaultDatasetConfig,
  borderColor: "#FFA048",
  backgroundColor: "#FFA048",
};

export interface ChartDataResult {
  chartData: ChartProps["data"] | null;
  isLoading: boolean;
  emptyStateTitle: string;
  emptyStateDescription: string;
  stats: {
    label: string;
    value: number | string | null | undefined;
    valuePrefix?: string;
    valueSuffix?: string;
    colorClassName?: string;
  }[];
  additionalStats?: {
    label: string;
    value: string | null;
  };
}

export const useChartData = (appId: string, activeTab: ChartTabType) => {
  const { metrics, loading: metricsLoading } = useGetMetrics(appId);

  const { data: appStatsData, loading: appStatsLoading } =
    useFetchAppStatsQuery({
      variables: { appId },
    });

  const {
    payments: paymentsData,
    loading: transactionsLoading,
  } = useGetAccumulativeTransactions(appId);

  const engine = useMemo(
    () => appStatsData?.app?.[0]?.engine,
    [appStatsData?.app]
  );

  // Verifications data
  const formattedVerificationsChartData = useMemo(() => {
    const stats = appStatsData?.app_stats;
    if (!stats || !stats.length) {
      return null;
    }

    const formattedData: ChartProps["data"] = {
      y: [
        { ...verificationsDatasetConfig, data: [] },
        { ...uniqueUsersDatasetConfig, data: [] },
      ],
      x: [],
    };

    stats.forEach((stat) => {
      formattedData.x.push(dayjs(stat.date).format(labelDateFormat));
      formattedData.y[0].data.push(stat.verifications);
      formattedData.y[1].data.push(stat.unique_users);
    });

    return formattedData;
  }, [appStatsData?.app_stats]);

  const totalVerifications = useMemo(() => {
    const appStatsLength = appStatsData?.app_stats.length;
    if (!appStatsLength) return 0;
    return appStatsData?.app_stats[appStatsLength - 1].verifications ?? 0;
  }, [appStatsData?.app_stats]);

  const totalUniqueUsers = useMemo(() => {
    const appStatsLength = appStatsData?.app_stats.length;
    if (!appStatsLength) return 0;
    return appStatsData?.app_stats[appStatsLength - 1].unique_users ?? 0;
  }, [appStatsData?.app_stats]);

  // Payments data
  const formattedPaymentsChartData = useMemo(() => {
    const payments = paymentsData?.accumulativePayments;
    if (!payments || !payments.length) {
      return null;
    }

    const formattedData: ChartProps["data"] = {
      y: [{ ...paymentsDatasetConfig, data: [] }],
      x: [],
    };

    payments.forEach((stat) => {
      formattedData.x.push(dayjs(stat.updatedAt).format(labelDateFormat));
      if (stat.transactionStatus === TransactionStatus.Mined) {
        formattedData.y[0].data.push(Number(stat.inputTokenAmount));
      }
    });

    return formattedData;
  }, [paymentsData?.accumulativePayments]);

  const accumulatedPaymentsAmountUSD = useMemo(
    () => paymentsData?.accumulatedTokenAmountUSD,
    [paymentsData?.accumulatedTokenAmountUSD]
  );

  // Notifications data
  const formattedNotificationOpenRateChartData = useMemo(() => {
    if (
      metricsLoading ||
      !metrics?.open_rate_last_14_days ||
      !metrics?.open_rate_last_14_days.length
    ) {
      return null;
    }

    const formattedData: ChartProps["data"] = {
      y: [{ ...openRateDatasetConfig, data: [] }],
      x: [],
    };

    metrics.open_rate_last_14_days.forEach((stat) => {
      formattedData.x.push(
        dayjs(stat.date).format(notificationOpenRateLabelDateFormat)
      );
      formattedData.y[0].data.push(stat.value * 100);
    });

    return formattedData;
  }, [metrics?.open_rate_last_14_days, metricsLoading]);

  const averageOpenRate = useMemo(() => {
    if (
      metricsLoading ||
      !metrics?.open_rate_last_14_days ||
      !metrics?.open_rate_last_14_days.length
    ) {
      return null;
    }

    return (
      metrics?.open_rate_last_14_days?.reduce(
        (acc, curr) => acc + curr.value,
        0
      ) / metrics?.open_rate_last_14_days?.length
    );
  }, [metrics?.open_rate_last_14_days, metricsLoading]);

  const formattedAverageOpenRate = useMemo(
    () => (averageOpenRate == null ? null : (averageOpenRate * 100).toFixed(2)),
    [averageOpenRate]
  );

  const formattedNotificationOptInRate = useMemo(() => {
    if (metricsLoading || metrics?.notification_opt_in_rate == null) {
      return null;
    }
    return (metrics.notification_opt_in_rate * 100).toFixed(2) + "%";
  }, [metrics?.notification_opt_in_rate, metricsLoading]);

  // Return data based on active tab
  const result = useMemo((): ChartDataResult => {
    switch (activeTab) {
      case "verifications":
        return {
          chartData: formattedVerificationsChartData,
          isLoading: appStatsLoading,
          emptyStateTitle:
            engine === EngineType.OnChain
              ? "Analytics are not available for on-chain apps yet"
              : "No data available yet",
          emptyStateDescription:
            engine === EngineType.OnChain
              ? "Please refer to your smart contract for verification data"
              : "Your verification numbers will show up here.",
          stats: [
            {
              label: "Verifications",
              value: totalVerifications,
              colorClassName: "bg-blue-500",
            },
            {
              label: "Unique users",
              value: totalUniqueUsers,
              colorClassName: "bg-additional-sea-500",
            },
          ],
        };

      case "payments":
        return {
          chartData: formattedPaymentsChartData,
          isLoading: transactionsLoading,
          emptyStateTitle: "No data available yet",
          emptyStateDescription: "Your payment numbers will show up here.",
          stats: [
            {
              label: "Payments",
              value: accumulatedPaymentsAmountUSD,
              valuePrefix: "$",
              colorClassName: "bg-additional-blue-500",
            },
          ],
        };

      case "notifications":
        return {
          chartData: formattedNotificationOpenRateChartData,
          isLoading: metricsLoading,
          emptyStateTitle: "No data available yet",
          emptyStateDescription:
            "Your notification open rate will show up here.",
          stats: formattedNotificationOpenRateChartData
            ? [
                {
                  label: "Notifications open rate",
                  value: formattedAverageOpenRate,
                  valueSuffix: "%",
                  colorClassName: "bg-additional-lightOrange-500",
                },
              ]
            : [],
          additionalStats: formattedNotificationOptInRate
            ? {
                label: "Total opt-in rate",
                value: formattedNotificationOptInRate,
              }
            : undefined,
        };
    }
  }, [
    activeTab,
    formattedVerificationsChartData,
    formattedPaymentsChartData,
    formattedNotificationOpenRateChartData,
    appStatsLoading,
    transactionsLoading,
    metricsLoading,
    engine,
    totalVerifications,
    totalUniqueUsers,
    accumulatedPaymentsAmountUSD,
    formattedAverageOpenRate,
    formattedNotificationOptInRate,
  ]);

  return result;
};
