"use client";
import { atom, useAtom } from "jotai";
import { StatCard } from "../StatCard";
import { Timespan, TimespanSelector } from "../TimespanSelector";
import { useGetMetrics } from "./use-get-metrics";

export const timespans: Timespan[] = [
  { label: "All time", value: "all-time" },
  { label: "Weekly", value: "week" },
];

export const timespanAtom = atom(timespans[0]);
const calculatePercentChange = (
  current: number | undefined,
  previous: number | undefined,
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
  allTimeValue: number | undefined;
  weekValue: number | undefined;
  timespanValue: Timespan["value"];
}) => {
  return timespanValue === "all-time" ? allTimeValue : weekValue;
};

export const StatCards = ({ appId }: { appId: string }) => {
  const [timespan] = useAtom(timespanAtom);
  const timespanValue = timespan.value;

  const { metrics: appMetrics } = useGetMetrics(appId);

  const impressionsTotal = appMetrics?.impressions;
  const impressionsLast7Days = appMetrics?.impressions_7days;
  const impressionsPercentageChange = calculatePercentChange(
    impressionsTotal,
    impressionsLast7Days,
  );

  const uniqueUsers = appMetrics?.unique_users;
  const uniqueUsersLast7Days = appMetrics?.unique_users_7days;

  const usersTotal = appMetrics?.users;
  const usersLast7Days = appMetrics?.users_7days;
  const usersPercentageChange = calculatePercentChange(
    usersTotal,
    usersLast7Days,
  );

  return (
    <>
      <div className="flex flex-col items-end gap-y-6">
        <TimespanSelector options={timespans} atom={timespanAtom} />

        <div className="flex w-full items-center justify-between gap-x-6">
          <StatCard
            mainColorClassName="bg-blue-500"
            title="Impressions"
            value={resolveStatValue({
              allTimeValue: impressionsTotal,
              weekValue: impressionsLast7Days,
              timespanValue,
            })}
            changePercentage={impressionsPercentageChange}
          />
          <StatCard
            mainColorClassName="bg-blue-500"
            title="New users"
            value={resolveStatValue({
              allTimeValue: usersTotal,
              weekValue: usersLast7Days,
              timespanValue,
            })}
            changePercentage={usersPercentageChange}
          />
          <StatCard
            mainColorClassName="bg-blue-500"
            title="Sessions"
            value={resolveStatValue({
              allTimeValue: usersTotal,
              weekValue: usersLast7Days,
              timespanValue,
            })}
          />
          <StatCard
            mainColorClassName="bg-blue-500"
            title="Users"
            value={resolveStatValue({
              allTimeValue: uniqueUsers,
              weekValue: uniqueUsersLast7Days,
              timespanValue,
            })}
          />
          <div className="h-6 w-px bg-grey-200" />
        </div>
      </div>
      <hr className="border border-grey-200" />
    </>
  );
};
