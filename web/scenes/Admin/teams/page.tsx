import { TeamsTable } from "@/components/AdminDashboard/Teams/Table";
import { UIModule } from "@/components/AdminDashboard/UIModule";

import { fetchAdminTeams } from "./server/fetch-teams";

export const AdminTeamsPage = async () => {
  const { teams, teamsAmount } = await fetchAdminTeams();

  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-4">
        <h1 className="text-lg font-medium">Teams</h1>
        <div className="text-sm text-grey-500">
          Teams amount: <span className="font-medium">{teamsAmount}</span>
        </div>
      </UIModule>

      <UIModule className="min-h-0 min-w-0 overflow-hidden p-4">
        <TeamsTable data={teams} />
      </UIModule>
    </div>
  );
};
