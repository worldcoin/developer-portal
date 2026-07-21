"use client";

import Link from "next/link";
import { useInfiniteDetailList } from "@/components/AdminDashboard/common/useInfiniteDetailList";

import { StatusBadge } from "@/components/AdminDashboard/Teams/StatusBadge";

type UserTeam = {
  id: string;
  role: string;
  team: {
    deleted_at?: string | null;
    id: string;
    name: string;
  };
};

type UserTeamsInfiniteListProps = {
  currentPage: number;
  teams: UserTeam[];
  totalPages: number;
};

export const UserTeamsInfiniteList = ({
  currentPage,
  teams,
  totalPages,
}: UserTeamsInfiniteListProps) => {
  const {
    isLoading,
    items: visibleTeams,
    sentinelRef,
  } = useInfiniteDetailList({
    currentPage,
    getId: (team: UserTeam) => team.id,
    items: teams,
    pageParam: "teamsPage",
    totalPages,
  });

  if (visibleTeams.length === 0) {
    return <p className="py-3 text-14 text-grey-500">No teams found.</p>;
  }

  return (
    <div className="min-w-0">
      <ul className="min-w-0 divide-y divide-grey-100">
        {visibleTeams.map((membership) => {
          const status = membership.team.deleted_at ? "Deleted" : "Active";

          return (
            <li className="min-w-0 py-3 first:pt-0" key={membership.id}>
              <Link
                className="block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                href={`/admin/teams/${membership.team.id}`}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-14 font-medium text-grey-900 hover:text-blue-500">
                    {membership.team.name}
                  </p>
                  <span className="text-grey-600 shrink-0 rounded-full bg-grey-100 px-2 py-0.5 text-11 font-medium">
                    {membership.role}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="truncate font-mono text-12 text-grey-400">
                    {membership.team.id}
                  </p>
                  <StatusBadge status={status} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-1" ref={sentinelRef} />
      {isLoading && (
        <p className="py-3 text-center text-12 text-grey-400">Loading more…</p>
      )}
    </div>
  );
};
