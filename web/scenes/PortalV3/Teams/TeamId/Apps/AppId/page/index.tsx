import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { BanMessageDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/common/BanMessageDialog";
import { getSdk as getAppEnvSdk } from "@/scenes/common/Teams/TeamId/Apps/AppId/layout/graphql/server/fetch-app-env.generated";
import { BanStatusSection } from "./BanStatusSection";
import { DashboardWrapper } from "./DashboardWrapper";
import { QuickActionsSection } from "./QuickActionsSection";
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

  const client = await getAPIServiceGraphqlClient();
  const appEnvData = await getAppEnvSdk(client).FetchAppEnv({ id: appId });
  const appInfo = appEnvData.app[0];
  const hasRpRegistration = (appInfo?.rp_registration?.length ?? 0) > 0;

  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const role = user?.hasura?.memberships?.find(
    (m) => m.team?.id === teamId,
  )?.role;
  const canRegisterRp = role === Role_Enum.Owner || role === Role_Enum.Admin;

  return (
    <div className="px-6 py-10 lg:px-10">
      {/* Banner / status sections self-hide (return null) when not applicable,
          so the flex gap only spaces the sections that actually render. */}
      <div className="flex flex-col gap-8">
        <WorldId40MigrationBanner
          appId={appId}
          hasRpRegistration={hasRpRegistration}
          canRegisterRp={canRegisterRp}
          isStaging={Boolean(appInfo?.is_staging)}
        />

        <VerificationStatusSection appId={appId} teamId={teamId} />
        <BanStatusSection appId={appId} />

        <DashboardWrapper appId={appId} />

        <QuickActionsSection appId={appId} teamId={teamId} />
      </div>

      <BanMessageDialog />
    </div>
  );
};
