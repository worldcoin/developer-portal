"use client";
import { atom, useAtom } from "jotai";
import { StatCard } from "../StatCard";
import { Timespan, TimespanSelector } from "../TimespanSelector";
import { useGetMetrics } from "./use-get-metrics";

export const timespans: Timespan[] = [
  { label: "Weekly", value: "week" },
  { label: "All time", value: "all-time" },
];

export const timespanAtom = atom(timespans[0]);
const calculatePercentChange = (
  current: number | undefined | null,
  previous: number | undefined | null,
) => {
  if (!current || !previous) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
};

const resolveStatValue = ({
  allTimeValue,
  weekValue,
  timespanValue,
}: {
  allTimeValue: number | undefined | null;
  weekValue: number | undefined | null;
  timespanValue: Timespan["value"];
}) => {
  return timespanValue === "all-time" ? allTimeValue : weekValue;
};

export const StatCards = ({ appId }: { appId: string }) => {
  const [timespan] = useAtom(timespanAtom);
  const timespanValue = timespan.value;

  const { metrics: appMetrics, loading: isMetricsLoading } =
    useGetMetrics(appId);

  const impressionsTotal = appMetrics?.total_impressions;
  const impressionsLast7Days = appMetrics?.total_impressions_last_7_days;
  const impressionsPercentageChange = calculatePercentChange(
    impressionsTotal,
    impressionsLast7Days,
  );

  const uniqueUsers = appMetrics?.unique_users;
  const uniqueUsersLast7Days = appMetrics?.unique_users_last_7_days;

  const usersTotal = appMetrics?.total_users;
  const usersLast7Days = appMetrics?.total_users_last_7_days;

  const newUsersLast7Days = appMetrics?.new_users_last_7_days;

  return (
    <>
      <div className="flex flex-col items-end gap-y-6">
        <TimespanSelector options={timespans} atom={timespanAtom} />

        <div className="grid w-full grid-cols-1 grid-rows-4 items-start justify-between gap-x-6 sm:grid-cols-2 sm:grid-rows-2 md:flex-row md:items-center lg:grid-cols-4 lg:grid-rows-1">
          <StatCard
            mainColorClassName="bg-blue-500"
            title="Impressions"
            value={resolveStatValue({
              allTimeValue: impressionsTotal,
              weekValue: impressionsLast7Days,
              timespanValue,
            })}
            changePercentage={impressionsPercentageChange}
            isLoading={isMetricsLoading}
          />
          <StatCard
            mainColorClassName="bg-blue-500"
            title="Sessions"
            value={resolveStatValue({
              allTimeValue: usersTotal,
              weekValue: usersLast7Days,
              timespanValue,
            })}
            isLoading={isMetricsLoading}
          />
          <StatCard
            mainColorClassName="bg-blue-500"
            title="Users"
            value={resolveStatValue({
              allTimeValue: uniqueUsers,
              weekValue: uniqueUsersLast7Days,
              timespanValue,
            })}
            isLoading={isMetricsLoading}
          />
          {timespanValue === "week" && (
            <StatCard
              mainColorClassName="bg-blue-500"
              title="New users"
              value={resolveStatValue({
                allTimeValue: uniqueUsers,
                weekValue: newUsersLast7Days,
                timespanValue,
              })}
              isLoading={isMetricsLoading}
            />
          )}
        </div>
      </div>
    </>
  );
};
