import { TeamProfile } from "../common/TeamProfile";
import { Apps } from "./Apps";
import { Members } from "./Members";

type TeamIdPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const TeamIdPage = (props: TeamIdPageProps) => {
  const { params } = props;
  const teamId = params?.teamId as `team_${string}`;
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
