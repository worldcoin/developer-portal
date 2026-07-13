"use client";

import { CopyButton } from "@/components/CopyButton";
import type { TrendPeriod } from "@/lib/day-buckets";
import { PeriodSelector } from "../../common/PeriodSelector";
import { TrendSparkline } from "../../common/TrendSparkline";
import type { TrendSparklineState } from "../../common/TrendSparkline";

const HeroStat = (props: { label: string; value: number }) => (
  <div className="flex flex-col gap-1">
    <span className="font-world text-13 text-portal-muted">{props.label}</span>
    <span className="font-world text-26 font-medium text-portal-heading">
      {props.value.toLocaleString()}
    </span>
  </div>
);

export const HeroCard = (props: {
  name: string;
  appId: string;
  uniqueVerifications: number;
  week: number;
  timePeriod: TrendPeriod;
  onTimePeriodChange: (period: TrendPeriod) => void;
  trendRangeLabel: string;
  trendState: TrendSparklineState;
}) => (
  <div className="rounded-[10px] border border-portal-border bg-white p-6 shadow-portal-card">
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-world text-19 font-medium text-portal-heading">
          {props.name}
        </span>
        <span className="flex items-center gap-1 rounded-8 bg-portal-canvas px-2 py-1">
          <span className="font-ibm text-12 text-portal-muted">
            {props.appId}
          </span>
          <CopyButton
            fieldName="App ID"
            fieldValue={props.appId}
            className="text-portal-muted"
          />
        </span>
      </div>
      <PeriodSelector
        timePeriod={props.timePeriod}
        onTimePeriodChange={props.onTimePeriodChange}
      />
    </div>

    <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap gap-x-12 gap-y-6">
        <HeroStat
          label="Unique verifications"
          value={props.uniqueVerifications}
        />
        <HeroStat label="This week" value={props.week} />
      </div>
      <TrendSparkline
        state={props.trendState}
        rangeLabel={props.trendRangeLabel}
        variant="hero"
      />
    </div>
  </div>
);
