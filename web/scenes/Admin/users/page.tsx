import { UIModule } from "@/components/AdminDashboard/UIModule";
import { UsersTable } from "@/components/AdminDashboard/Users/Table";
import { UsersTableControls } from "@/components/AdminDashboard/Users/TableControls";
import {
  parseUserColumnVisibility,
  serializeUserColumnVisibility,
  type UserColumnVisibility,
} from "@/components/AdminDashboard/Users/column-visibility";
import {
  parseUsersLimit,
  parseUsersPage,
  type UsersLimit,
} from "@/components/AdminDashboard/Users/pagination";
import { parseUsersSearchQuery } from "@/components/AdminDashboard/Users/search";
import {
  parseUsersSort,
  serializeUsersSort,
  type UsersSort,
} from "@/components/AdminDashboard/Users/sorting";
import { redirect } from "next/navigation";

import { fetchAdminUsersPage } from "./server/fetch-users";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    columns?: string | string[];
    limit?: string | string[];
    page?: string | string[];
    query?: string | string[];
    sort?: string | string[];
  }>;
};

type AdminUsersPageUrlProps = {
  columnVisibility: UserColumnVisibility;
  limit: UsersLimit;
  page: number;
  searchQuery: string;
  sort: UsersSort | null;
};

const createAdminUsersPageUrl = ({
  columnVisibility,
  limit,
  page,
  searchQuery,
  sort,
}: AdminUsersPageUrlProps) => {
  const params = new URLSearchParams();
  params.set("columns", serializeUserColumnVisibility(columnVisibility));
  params.set("limit", String(limit));

  if (searchQuery) {
    params.set("query", searchQuery);
  }

  if (sort) {
    params.set("sort", serializeUsersSort(sort));
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return `/admin/users?${params.toString()}`;
};

export const AdminUsersPage = async ({
  searchParams = Promise.resolve({}),
}: AdminUsersPageProps = {}) => {
  const params = await searchParams;
  const columnVisibility = parseUserColumnVisibility(params.columns);
  const limit = parseUsersLimit(params.limit);
  const page = parseUsersPage(params.page);
  const searchQuery = parseUsersSearchQuery(params.query);
  const sort = parseUsersSort(params.sort);

  const { users, usersAmount, currentPage, totalPages } =
    await fetchAdminUsersPage({
      columnVisibility,
      limit,
      page,
      searchQuery,
      sort,
    });

  if (page !== currentPage) {
    redirect(
      createAdminUsersPageUrl({
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
              Users
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Browse, search, sort, and inspect registered users.
            </p>
          </div>

          <div className="rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Total users
            </div>
            <div className="mt-1 text-20 font-semibold text-grey-900">
              {usersAmount}
            </div>
          </div>
        </div>
      </UIModule>

      <UIModule className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-y-3 overflow-hidden p-4">
        <UsersTableControls
          columnVisibility={columnVisibility}
          currentPage={currentPage}
          limit={limit}
          searchQuery={searchQuery}
          totalPages={totalPages}
          usersAmount={usersAmount}
        />
        <div className="min-h-0 min-w-0 overflow-hidden">
          <UsersTable
            columnVisibility={columnVisibility}
            data={users}
            sort={sort}
          />
        </div>
      </UIModule>
    </div>
  );
};
