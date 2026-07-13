"use client";

import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import type { TrendPeriod } from "@/lib/day-buckets";
import { Icon } from "@/scenes/PortalV3/common/Icon";

const timePeriodOptions = [
  { value: "all-time", label: "All time" },
  { value: "weekly", label: "Weekly" },
] satisfies Array<{ value: TrendPeriod; label: string }>;

export const PeriodSelector = (props: {
  timePeriod: TrendPeriod;
  onTimePeriodChange: (period: TrendPeriod) => void;
}) => (
  <Select value={props.timePeriod} onChange={props.onTimePeriodChange}>
    <SelectButton
      aria-label="Trend period"
      className="flex h-10 items-center justify-center gap-2 rounded-8 border border-portal-border bg-white py-2.5 pr-3 pl-4 font-world text-13 leading-none text-portal-ink transition-colors outline-none hover:bg-portal-canvas focus-visible:ring-2 focus-visible:ring-grey-300"
    >
      <span>
        {timePeriodOptions.find((option) => option.value === props.timePeriod)
          ?.label ?? "All time"}
      </span>
      <Icon name="chevron-down" className="size-4" />
    </SelectButton>
    <SelectOptions>
      {timePeriodOptions.map((option) => (
        <SelectOption
          key={option.value}
          value={option.value}
          className="font-world text-13 text-portal-ink hover:bg-portal-canvas"
        >
          {option.label}
        </SelectOption>
      ))}
    </SelectOptions>
  </Select>
);
