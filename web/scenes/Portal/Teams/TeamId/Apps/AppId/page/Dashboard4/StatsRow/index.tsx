"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";

export type TimePeriod = "weekly" | "all-time";

interface StatItemProps {
  label: string;
  value: number | undefined | null;
  changePercent?: number | null;
  isLoading: boolean;
}

// Arrow icon for the change badge
const ChangeArrowIcon = ({ direction }: { direction: "up" | "down" | "neutral" }) => (
  <div className="flex size-4 items-center justify-center rounded-full bg-gray-50">
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(
        direction === "up" && "rotate-0 text-system-success-500",
        direction === "down" && "rotate-180 text-system-error-500",
        direction === "neutral" && "rotate-90 text-gray-400"
      )}
    >
      <path
        d="M6 9V3M6 3L3.5 5.5M6 3L8.5 5.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const StatItem = ({ label, value, changePercent, isLoading }: StatItemProps) => {
  const formatValue = (val: number | undefined | null) => {
    if (val === undefined || val === null) return "0";
    return val.toLocaleString();
  };

  const getChangeDirection = (change: number | null | undefined): "up" | "down" | "neutral" => {
    if (change === null || change === undefined || change === 0) {
      return "neutral";
    }
    return change > 0 ? "up" : "down";
  };

  const getChangeColor = (change: number | null | undefined) => {
    if (change === null || change === undefined || change === 0) {
      return "text-gray-400";
    }
    return change > 0 ? "text-system-success-500" : "text-system-error-500";
  };

  const displayPercent = changePercent ?? 0;

  return (
    <div className="flex flex-col gap-y-0.5">
      <span className="font-gta text-xs font-normal leading-4 text-gray-400">
        {label}
      </span>

      <div className="flex items-end gap-x-2">
        {isLoading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography
            variant={TYPOGRAPHY.H6}
            className="text-zinc-900"
          >
            {formatValue(value)}
          </Typography>
        )}

        {!isLoading && changePercent !== null && changePercent !== undefined && (
          <div className="flex h-5 items-center gap-x-1">
            <ChangeArrowIcon direction={getChangeDirection(changePercent)} />
            <span className={clsx("font-gta text-xs font-medium leading-4", getChangeColor(changePercent))}>
              {Math.abs(changePercent).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const Divider = () => (
  <div className="hidden h-6 w-0 border border-gray-200 md:block" />
);

const timePeriodOptions = [
  { value: "weekly" as TimePeriod, label: "Weekly" },
  { value: "all-time" as TimePeriod, label: "All time" },
];

export interface StatsRowProps {
  impressions: number | undefined | null;
  impressionsChange?: number | null;
  sessions: number | undefined | null;
  sessionsChange?: number | null;
  users: number | undefined | null;
  usersChange?: number | null;
  newUsers: number | undefined | null;
  newUsersChange?: number | null;
  isLoading: boolean;
}

interface TimePeriodSelectorProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export const TimePeriodSelector = ({
  timePeriod,
  onTimePeriodChange,
}: TimePeriodSelectorProps) => {
  return (
    <Select value={timePeriod} onChange={onTimePeriodChange}>
      <SelectButton className="flex h-10 w-32 items-center justify-between rounded-lg border border-gray-200 bg-white px-4">
        <span className="font-gta text-base font-normal text-zinc-700">
          {timePeriodOptions.find((o) => o.value === timePeriod)?.label}
        </span>
        <CaretIcon className="size-5 text-gray-400" />
      </SelectButton>
      <SelectOptions>
        {timePeriodOptions.map((option) => (
          <SelectOption
            key={option.value}
            value={option.value}
            className="font-gta text-base text-zinc-700 hover:bg-gray-50"
          >
            {option.label}
          </SelectOption>
        ))}
      </SelectOptions>
    </Select>
  );
};

export const StatsRow = ({
  impressions,
  impressionsChange,
  sessions,
  sessionsChange,
  users,
  usersChange,
  newUsers,
  newUsersChange,
  isLoading,
}: Omit<StatsRowProps, "timePeriod" | "onTimePeriodChange">) => {
  return (
    <>
      {/* Mobile: 2x2 grid */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        <StatItem
          label="Impressions"
          value={impressions}
          changePercent={impressionsChange}
          isLoading={isLoading}
        />
        <StatItem
          label="Sessions"
          value={sessions}
          changePercent={sessionsChange}
          isLoading={isLoading}
        />
        <StatItem
          label="Users"
          value={users}
          changePercent={usersChange}
          isLoading={isLoading}
        />
        <StatItem
          label="New users"
          value={newUsers}
          changePercent={newUsersChange}
          isLoading={isLoading}
        />
      </div>

      {/* Desktop: horizontal row with dividers */}
      <div className="hidden md:flex md:items-center md:gap-8">
        <StatItem
          label="Impressions"
          value={impressions}
          changePercent={impressionsChange}
          isLoading={isLoading}
        />
        <Divider />
        <StatItem
          label="Sessions"
          value={sessions}
          changePercent={sessionsChange}
          isLoading={isLoading}
        />
        <Divider />
        <StatItem
          label="Users"
          value={users}
          changePercent={usersChange}
          isLoading={isLoading}
        />
        <Divider />
        <StatItem
          label="New users"
          value={newUsers}
          changePercent={newUsersChange}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};
