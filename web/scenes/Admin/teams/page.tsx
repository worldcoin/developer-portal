import { TeamsTable } from "@/components/AdminDashboard/Teams/Table";
import { TeamsTableControls } from "@/components/AdminDashboard/Teams/TableControls";
import {
  serializeTeamColumnVisibility,
  type TeamColumnVisibility,
} from "@/components/AdminDashboard/Teams/column-visibility";
import type { TeamsLimit } from "@/components/AdminDashboard/Teams/pagination";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import { redirect } from "next/navigation";

import { fetchAdminTeamsPage } from "./server/fetch-teams";

type AdminTeamsPageProps = {
  columnVisibility: TeamColumnVisibility;
  limit: TeamsLimit;
  page: number;
};

const createAdminTeamsPageUrl = ({
  columnVisibility,
  limit,
  page,
}: {
  columnVisibility: TeamColumnVisibility;
  limit: TeamsLimit;
  page: number;
}) => {
  const params = new URLSearchParams();
  params.set("columns", serializeTeamColumnVisibility(columnVisibility));
  params.set("limit", String(limit));

  if (page > 1) {
    params.set("page", String(page));
  }

  return `/admin/teams?${params.toString()}`;
};

export const AdminTeamsPage = async ({
  columnVisibility,
  limit,
  page,
}: AdminTeamsPageProps) => {
  const { teams, teamsAmount, currentPage, totalPages } =
    await fetchAdminTeamsPage({ columnVisibility, limit, page });

  if (page !== currentPage) {
    redirect(
      createAdminTeamsPageUrl({
        columnVisibility,
        limit,
        page: currentPage,
      }),
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-4">
        <h1 className="text-lg font-medium">Teams</h1>
        <div className="text-sm text-grey-500">
          Teams amount: <span className="font-medium">{teamsAmount}</span>
        </div>
      </UIModule>

      <UIModule className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-y-3 overflow-hidden p-4">
        <TeamsTableControls
          columnVisibility={columnVisibility}
          currentPage={currentPage}
          limit={limit}
          teamsAmount={teamsAmount}
          totalPages={totalPages}
        />
        <div className="min-h-0 min-w-0 overflow-hidden">
          <TeamsTable columnVisibility={columnVisibility} data={teams} />
        </div>
      </UIModule>
    </div>
  );
};
