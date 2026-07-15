import { AppsTable } from "@/components/AdminDashboard/Apps/Table";
import { AppsTableControls } from "@/components/AdminDashboard/Apps/TableControls";
import {
  parseAppColumnVisibility,
  serializeAppColumnVisibility,
  type AppColumnVisibility,
} from "@/components/AdminDashboard/Apps/column-visibility";
import {
  parseAppsLimit,
  parseAppsPage,
  type AppsLimit,
} from "@/components/AdminDashboard/Apps/pagination";
import { parseAppsSearchQuery } from "@/components/AdminDashboard/Apps/search";
import {
  parseAppsSort,
  serializeAppsSort,
  type AppsSort,
} from "@/components/AdminDashboard/Apps/sorting";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import { redirect } from "next/navigation";

import { fetchAdminAppsPage } from "./server/fetch-apps";

type AdminAppsPageProps = {
  searchParams?: Promise<{
    columns?: string | string[];
    limit?: string | string[];
    page?: string | string[];
    query?: string | string[];
    sort?: string | string[];
  }>;
};

const createAdminAppsPageUrl = ({
  columnVisibility,
  limit,
  page,
  searchQuery,
  sort,
}: {
  columnVisibility: AppColumnVisibility;
  limit: AppsLimit;
  page: number;
  searchQuery: string;
  sort: AppsSort | null;
}) => {
  const params = new URLSearchParams();
  params.set("columns", serializeAppColumnVisibility(columnVisibility));
  params.set("limit", String(limit));
  if (searchQuery) params.set("query", searchQuery);
  if (sort) params.set("sort", serializeAppsSort(sort));
  if (page > 1) params.set("page", String(page));
  return `/admin/apps?${params.toString()}`;
};

export const AdminAppsPage = async ({
  searchParams = Promise.resolve({}),
}: AdminAppsPageProps = {}) => {
  const params = await searchParams;
  const columnVisibility = parseAppColumnVisibility(params.columns);
  const limit = parseAppsLimit(params.limit);
  const page = parseAppsPage(params.page);
  const searchQuery = parseAppsSearchQuery(params.query);
  const sort = parseAppsSort(params.sort);
  const { apps, appsAmount, currentPage, totalPages } =
    await fetchAdminAppsPage({
      columnVisibility,
      limit,
      page,
      searchQuery,
      sort,
    });

  if (page !== currentPage) {
    redirect(
      createAdminAppsPageUrl({
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
              Apps
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Browse, search, sort, and inspect registered apps.
            </p>
          </div>
          <div className="rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Total apps
            </div>
            <div className="mt-1 text-20 font-semibold text-grey-900">
              {appsAmount}
            </div>
          </div>
        </div>
      </UIModule>
      <UIModule className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-y-3 overflow-hidden p-4">
        <AppsTableControls
          appsAmount={appsAmount}
          columnVisibility={columnVisibility}
          currentPage={currentPage}
          limit={limit}
          searchQuery={searchQuery}
          totalPages={totalPages}
        />
        <div className="min-h-0 min-w-0 overflow-hidden">
          <AppsTable
            columnVisibility={columnVisibility}
            data={apps}
            sort={sort}
          />
        </div>
      </UIModule>
    </div>
  );
};
