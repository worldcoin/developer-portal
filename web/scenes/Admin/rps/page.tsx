import { RpsTable } from "@/components/AdminDashboard/RPs/Table";
import { RpsTableControls } from "@/components/AdminDashboard/RPs/TableControls";
import {
  parseRpColumnVisibility,
  serializeRpColumnVisibility,
  type RpColumnVisibility,
} from "@/components/AdminDashboard/RPs/column-visibility";
import {
  parseRpsLimit,
  parseRpsPage,
  type RpsLimit,
} from "@/components/AdminDashboard/RPs/pagination";
import { parseRpsSearchQuery } from "@/components/AdminDashboard/RPs/search";
import {
  parseRpsSort,
  serializeRpsSort,
  type RpsSort,
} from "@/components/AdminDashboard/RPs/sorting";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchAdminRpsPage, type AdminRpInventory } from "./server/fetch-rps";

type AdminRpsPageProps = {
  searchParams?: Promise<{
    columns?: string | string[];
    limit?: string | string[];
    page?: string | string[];
    query?: string | string[];
    sort?: string | string[];
  }>;
};

const createAdminRpsPageUrl = ({
  columnVisibility,
  limit,
  page,
  searchQuery,
  sort,
}: {
  columnVisibility: RpColumnVisibility;
  limit: RpsLimit;
  page: number;
  searchQuery: string;
  sort: RpsSort | null;
}) => {
  const params = new URLSearchParams();
  params.set("columns", serializeRpColumnVisibility(columnVisibility));
  params.set("limit", String(limit));
  if (searchQuery) params.set("query", searchQuery);
  if (sort) params.set("sort", serializeRpsSort(sort));
  if (page > 1) params.set("page", String(page));
  return `/admin/rps?${params.toString()}`;
};

type MetricCardProps = {
  detail?: string;
  href?: string;
  label: string;
  value: number;
};

const MetricCard = ({ detail, href, label, value }: MetricCardProps) => {
  const content = (
    <>
      <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
        {label}
      </div>
      <div className="mt-2 text-24 font-semibold tracking-[-0.02em] text-grey-900">
        {value}
      </div>
      {detail && <div className="mt-1 text-12 text-grey-500">{detail}</div>}
    </>
  );

  if (!href) {
    return (
      <div className="rounded-12 border border-grey-200 bg-grey-50 p-4">
        {content}
      </div>
    );
  }

  return (
    <Link
      className="rounded-12 border border-grey-200 bg-grey-50 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500"
      href={href}
    >
      {content}
    </Link>
  );
};

const StatusBreakdown = ({ inventory }: { inventory: AdminRpInventory }) => (
  <div className="grid gap-3 md:grid-cols-2">
    <section className="rounded-12 border border-grey-200 bg-grey-50 p-3">
      <h3 className="text-14 font-semibold text-grey-900">Production status</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-13">
        <div className="flex justify-between gap-2">
          <dt className="text-grey-500">Pending</dt>
          <dd className="font-medium text-grey-900">
            {inventory.status.pending}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-grey-500">Registered</dt>
          <dd className="font-medium text-grey-900">
            {inventory.status.registered}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-grey-500">Failed</dt>
          <dd className="font-medium text-grey-900">
            {inventory.status.failed}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-grey-500">Deactivated</dt>
          <dd className="font-medium text-grey-900">
            {inventory.status.deactivated}
          </dd>
        </div>
      </dl>
    </section>
    <section className="rounded-12 border border-grey-200 bg-grey-50 p-3">
      <h3 className="text-14 font-semibold text-grey-900">Staging status</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-13">
        <div className="flex justify-between gap-2">
          <dt className="text-grey-500">Pending</dt>
          <dd className="font-medium text-grey-900">
            {inventory.stagingStatus.pending}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-grey-500">Registered</dt>
          <dd className="font-medium text-grey-900">
            {inventory.stagingStatus.registered}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-grey-500">Failed</dt>
          <dd className="font-medium text-grey-900">
            {inventory.stagingStatus.failed}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-grey-500">Deactivated</dt>
          <dd className="font-medium text-grey-900">
            {inventory.stagingStatus.deactivated}
          </dd>
        </div>
        <div className="col-span-2 flex justify-between gap-2">
          <dt className="text-grey-500">Unset</dt>
          <dd className="font-medium text-grey-900">
            {inventory.stagingStatus.null}
          </dd>
        </div>
      </dl>
    </section>
  </div>
);

export const AdminRpsPage = async ({
  searchParams = Promise.resolve({}),
}: AdminRpsPageProps = {}) => {
  const params = await searchParams;
  const columnVisibility = parseRpColumnVisibility(params.columns);
  const limit = parseRpsLimit(params.limit);
  const page = parseRpsPage(params.page);
  const searchQuery = parseRpsSearchQuery(params.query);
  const sort = parseRpsSort(params.sort);
  const { currentPage, inventory, rps, rpsAmount, totalPages } =
    await fetchAdminRpsPage({
      columnVisibility,
      limit,
      page,
      searchQuery,
      sort,
    });

  if (page !== currentPage) {
    redirect(
      createAdminRpsPageUrl({
        columnVisibility,
        limit,
        page: currentPage,
        searchQuery,
        sort,
      }),
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-y-4">
      <UIModule className="p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <h1 className="text-24 font-semibold tracking-[-0.02em] text-grey-900">
              RPs
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Browse relying party registrations and manager-key inventory.
            </p>
          </div>
          <div className="rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <div className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Total RPs
            </div>
            <div className="mt-1 text-20 font-semibold text-grey-900">
              {inventory.totalRps}
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={`${inventory.managedWithKey} with key reference`}
            href="/admin/rps?query=mode%3Amanaged"
            label="Managed"
            value={inventory.managedRps}
          />
          <MetricCard
            href="/admin/rps?query=mode%3Aself_managed"
            label="Self-managed"
            value={inventory.selfManagedRps}
          />
          <MetricCard
            detail={`${inventory.managedWithoutKey} managed without key`}
            label="Distinct manager keys"
            value={inventory.distinctManagerKeys}
          />
          <MetricCard
            detail={`${inventory.rpsOnSharedKeys} RPs on shared keys`}
            label="Shared key groups"
            value={inventory.sharedKeyGroups}
          />
        </div>
        <div className="mt-4">
          <StatusBreakdown inventory={inventory} />
        </div>
      </UIModule>
      <UIModule className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-y-3 overflow-hidden p-4">
        <RpsTableControls
          columnVisibility={columnVisibility}
          currentPage={currentPage}
          limit={limit}
          rpsAmount={rpsAmount}
          searchQuery={searchQuery}
          totalPages={totalPages}
        />
        <div className="min-h-0 min-w-0 overflow-hidden">
          <RpsTable
            columnVisibility={columnVisibility}
            data={rps}
            sort={sort}
          />
        </div>
      </UIModule>
    </div>
  );
};
