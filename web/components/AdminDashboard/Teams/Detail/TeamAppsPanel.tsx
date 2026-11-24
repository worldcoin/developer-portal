import Link from "next/link";

import { UIModule } from "@/components/AdminDashboard/UIModule";
import { fetchAdminTeamAppsPage } from "@/scenes/Admin/teams/id/server/fetch-team-apps";

import { TeamAppsPanelControls } from "./TeamAppsPanelControls";
import { TeamAppsInfiniteList } from "./TeamAppsInfiniteList";

type TeamAppsPanelProps = {
  appsPage: number;
  appsQuery: string;
  teamId: string;
};

export const TeamAppsPanel = async ({
  appsPage,
  appsQuery,
  teamId,
}: TeamAppsPanelProps) => {
  const { apps, currentPage, totalPages } = await fetchAdminTeamAppsPage({
    page: appsPage,
    searchQuery: appsQuery,
    teamId,
  });

  return (
    <UIModule className="flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto p-5">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <h2 className="text-16 font-semibold text-grey-900">Apps</h2>
        <Link
          className="text-12 font-medium text-blue-500 hover:text-blue-600"
          href={`/admin/apps?query=${encodeURIComponent(`team:${teamId}`)}`}
        >
          View all
        </Link>
      </div>
      <div className="shrink-0">
        <TeamAppsPanelControls searchQuery={appsQuery} />
      </div>
      <div className="min-w-0 pt-1">
        <TeamAppsInfiniteList
          apps={apps}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </UIModule>
  );
};
