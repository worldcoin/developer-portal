import { UIModule } from "@/components/AdminDashboard/UIModule";
import { fetchAdminTeamMembersPage } from "@/scenes/Admin/teams/id/server/fetch-team-members";

import { TeamMembersInfiniteList } from "./TeamMembersInfiniteList";
import { TeamMembersPanelControls } from "./TeamMembersPanelControls";

type TeamMembersPanelProps = {
  membersPage: number;
  membersQuery: string;
  teamId: string;
};

export const TeamMembersPanel = async ({
  membersPage,
  membersQuery,
  teamId,
}: TeamMembersPanelProps) => {
  const { currentPage, members, totalPages } = await fetchAdminTeamMembersPage({
    page: membersPage,
    searchQuery: membersQuery,
    teamId,
  });

  return (
    <UIModule className="flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto p-5">
      <div className="flex min-h-6 items-center">
        <h2 className="text-16 font-semibold text-grey-900">Members</h2>
      </div>
      <div className="shrink-0">
        <TeamMembersPanelControls searchQuery={membersQuery} />
      </div>
      <div className="min-w-0 pt-1">
        <TeamMembersInfiniteList
          currentPage={currentPage}
          members={members}
          searchQuery={membersQuery}
          teamId={teamId}
          totalPages={totalPages}
        />
      </div>
    </UIModule>
  );
};
