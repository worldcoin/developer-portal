import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Unauthorized } from "@/components/Unauthorized";
import { Auth0SessionUser } from "@/lib/types";
import { AffiliateProgramBanner } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/page/AffiliateProgramBanner";
import { getSdk as getTeamVerifiedAppsSdk } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/server/graphql/getTeamVerifiedApps.generated";
import { getSession } from "@auth0/nextjs-auth0";
import { TeamProfile } from "../common/TeamProfile";
import { Apps } from "./Apps";
import { Members } from "./Members";

type TeamIdPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const TeamIdPage = async (props: TeamIdPageProps) => {
  const { params } = props;
  const teamId = params?.teamId as `team_${string}`;
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  const isTeamMember = user?.hasura?.memberships?.some(
    (membership) => membership.team?.id === teamId,
  );

  if (!isTeamMember) {
    return (
      <SizingWrapper gridClassName="grow order-2" fullHeight>
        <Unauthorized message="You are not a member of this team" />
      </SizingWrapper>
    );
  }

  const client = await getAPIServiceGraphqlClient();
  const verifiedApps = await getTeamVerifiedAppsSdk(client).GetTeamVerifiedApps(
    {
      teamId,
    },
  );
  const hasVerifiedApps = verifiedApps.app.length > 0;

  return (
    <>
      <SizingWrapper gridClassName="order-1">
        <AffiliateProgramBanner
          teamId={teamId}
          hasVerifiedApps={hasVerifiedApps}
        />
        <TeamProfile />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        <Members teamId={teamId} />

        <div className="order-5 max-md:hidden">
          <Apps />
        </div>
      </SizingWrapper>
    </>
  );
};
