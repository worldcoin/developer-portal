import { SizingWrapper } from "@/components/SizingWrapper";
import { BanMessageDialog } from "../../common/BanMessageDialog";
import { fetchAppEnvCached } from "../layout/server/fetch-app-env";
import { BanStatusSection } from "./BanStatusSection";
import { DashboardWrapper } from "./DashboardWrapper";
import { VerificationStatusSection } from "./VerificationStatusSection";
import { WorldId40MigrationBanner } from "./WorldId40MigrationBanner";

export enum VerificationStatus {
  Unverified = "unverified",
  AwaitingReview = "awaiting_review",
  ChangesRequested = "changes_requested",
  Verified = "verified",
}

export const AppIdPage = async (props: {
  params: Promise<{
    teamId: string;
    appId: string;
  }>;
}) => {
  const { teamId, appId } = await props.params;

  const appEnvData = await fetchAppEnvCached(appId);
  const appInfo = appEnvData.app[0];
  const hasRpRegistration = (appInfo?.rp_registration?.length ?? 0) > 0;

  return (
    <SizingWrapper className="flex flex-col gap-y-8 py-4">
      <WorldId40MigrationBanner
        teamId={teamId}
        appId={appId}
        hasRpRegistration={hasRpRegistration}
        isStaging={Boolean(appInfo?.is_staging)}
      />

      <div className="grid gap-y-3">
        <VerificationStatusSection appId={appId} teamId={teamId} />
        <BanStatusSection appId={appId} />
      </div>

      <DashboardWrapper appId={appId} teamId={teamId} />

      <BanMessageDialog />
    </SizingWrapper>
  );
};
