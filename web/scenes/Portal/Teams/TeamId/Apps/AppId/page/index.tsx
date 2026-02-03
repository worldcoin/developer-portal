import { SizingWrapper } from "@/components/SizingWrapper";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { urls } from "@/lib/urls";
import { ReviewMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessageDialog";
import { BanMessageDialog } from "../../common/BanMessageDialog";
import { getSdk as getAppEnvSdk } from "../layout/graphql/server/fetch-app-env.generated";
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
  const appEnvData = await getAppEnvSdk(client).FetchAppEnv({ id: appId });
  const hasRpRegistration =
    (appEnvData.app[0]?.rp_registration?.length ?? 0) > 0;

  return (
    <SizingWrapper className="flex flex-col gap-y-10 py-10">
      <WorldId40MigrationBanner
        teamId={teamId}
        appId={appId}
        hasRpRegistration={hasRpRegistration}
      />

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
