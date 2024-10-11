"use client";

import { useFetchAppStatsQuery } from "../graphql/client/fetch-app-stats.generated";

import { Chart, ChartProps } from "@/components/Chart";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType, TransactionStatus } from "@/lib/types";
import { ChartData, ChartOptions } from "chart.js";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { Stat } from "./stat";
import { useGetAccumulativeTransactions } from "./use-get-accumulative-transactions";

dayjs.extend(utc);
dayjs.extend(tz);

const labelDateFormat = "MMM YYYY";

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

const commonChartConfig: ChartOptions<"line"> = {
  scales: {
    y: {
      ticks: { display: false },
      grid: {
        lineWidth: 0,
      },
    },
    x: { ticks: { maxTicksLimit: 3 } },
  },
};

const startsAt = new Date(0).toISOString();

export const GraphsSection = () => {
  const { appId } = useParams() as { teamId: string; appId: string };

  const { data: appStatsData, loading: appStatsLoading } =
    useFetchAppStatsQuery({
      variables: {
        appId,
        startsAt,
        timeSpan: "month",
      },
    });

  const { transactions: transactionsData, loading: transactionsLoading } =
    useGetAccumulativeTransactions(appId);

  const transactions = useMemo(
    () => transactionsData?.accumulativeTransactions,
    [transactionsData?.accumulativeTransactions],
  );
  const accumulatedTransactionAmountUSD = useMemo(
    () => transactionsData?.accumulatedAmountUSD,
    [transactionsData?.accumulatedAmountUSD],
  );

  const stats = useMemo(
    () => appStatsData?.app_stats,
    [appStatsData?.app_stats],
  );

  const totalVerifications = useMemo(
    () => appStatsData?.app_stats_aggregate.aggregate?.sum?.verifications ?? 0,
    [appStatsData?.app_stats_aggregate.aggregate?.sum?.verifications],
  );
  const totalUniqueUsers = useMemo(
    () => appStatsData?.app_stats_aggregate.aggregate?.sum?.unique_users ?? 0,
    [appStatsData?.app_stats_aggregate.aggregate?.sum?.unique_users],
  );

  const engine = useMemo(
    () => appStatsData?.app?.[0]?.engine,
    [appStatsData?.app],
  );

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

  return (
    <div className="grid flex-1 grid-cols-1 grid-rows-2 gap-2 lg:grid-cols-2 lg:grid-rows-1">
      <div className="flex-1">
        {appStatsLoading && (
          <div className="aspect-[580/350] w-full rounded-2xl">
            <Skeleton className="inset-0 size-full rounded-2xl" />
          </div>
        )}
        {!appStatsLoading && !formattedVerificationsChartData && (
          <div className="pointer-events-none grid aspect-[580/350] w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12">
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
            <div className="pl-6">
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
            <div className="pl-6">
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
      <div className="flex-1">
        {transactionsLoading && (
          <div className="aspect-[580/350] w-full rounded-2xl">
            <Skeleton className="inset-0 size-full rounded-2xl" />
          </div>
        )}
        {!transactionsLoading && !formattedTransactionsChartData && (
          <div className="pointer-events-none grid aspect-[580/350] w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12">
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
                ? "Please refer to your smart contract for transaction data"
                : "Your transaction numbers will show up here."}
            </Typography>
          </div>
        )}
        {!transactionsLoading && formattedTransactionsChartData && (
          <div className="block rounded-2xl border border-grey-200 py-5 sm:hidden">
            <div className="pl-6">
              <Stat
                title="Transactions"
                valuePrefix="$"
                // TODO DEV-1153
                // changePercentage={0}
                value={accumulatedTransactionAmountUSD}
              />
            </div>
            <Chart
              data={formattedTransactionsChartData}
              options={{
                aspectRatio: 580 / 380,
                ...commonChartConfig,
              }}
            />
          </div>
        )}
        {!transactionsLoading && formattedTransactionsChartData && (
          <div className="hidden rounded-2xl border border-grey-200 py-5 sm:block ">
            <div className="pl-6">
              <Stat
                title="Transactions"
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
    </div>
  );
};
