import { TYPOGRAPHY, Typography } from "@/components/Typography";
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
    return (
      <div className="flex h-full items-center justify-center gap-x-2">
        <Typography variant={TYPOGRAPHY.M2}>401</Typography>

        <div className="h-5 w-px bg-grey-400" />

        <Typography variant={TYPOGRAPHY.H6} className="text-grey-400">
          You are not a member of this team
        </Typography>
      </div>
    );
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
