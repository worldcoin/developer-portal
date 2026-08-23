import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Unauthorized } from "@/components/Unauthorized";
import { Role_Enum } from "@/graphql/graphql";
import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { getSdk as getInitialAppSdk } from "@/scenes/PortalV3/Teams/TeamId/Team/page/graphql/server/apps.generated";
import { AppsPageClient } from "@/scenes/PortalV3/Teams/TeamId/Apps/page/AppsPageClient";
import { Apps } from "./Apps";

type TeamIdPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const TeamIdPage = async (props: TeamIdPageProps) => {
  const { params } = props;
  const teamId = params?.teamId as `team_${string}`;
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];

  const membership = user?.hasura?.memberships?.find(
    (membership) => membership.team?.id === teamId,
  );

  if (!membership) {
    return (
      <SizingWrapper gridClassName="grow order-2" fullHeight>
        <Unauthorized message="You are not a member of this team" />
      </SizingWrapper>
    );
  }

  const client = await getAPIServiceGraphqlClient();
  const { app } = await getInitialAppSdk(client).InitialApp({ teamId });

  // The team root owns both states: onboarding actions before the first app,
  // then the app grid once the team has something to manage.
  if (app.length === 0) {
    return (
      <AppsPageClient
        teamId={teamId}
        initialIsOwner={membership.role === Role_Enum.Owner}
      />
    );
  }

  return (
    <SizingWrapper className="flex flex-col gap-8 py-8">
      <Apps />
    </SizingWrapper>
  );
};
