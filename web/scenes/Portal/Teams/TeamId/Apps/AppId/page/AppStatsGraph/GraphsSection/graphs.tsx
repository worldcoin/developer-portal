"use client";

import { useFetchAppStatsQuery } from "../graphql/client/fetch-app-stats.generated";

import { Chart, ChartProps } from "@/components/Chart";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType, PaymentMetadata } from "@/lib/types";
import { ChartData } from "chart.js";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { timespanAtom } from "../StatCards";

dayjs.extend(utc);
dayjs.extend(tz);

const defaultDatasetConfig: Partial<ChartData<"line">["datasets"][number]> = {
  pointRadius: 0,
  pointBorderWidth: 1,
  pointHoverBorderColor: "#FFFFFF",
  pointHitRadius: 16,
  pointHoverRadius: 4,
  tension: 0,
};

const verificationsDatasetConfig: Partial<
  ChartData<"line">["datasets"][number]
> = {
  ...defaultDatasetConfig,
  borderColor: "#4940E0",
  backgroundColor: "#4940E0",
};

const uniqueUsersDatasetConfig: Partial<ChartData<"line">["datasets"][number]> =
  {
    ...defaultDatasetConfig,
    borderColor: "#00C3B6",
    backgroundColor: "#00C3B6",
  };

const startsAt = new Date(0).toISOString();

export const Graphs = ({}: {
  data: {
    transactions: PaymentMetadata[];
    verifications: number[];
    uniqueUsers: number[];
  };
}) => {
  const { appId } = useParams() as { teamId: string; appId: string };
  const [timespan] = useAtom(timespanAtom);

  const { data, loading } = useFetchAppStatsQuery({
    variables: {
      appId,
      startsAt,
      timeSpan: timespan.value,
    },
  });

  const stats = useMemo(() => data?.app_stats, [data?.app_stats]);
  const engine = useMemo(() => data?.app?.[0]?.engine, [data?.app]);

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
      formattedData.x.push(
        dayjs(stat.date)
          .format
          // labelDateFormat
          (),
      );
      formattedData.y[0].data.push(stat.verifications);
      formattedData.y[1].data.push(stat.unique_users);
    });

    return formattedData;
  }, [, stats]);

  const formattedTransactionsChartData = useMemo(() => {
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
      formattedData.x.push(
        dayjs(stat.date)
          .format
          // labelDateFormat
          (),
      );
      formattedData.y[0].data.push(stat.verifications);
      formattedData.y[1].data.push(stat.unique_users);
    });

    return formattedData;
  }, [stats]);

  return (
    <>
      {formattedVerificationsChartData && (
        <div className="block sm:hidden">
          <Chart
            data={formattedVerificationsChartData}
            options={{ aspectRatio: 580 / 350 }}
          />
        </div>
      )}
      {formattedVerificationsChartData && (
        <div className="hidden sm:block">
          <Chart data={formattedVerificationsChartData} />
        </div>
      )}

      {formattedTransactionsChartData && (
        <div className="block sm:hidden">
          <Chart
            data={formattedTransactionsChartData}
            options={{ aspectRatio: 580 / 350 }}
          />
        </div>
      )}
      {formattedTransactionsChartData && (
        <div className="hidden sm:block">
          <Chart data={formattedTransactionsChartData} />
        </div>
      )}

      {loading && (
        <div className="aspect-[580/350] w-full rounded-2xl sm:aspect-[1180/350]">
          <Skeleton className=" inset-0 size-full rounded-2xl" />
        </div>
      )}
      <div className="flex flex-row gap-2">
        {!loading && !formattedVerificationsChartData && (
          <div className="pointer-events-none grid aspect-[580/350] w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12 sm:aspect-[1180/350]">
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
        {!loading && !formattedTransactionsChartData && (
          <div className="pointer-events-none grid aspect-[580/350] w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12 sm:aspect-[1180/350]">
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
      </div>
    </>
  );
};
