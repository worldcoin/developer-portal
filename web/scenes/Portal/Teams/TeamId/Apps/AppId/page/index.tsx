import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { ReviewMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessageDialog";
import { BanMessageDialog } from "../../common/BanMessageDialog";
import { BanStatusSection } from "./BanStatusSection";
import { DashboardWrapper } from "./DashboardWrapper";
import { VerificationStatusSection } from "./VerificationStatusSection";

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
      </div>

      <DashboardWrapper appId={appId} teamId={teamId} />

      <ReviewMessageDialog
        appId={appId}
        goTo={urls.configuration({ team_id: teamId, app_id: appId })}
      />
      <BanMessageDialog />
    </SizingWrapper>
  );
};
