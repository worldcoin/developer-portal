import { TeamsTable } from "@/components/AdminDashboard/Teams/Table";
import { TeamsTableControls } from "@/components/AdminDashboard/Teams/TableControls";
import type { TeamsLimit } from "@/components/AdminDashboard/Teams/pagination";
import { UIModule } from "@/components/AdminDashboard/UIModule";

import { fetchAdminTeamsPage } from "./server/fetch-teams";

type AdminTeamsPageProps = {
  limit: TeamsLimit;
};

export const AdminTeamsPage = async ({ limit }: AdminTeamsPageProps) => {
  const { teams, teamsAmount } = await fetchAdminTeamsPage({ limit });

  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-4">
        <h1 className="text-lg font-medium">Teams</h1>
        <div className="text-sm text-grey-500">
          Teams amount: <span className="font-medium">{teamsAmount}</span>
        </div>
      </UIModule>

      <UIModule className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-y-3 overflow-hidden p-4">
        <TeamsTableControls limit={limit} />
        <div className="min-h-0 min-w-0 overflow-hidden">
          <TeamsTable data={teams} />
        </div>
      </UIModule>
    </div>
  );
};
