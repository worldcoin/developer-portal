import { TeamsTable } from "@/components/AdminDashboard/Teams/Table";
import { TeamsTableControls } from "@/components/AdminDashboard/Teams/TableControls";
import type { TeamsLimit } from "@/components/AdminDashboard/Teams/pagination";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import { redirect } from "next/navigation";

import { fetchAdminTeamsPage } from "./server/fetch-teams";

type AdminTeamsPageProps = {
  limit: TeamsLimit;
  page: number;
};

const createAdminTeamsPageUrl = ({
  limit,
  page,
}: {
  limit: TeamsLimit;
  page: number;
}) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  if (page > 1) {
    params.set("page", String(page));
  }

  return `/admin/teams?${params.toString()}`;
};

export const AdminTeamsPage = async ({ limit, page }: AdminTeamsPageProps) => {
  const { teams, teamsAmount, currentPage, totalPages } =
    await fetchAdminTeamsPage({ limit, page });

  if (page !== currentPage) {
    redirect(createAdminTeamsPageUrl({ limit, page: currentPage }));
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
          currentPage={currentPage}
          limit={limit}
          teamsAmount={teamsAmount}
          totalPages={totalPages}
        />
        <div className="min-h-0 min-w-0 overflow-hidden">
          <TeamsTable data={teams} />
        </div>
      </UIModule>
    </div>
  );
};
