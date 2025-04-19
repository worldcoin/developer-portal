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
import { useMemo } from "react";
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
    () => transactionsData?.accumulativeTransactions,
    [transactionsData?.accumulativeTransactions],
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
  // ========================== Anchor: Render Notification Graph Content ============================
  // ==================================================================================================
  const renderNotificationGraphContent = (
    formattedData: ChartProps["data"],
    options: ChartOptions<"line">,
  ) => {
    const notificationData = formattedData.y[0].data;
    const lastDataPoint = notificationData[notificationData.length - 1];
    const lastOpenRateValue =
      typeof lastDataPoint === "number" ? lastDataPoint.toFixed(1) : "NA";

    return (
      <>
        <div className="pl-6">
          <Stat
            title="Notifications open rate"
            valueSuffix="%"
            // TODO DEV-1153
            // changePercentage={0}
            value={lastOpenRateValue}
          />
        </div>
        <Chart data={formattedData} options={options} />
      </>
    );
  };

  return (
    <div className="grid flex-1 grid-cols-1 grid-rows-2 gap-2 lg:grid-cols-2 lg:grid-rows-1">
      {/* ======================================================== */}
      {/* ================== Verifications Graph ================== */}
      {/* ======================================================== */}
      <div className="flex-1">
        {appStatsLoading && (
          <div className="aspect-[580/350] w-full rounded-2xl">
            <Skeleton className="inset-0 size-full rounded-2xl" />
          </div>
        )}
        {!appStatsLoading && !formattedVerificationsChartData && (
          <div
            className={clsx(
              {
                "size-full":
                  transactionsLoading || formattedTransactionsChartData,
                "aspect-[580/350]":
                  !transactionsLoading && !formattedTransactionsChartData,
              },
              "pointer-events-none grid w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12",
            )}
          >
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-500">
              {engine === EngineType.OnChain
                ? "Analytics are not available for on-chain apps yet"
                : "No data available yet"}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R4}
              className="text-14 text-grey-400"
            >
              {engine === EngineType.OnChain
                ? "Please refer to your smart contract for verification data"
                : "Your verification numbers will show up here."}
            </Typography>
          </div>
        )}
        {!appStatsLoading && formattedVerificationsChartData && (
          <div className="block rounded-2xl border border-grey-200 py-5 sm:hidden">
            <div className="grid grid-cols-2 pl-6">
              <Stat
                title="Verifications"
                mainColorClassName="bg-additional-blue-500"
                // TODO DEV-1153
                // changePercentage={0}
                value={totalVerifications}
              />
              <Stat
                title="Unique users"
                mainColorClassName="bg-additional-sea-500"
                // TODO DEV-1153
                // changePercentage={0}
                value={totalUniqueUsers}
              />
            </div>
            <Chart
              data={formattedVerificationsChartData}
              options={{
                aspectRatio: 580 / 350,
                ...commonChartConfig,
              }}
            />
          </div>
        )}
        {!appStatsLoading && formattedVerificationsChartData && (
          <div className="hidden rounded-2xl border border-grey-200 py-5 sm:block ">
            <div className="grid grid-cols-2 pl-6">
              <Stat
                title="Verifications"
                mainColorClassName="bg-additional-blue-500"
                // TODO DEV-1153
                // changePercentage={0}
                value={totalVerifications}
              />
              <Stat
                title="Unique users"
                mainColorClassName="bg-additional-sea-500"
                // TODO DEV-1153
                // changePercentage={0}
                value={totalUniqueUsers}
              />
            </div>
            <Chart
              data={formattedVerificationsChartData}
              options={commonChartConfig}
            />
          </div>
        )}
      </div>
      {/* ======================================================== */}
      {/* ====================== Payments Graph ================== */}
      {/* ======================================================== */}
      <div className="flex-1">
        {transactionsLoading && (
          <div className="aspect-[580/350] w-full rounded-2xl">
            <Skeleton className="inset-0 size-full rounded-2xl" />
          </div>
        )}
        {!transactionsLoading && !formattedTransactionsChartData && (
          <div
            className={clsx(
              {
                "size-full":
                  transactionsLoading || formattedTransactionsChartData,
                "aspect-[580/350]":
                  !transactionsLoading && !formattedTransactionsChartData,
              },
              "pointer-events-none grid w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12",
            )}
          >
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-500">
              No data available yet
            </Typography>

            <Typography
              variant={TYPOGRAPHY.R4}
              className="text-14 text-grey-400"
            >
              Your payment numbers will show up here.
            </Typography>
          </div>
        )}
        {!transactionsLoading && formattedTransactionsChartData && (
          <div className="block rounded-2xl border border-grey-200 py-5 pr-6 sm:hidden">
            <div className="pl-6">
              <Stat
                title="Payments"
                valuePrefix="$"
                // TODO DEV-1153
                // changePercentage={0}
                value={accumulatedTransactionAmountUSD}
              />
            </div>
            <Chart
              data={formattedTransactionsChartData}
              options={{
                aspectRatio: 580 / 350,
                ...commonChartConfig,
              }}
            />
          </div>
        )}
        {!transactionsLoading && formattedTransactionsChartData && (
          <div className="hidden rounded-2xl border border-grey-200 py-5 sm:block ">
            <div className="pl-6">
              <Stat
                title="Payments"
                valuePrefix="$"
                // TODO DEV-1153
                // changePercentage={0}
                value={accumulatedTransactionAmountUSD}
              />
            </div>
            <Chart
              data={formattedTransactionsChartData}
              options={commonChartConfig}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ================== Notifications Graph ================== */}
      {/* ======================================================== */}
      <div className="flex-1">
        {metricsLoading && (
          <div className="aspect-[580/350] w-full rounded-2xl">
            <Skeleton className="inset-0 size-full rounded-2xl" />
          </div>
        )}
        {!metricsLoading && !formattedNotificationOpenRateChartData && (
          <div
            className={clsx(
              {
                "size-full":
                  metricsLoading || formattedNotificationOpenRateChartData,
                "aspect-[580/350]":
                  !metricsLoading && !formattedNotificationOpenRateChartData,
              },
              "pointer-events-none grid w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12",
            )}
          >
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-500">
              No data available yet
            </Typography>

            <Typography
              variant={TYPOGRAPHY.R4}
              className="text-14 text-grey-400"
            >
              Your notification open rate will show up here.
            </Typography>
          </div>
        )}
        {!metricsLoading && formattedNotificationOpenRateChartData && (
          <div className="block rounded-2xl border border-grey-200 py-5 pr-6 sm:hidden">
            {renderNotificationGraphContent(
              formattedNotificationOpenRateChartData,
              {
                aspectRatio: 580 / 350,
                ...commonChartConfig,
              },
            )}
          </div>
        )}
        {!metricsLoading && formattedNotificationOpenRateChartData && (
          <div className="hidden rounded-2xl border border-grey-200 py-5 sm:block ">
            {renderNotificationGraphContent(
              formattedNotificationOpenRateChartData,
              commonChartConfig,
            )}
          </div>
        )}
      </div>
    </div>
  );
};
