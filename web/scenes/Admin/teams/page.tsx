import { TeamsTable } from "@/components/AdminDashboard/Teams/Table";
import { TeamsTableControls } from "@/components/AdminDashboard/Teams/TableControls";
import {
  serializeTeamColumnVisibility,
  type TeamColumnVisibility,
} from "@/components/AdminDashboard/Teams/column-visibility";
import type { TeamsLimit } from "@/components/AdminDashboard/Teams/pagination";
import {
  serializeTeamsSort,
  type TeamsSort,
} from "@/components/AdminDashboard/Teams/sorting";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import { redirect } from "next/navigation";

import { fetchAdminTeamsPage } from "./server/fetch-teams";

type AdminTeamsPageProps = {
  columnVisibility: TeamColumnVisibility;
  limit: TeamsLimit;
  page: number;
  searchQuery: string;
  sort: TeamsSort | null;
};

const createAdminTeamsPageUrl = ({
  columnVisibility,
  limit,
  page,
  searchQuery,
  sort,
}: {
  columnVisibility: TeamColumnVisibility;
  limit: TeamsLimit;
  page: number;
  searchQuery: string;
  sort: TeamsSort | null;
}) => {
  const params = new URLSearchParams();
  params.set("columns", serializeTeamColumnVisibility(columnVisibility));
  params.set("limit", String(limit));

  if (searchQuery) {
    params.set("query", searchQuery);
  }

  if (sort) {
    params.set("sort", serializeTeamsSort(sort));
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return `/admin/teams?${params.toString()}`;
};

export const AdminTeamsPage = async ({
  columnVisibility,
  limit,
  page,
  searchQuery,
  sort,
}: AdminTeamsPageProps) => {
  const { teams, teamsAmount, currentPage, totalPages } =
    await fetchAdminTeamsPage({
      columnVisibility,
      limit,
      page,
      searchQuery,
      sort,
    });

  if (page !== currentPage) {
    redirect(
      createAdminTeamsPageUrl({
        columnVisibility,
        limit,
        page: currentPage,
        searchQuery,
        sort,
      }),
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-auto/1fr gap-y-4">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
              Teams
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Browse, search, sort, and inspect registered developer teams.
            </p>
          </div>

          <div className="rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Total teams
            </div>
            <div className="mt-1 text-20 font-semibold text-grey-900">
              {teamsAmount}
            </div>
          </div>
        </div>
      </UIModule>

      <UIModule className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-y-3 overflow-hidden p-4">
        <TeamsTableControls
          columnVisibility={columnVisibility}
          currentPage={currentPage}
          limit={limit}
          searchQuery={searchQuery}
          teamsAmount={teamsAmount}
          totalPages={totalPages}
        />
        <div className="min-h-0 min-w-0 overflow-hidden">
          <TeamsTable
            columnVisibility={columnVisibility}
            data={teams}
            sort={sort}
          />
        </div>
      </UIModule>
    </div>
  );
};
