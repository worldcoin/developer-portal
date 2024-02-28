"use client";

import { atom, useAtom } from "jotai";

import {
  FetchAppStatsQuery,
  useFetchAppStatsQuery,
} from "./graphql/client/fetch-app-stats.generated";

import { Chart, ChartProps } from "@/components/Chart";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType } from "@/lib/types";
import { ChartData } from "chart.js";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { StatCard } from "./StatCard";
import { Timespan, TimespanSelector } from "./TimespanSelector";

dayjs.extend(utc);
dayjs.extend(tz);

const timespans: Timespan[] = [
  { label: "Daily", value: "day" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Yearly", value: "year" },
];

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

const timespanAtom = atom(timespans[0]);

const calculatePercentageChange = (
  arr: FetchAppStatsQuery["app_stats"] | undefined,
  key: keyof FetchAppStatsQuery["app_stats"][number],
) => {
  if (!arr || arr.length < 2) {
    return 0;
  }

  const current = arr[arr.length - 1][key];
  const previous = arr[arr.length - 2][key];

  const percentageChange = ((current - previous) / previous) * 100;

  if (current < previous) {
    return -percentageChange;
  }

  return percentageChange;
};

export const AppStatsGraph = () => {
  const { teamId, appId } = useParams() as { teamId: string; appId: string };
  const [timespan] = useAtom(timespanAtom);

  const startsAt = useMemo(() => {
    switch (timespan.value) {
      case "day":
        return dayjs().startOf("week").tz().toISOString();
      case "week":
        return dayjs().startOf("month").tz().toISOString();
      case "month":
        return dayjs().startOf("year").tz().toISOString();
      case "year":
        return dayjs().subtract(2, "years").tz().toISOString();
    }
  }, [timespan.value]);

  const { data, loading } = useFetchAppStatsQuery({
    variables: {
      appId,
      startsAt,
      timeSpan: timespan.value,
    },
  });

  const stats = useMemo(() => data?.app_stats, [data?.app_stats]);
  const engine = useMemo(() => data?.app?.[0]?.engine, [data?.app]);

  const labelDateFormat = useMemo(() => {
    switch (timespan.value) {
      case "month":
        return "MMM";
      case "week":
        return "D MMM";
      case "day":
        return "D MMM";
      case "year":
        return "YYYY";
    }
  }, [timespan.value]);

  const formattedData = useMemo(() => {
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
  }, [labelDateFormat, stats]);

  const totalVerifications = useMemo(() => {
    if (loading || !stats) {
      return null;
    }

    if (!stats[stats.length - 1]) {
      return 0;
    }

    return stats[stats.length - 1].verifications;
  }, [loading, stats]);

  const totalUnique = useMemo(() => {
    if (loading || !stats) {
      return null;
    }

    if (!stats[stats.length - 1]) {
      return 0;
    }

    return stats[stats.length - 1].unique_users;
  }, [loading, stats]);

  const verificationPercentageChange = useMemo(
    () => calculatePercentageChange(stats, "verifications"),
    [stats],
  );

  const uniquePercentageChange = useMemo(
    () => calculatePercentageChange(stats, "unique_users"),
    [stats],
  );

  return (
    <div className="grid gap-y-6">
      <div className="flex flex-col items-center justify-between gap-y-4 md:flex-row">
        <div className="flex items-center gap-x-6">
          <StatCard
            mainColorClassName="bg-blue-500"
            title="Verifications"
            value={totalVerifications}
            changePercentage={verificationPercentageChange}
          />

          <div className="h-6 w-px bg-grey-200" />

          <StatCard
            mainColorClassName="bg-[#00C3B6]"
            title="Unique users"
            value={totalUnique}
            changePercentage={uniquePercentageChange}
          />
        </div>

        <TimespanSelector options={timespans} atom={timespanAtom} />
      </div>

      {formattedData && (
        <div className="block sm:hidden">
          <Chart data={formattedData} options={{ aspectRatio: 580 / 350 }} />
        </div>
      )}
      {formattedData && (
        <div className="hidden sm:block">
          <Chart data={formattedData} />
        </div>
      )}

      {loading && (
        <div className="aspect-[580/350] w-full rounded-2xl sm:aspect-[1180/350]">
          <Skeleton className=" inset-0 size-full rounded-2xl" />
        </div>
      )}

      {!loading && !formattedData && (
        <div className="pointer-events-none grid aspect-[580/350] w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200 px-12 sm:aspect-[1180/350]">
          <Typography variant={TYPOGRAPHY.H7} className="text-grey-500">
            {engine === EngineType.OnChain
              ? "Analytics are not available for on-chain apps yet"
              : "No data available yet"}
          </Typography>

          <Typography variant={TYPOGRAPHY.R4} className="text-14 text-grey-400">
            {engine === EngineType.OnChain
              ? "Please refer to your smart contract for verification data"
              : "Your verification numbers will show up here."}
          </Typography>
        </div>
      )}
    </div>
  );
};
