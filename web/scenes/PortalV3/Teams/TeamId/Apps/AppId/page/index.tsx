import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Role_Enum } from "@/graphql/graphql";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { BanMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/BanMessageDialog";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { FetchAppEnvQuery } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/graphql/server/fetch-app-env.generated";
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

  // Single source of app-env for this navigation. `fetchAppEnvCached` is
  // React `cache()`-wrapped, so the World ID sub-tabs (AppWorldIdSubTabs) reuse
  // this exact result rather than issuing a second FetchAppEnv. The layout no
  // longer fetches app-env, so failures surface here — don't mask an upstream
  // dependency failure as an empty dashboard.
  let appEnvData: FetchAppEnvQuery;
  try {
    appEnvData = await fetchAppEnvCached(appId);
  } catch (error) {
    logger.error("AppIdPage (v3) FetchAppEnv failed", { error, appId, teamId });
    return <ErrorPage statusCode={500} title="Failed to load app" />;
  }

  const appInfo = appEnvData.app[0];
  const hasRpRegistration = (appInfo?.rp_registration?.length ?? 0) > 0;

  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const role = user?.hasura?.memberships?.find(
    (m) => m.team?.id === teamId,
  )?.role;
  const canRegisterRp = role === Role_Enum.Owner || role === Role_Enum.Admin;

  return (
    <SizingWrapper className="flex flex-col gap-y-8 py-4">
      <WorldId40MigrationBanner
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
