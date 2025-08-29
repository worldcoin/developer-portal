import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { ReviewMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessageDialog";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { BanMessageDialog } from "../../common/BanMessageDialog";
import { AppStatsGraph } from "./AppStatsGraph";
import { BanStatusSection } from "./BanStatusSection";
import { QuickActionsSection } from "./QuickActionsSection";
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

  return (
    <SizingWrapper className="flex flex-col gap-y-10 py-10">
      <div className="grid gap-y-3">
        <VerificationStatusSection appId={appId} />
        <BanStatusSection appId={appId} />

        <div className="grid gap-y-3">
          <Typography as="h1" variant={TYPOGRAPHY.H5}>
            Overview
          </Typography>
        </div>
      </div>
      <AppStatsGraph appId={appId} />
      <QuickActionsSection appId={appId} teamId={teamId} />

      <ReviewMessageDialog
        appId={appId}
        goTo={urls.configuration({ team_id: teamId, app_id: appId })}
      />
      <BanMessageDialog />
    </SizingWrapper>
  );
};
