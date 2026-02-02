"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useState } from "react";
import { AppStatsGraph, TimePeriodSelector } from "./AppStatsGraph";
import type { TimePeriod } from "./AppStatsGraph";

interface DashboardWrapperProps {
  appId: string;
  teamId: string;
}

export const DashboardWrapper = ({ appId, teamId }: DashboardWrapperProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");

  return (
    <>
      <div className="flex items-center justify-between">
        <Typography variant={TYPOGRAPHY.H6} className="text-gray-900">
          Overview
        </Typography>
        <TimePeriodSelector
          timePeriod={timePeriod}
          onTimePeriodChange={setTimePeriod}
        />
      </div>

      <AppStatsGraph
        appId={appId}
        teamId={teamId}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
      />
    </>
  );
};
