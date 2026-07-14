import { SizingWrapper } from "@/components/SizingWrapper";
import { Unauthorized } from "@/components/Unauthorized";
import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { TeamProfile } from "@/scenes/PortalV3/Teams/TeamId/Team/common/TeamProfile";
import { Apps } from "./Apps";
import { Members } from "../sections/Members";

type TeamIdPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const TeamIdPage = async (props: TeamIdPageProps) => {
  const { params } = props;
  const teamId = params?.teamId as `team_${string}`;
  const session = await auth0.getSession();
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

  return (
    <>
      <SizingWrapper gridClassName="order-1">
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
