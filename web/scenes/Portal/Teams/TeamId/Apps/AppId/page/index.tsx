import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { SizingWrapper } from "@/components/SizingWrapper";
import { getSdk as getTeamVerifiedAppsSdk } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/server/graphql/getTeamVerifiedApps.generated";
import { BanMessageDialog } from "../../common/BanMessageDialog";
import { getSdk as getAppEnvSdk } from "../layout/graphql/server/fetch-app-env.generated";
import { AffiliateProgramBanner } from "./AffiliateProgramBanner";
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
  params: {
    teamId: string;
    appId: string;
  };
}) => {
  const { teamId, appId } = props.params;

  const client = await getAPIServiceGraphqlClient();
  const [appEnvData, verifiedApps] = await Promise.all([
    getAppEnvSdk(client).FetchAppEnv({ id: appId }),
    getTeamVerifiedAppsSdk(client).GetTeamVerifiedApps({ teamId }),
  ]);
  const hasRpRegistration =
    (appEnvData.app[0]?.rp_registration?.length ?? 0) > 0;
  const hasVerifiedApps = verifiedApps.app.length > 0;

  return (
    <SizingWrapper className="flex flex-col gap-y-8 py-4">
      <AffiliateProgramBanner
        teamId={teamId}
        hasVerifiedApps={hasVerifiedApps}
        className="mt-6"
      />

      <WorldId40MigrationBanner
        teamId={teamId}
        appId={appId}
        hasRpRegistration={hasRpRegistration}
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
