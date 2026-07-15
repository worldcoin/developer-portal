"use client";

import Link from "next/link";
import { useInfiniteDetailList } from "@/components/AdminDashboard/common/useInfiniteDetailList";

type TeamApp = {
  created_at: string;
  deleted_at?: string | null;
  draft_metadata: Array<{ name: string; verification_status: string }>;
  id: string;
  name: string;
  verified_metadata: Array<{ name: string; verified_at?: string | null }>;
};

type TeamAppsInfiniteListProps = {
  apps: TeamApp[];
  currentPage: number;
  totalPages: number;
};

export const TeamAppsInfiniteList = ({
  apps,
  currentPage,
  totalPages,
}: TeamAppsInfiniteListProps) => {
  const {
    isLoading,
    items: visibleApps,
    sentinelRef,
  } = useInfiniteDetailList({
    currentPage,
    getId: (app: TeamApp) => app.id,
    items: apps,
    pageParam: "appsPage",
    totalPages,
  });

  if (visibleApps.length === 0) {
    return <p className="py-3 text-14 text-grey-500">No apps found.</p>;
  }

  return (
    <div className="min-w-0">
      <ul className="min-w-0 divide-y divide-grey-100">
        {visibleApps.map((app) => (
          <li className="min-w-0 py-3 first:pt-0" key={app.id}>
            <Link
              className="block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              href={`/admin/apps/${app.id}`}
              rel="noreferrer"
              target="_blank"
            >
              <p className="truncate text-14 font-medium text-grey-900 hover:text-blue-500">
                {app.name}
              </p>
              <p className="mt-0.5 truncate font-mono text-12 text-grey-400">
                {app.id}
              </p>
              <p className="mt-1 truncate text-12 text-grey-500">
                {app.deleted_at
                  ? "Deleted"
                  : app.verified_metadata[0]?.name ??
                    app.draft_metadata[0]?.name ??
                    "No metadata"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="h-1" ref={sentinelRef} />
      {isLoading && (
        <p className="py-3 text-center text-12 text-grey-400">Loading more…</p>
      )}
    </div>
  );
};
