import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
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

  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const role = user?.hasura?.memberships?.find(
    (m) => m.team?.id === teamId,
  )?.role;
  const canRegisterRp = role === Role_Enum.Owner || role === Role_Enum.Admin;

  return (
    <SizingWrapper className="flex flex-col gap-y-8 py-4">
      <WorldId40MigrationBanner
        teamId={teamId}
        appId={appId}
        hasRpRegistration={hasRpRegistration}
        canRegisterRp={canRegisterRp}
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
