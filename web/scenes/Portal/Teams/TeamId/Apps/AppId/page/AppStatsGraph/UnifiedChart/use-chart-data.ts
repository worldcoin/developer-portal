"use client";

import { ChartProps } from "@/components/Chart";
import { EngineType, TransactionStatus } from "@/lib/types";
import { ChartData } from "chart.js";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useMemo } from "react";
import { useFetchAppStatsQuery } from "../graphql/client/fetch-app-stats.generated";
import { useGetAccumulativeTransactions } from "../GraphsSection/use-get-accumulative-transactions";
import { useGetMetrics } from "../StatCards/use-get-metrics";
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

const uniqueUsersDatasetConfig: Partial<ChartData<"line">["datasets"][number]> =
  {
    ...defaultDatasetConfig,
    borderColor: "#00C3B6",
    backgroundColor: "#00C3B6",
  };

const openRateDatasetConfig: Partial<ChartData<"line">["datasets"][number]> = {
  ...defaultDatasetConfig,
  borderColor: "#FFA048",
  backgroundColor: "#FFA048",
};

const USE_MOCK_DATA = false;

const mockVerificationsData: ChartProps["data"] = {
  x: ["Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025"],
  y: [
    {
      ...verificationsDatasetConfig,
      data: [1200, 1900, 3000, 5200, 4800, 6100],
    },
    { ...uniqueUsersDatasetConfig, data: [800, 1200, 2100, 3400, 3100, 4200] },
  ],
};

const mockPaymentsData: ChartProps["data"] = {
  x: ["Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025"],
  y: [{ ...paymentsDatasetConfig, data: [250, 890, 1450, 2100, 3200, 4850] }],
};

const mockNotificationsData: ChartProps["data"] = {
  x: [
    "Jan 20",
    "Jan 21",
    "Jan 22",
    "Jan 23",
    "Jan 24",
    "Jan 25",
    "Jan 26",
    "Jan 27",
    "Jan 28",
    "Jan 29",
    "Jan 30",
    "Jan 31",
    "Feb 01",
    "Feb 02",
  ],
  y: [
    {
      ...openRateDatasetConfig,
      data: [42, 38, 45, 52, 48, 55, 51, 47, 53, 58, 54, 49, 56, 52],
    },
  ],
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

  const { payments: paymentsData, loading: transactionsLoading } =
    useGetAccumulativeTransactions(appId);

  const engine = useMemo(
    () => appStatsData?.app?.[0]?.engine,
    [appStatsData?.app],
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
    [paymentsData?.accumulatedTokenAmountUSD],
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
        dayjs(stat.date).format(notificationOpenRateLabelDateFormat),
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
        0,
      ) / metrics?.open_rate_last_14_days?.length
    );
  }, [metrics?.open_rate_last_14_days, metricsLoading]);

  const formattedAverageOpenRate = useMemo(
    () => (averageOpenRate == null ? null : (averageOpenRate * 100).toFixed(2)),
    [averageOpenRate],
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
      case "verifications": {
        const hasRealData = !!formattedVerificationsChartData;
        const useMock = USE_MOCK_DATA && !hasRealData;
        return {
          chartData: hasRealData
            ? formattedVerificationsChartData
            : useMock
              ? mockVerificationsData
              : null,
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
              value: useMock ? 6100 : totalVerifications,
              colorClassName: "bg-blue-500",
            },
            {
              label: "Unique users",
              value: useMock ? 4200 : totalUniqueUsers,
              colorClassName: "bg-additional-sea-500",
            },
          ],
        };
      }

      case "payments": {
        const hasRealData = !!formattedPaymentsChartData;
        const useMock = USE_MOCK_DATA && !hasRealData;
        return {
          chartData: hasRealData
            ? formattedPaymentsChartData
            : useMock
              ? mockPaymentsData
              : null,
          isLoading: transactionsLoading,
          emptyStateTitle: "No data available yet",
          emptyStateDescription: "Your payment numbers will show up here.",
          stats: [
            {
              label: "Payments",
              value: useMock ? 4850 : accumulatedPaymentsAmountUSD,
              valuePrefix: "$",
              colorClassName: "bg-additional-blue-500",
            },
          ],
        };
      }

      case "notifications": {
        const hasRealData = !!formattedNotificationOpenRateChartData;
        const useMock = USE_MOCK_DATA && !hasRealData;
        return {
          chartData: hasRealData
            ? formattedNotificationOpenRateChartData
            : useMock
              ? mockNotificationsData
              : null,
          isLoading: metricsLoading,
          emptyStateTitle: "No data available yet",
          emptyStateDescription:
            "Your notification open rate will show up here.",
          stats:
            hasRealData || useMock
              ? [
                  {
                    label: "Notifications open rate",
                    value: useMock ? "51.21" : formattedAverageOpenRate,
                    valueSuffix: "%",
                    colorClassName: "bg-additional-lightOrange-500",
                  },
                ]
              : [],
          additionalStats:
            (hasRealData && formattedNotificationOptInRate) || useMock
              ? {
                  label: "Total opt-in rate",
                  value: useMock ? "68.5%" : formattedNotificationOptInRate,
                }
              : undefined,
        };
      }
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
