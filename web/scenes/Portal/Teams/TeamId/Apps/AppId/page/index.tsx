"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { ReviewMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessageDialog";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { useState } from "react";
import { BanMessageDialog } from "../../common/BanMessageDialog";
import { AppStatsGraph, TimePeriodSelector } from "./AppStatsGraph";
import type { TimePeriod } from "./AppStatsGraph";
import { BanStatusSection } from "./BanStatusSection";
import { VerificationStatusSection } from "./VerificationStatusSection";

dayjs.extend(advancedFormat);

export enum VerificationStatus {
  Unverified = "unverified",
  AwaitingReview = "awaiting_review",
  ChangesRequested = "changes_requested",
  Verified = "verified",
}

export const AppIdPage = (props: {
  params: {
    teamId: string;
    appId: string;
  };
}) => {
  const { teamId, appId } = props.params;
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");

  return (
    <SizingWrapper className="flex flex-col gap-y-10 py-10">
      <div className="grid gap-y-3">
        <VerificationStatusSection appId={appId} />
        <BanStatusSection appId={appId} />

        <div className="flex items-center justify-between">
          <Typography variant={TYPOGRAPHY.H6} className="text-gray-900">
            Overview
          </Typography>
          <TimePeriodSelector
            timePeriod={timePeriod}
            onTimePeriodChange={setTimePeriod}
          />
        </div>
      </div>

      <AppStatsGraph
        appId={appId}
        teamId={teamId}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
      />

      <ReviewMessageDialog
        appId={appId}
        goTo={urls.configuration({ team_id: teamId, app_id: appId })}
      />
      <BanMessageDialog />
    </SizingWrapper>
  );
};
