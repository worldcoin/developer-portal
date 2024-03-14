import { Unauthorized } from "@/components/Unauthorized";
import { Auth0SessionUser } from "@/lib/types";
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
    return <Unauthorized message="You are not a member of this team" />;
  }

  return (
    <div>
      <TeamProfile />

      <div className="grid gap-y-14 py-8">
        <Members teamId={teamId} />
        <Apps />
      </div>
    </div>
  );
};

