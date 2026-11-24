import { UIModule } from "@/components/AdminDashboard/UIModule";
import { fetchAdminUserAppsPage } from "@/scenes/Admin/users/id/server/fetch-user-apps";

import { UserAppsInfiniteList } from "./UserAppsInfiniteList";
import { UserAppsPanelControls } from "./UserAppsPanelControls";

type UserAppsPanelProps = {
  appsPage: number;
  appsQuery: string;
  userId: string;
};

export const UserAppsPanel = async ({
  appsPage,
  appsQuery,
  userId,
}: UserAppsPanelProps) => {
  const { apps, currentPage, totalPages } = await fetchAdminUserAppsPage({
    page: appsPage,
    searchQuery: appsQuery,
    userId,
  });

  return (
    <UIModule className="flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto p-5">
      <div className="flex min-h-6 items-center">
        <h2 className="text-16 font-semibold text-grey-900">
          Apps in user’s teams
        </h2>
      </div>
      <div className="shrink-0">
        <UserAppsPanelControls searchQuery={appsQuery} />
      </div>
      <div className="min-w-0 pt-1">
        <UserAppsInfiniteList
          apps={apps}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </UIModule>
  );
};
