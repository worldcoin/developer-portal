"use client";

import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";

export type AnalyticsPeriod = "all_time" | "last_7_days";

const periodOptions = [
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "all_time", label: "All Time" },
] satisfies Array<{ label: string; value: AnalyticsPeriod }>;

export const PeriodSelector = (props: {
  onPeriodChange: (period: AnalyticsPeriod) => void;
  period: AnalyticsPeriod;
}) => (
  <Select value={props.period} onChange={props.onPeriodChange}>
    <SelectButton
      aria-label="Unique Verifications period"
      className="flex h-10 items-center justify-center gap-2 rounded-8 border border-portal-border bg-white py-2.5 pr-3 pl-4 font-world text-13 leading-none text-portal-heading transition-colors outline-none hover:bg-portal-canvas focus-visible:ring-2 focus-visible:ring-grey-300"
    >
      <span>
        {periodOptions.find((option) => option.value === props.period)?.label}
      </span>
      <Icon name="chevron-down" className={`size-4 ${opticalIconClassName}`} />
    </SelectButton>
    <SelectOptions>
      {periodOptions.map((option) => (
        <SelectOption
          key={option.value}
          value={option.value}
          className="font-world text-13 text-portal-heading hover:bg-portal-canvas"
        >
          {option.label}
        </SelectOption>
      ))}
    </SelectOptions>
  </Select>
);
