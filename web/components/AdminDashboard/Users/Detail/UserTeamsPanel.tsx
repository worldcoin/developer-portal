import { UIModule } from "@/components/AdminDashboard/UIModule";
import { fetchAdminUserTeamsPage } from "@/scenes/Admin/users/id/server/fetch-user-teams";

import { UserTeamsInfiniteList } from "./UserTeamsInfiniteList";
import { UserTeamsPanelControls } from "./UserTeamsPanelControls";

type UserTeamsPanelProps = {
  teamsPage: number;
  teamsQuery: string;
  userId: string;
};

export const UserTeamsPanel = async ({
  teamsPage,
  teamsQuery,
  userId,
}: UserTeamsPanelProps) => {
  const { currentPage, teams, totalPages } = await fetchAdminUserTeamsPage({
    page: teamsPage,
    searchQuery: teamsQuery,
    userId,
  });

  return (
    <UIModule className="flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto p-5">
      <div className="flex min-h-6 items-center">
        <h2 className="text-16 font-semibold text-grey-900">Teams</h2>
      </div>
      <div className="shrink-0">
        <UserTeamsPanelControls searchQuery={teamsQuery} />
      </div>
      <div className="min-w-0 pt-1">
        <UserTeamsInfiniteList
          currentPage={currentPage}
          searchQuery={teamsQuery}
          teams={teams}
          totalPages={totalPages}
          userId={userId}
        />
      </div>
    </UIModule>
  );
};
