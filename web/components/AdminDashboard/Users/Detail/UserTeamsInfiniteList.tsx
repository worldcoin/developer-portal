"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  searchQuery: string;
  teams: UserTeam[];
  totalPages: number;
  userId: string;
};

export const UserTeamsInfiniteList = ({
  currentPage,
  searchQuery,
  teams,
  totalPages,
  userId,
}: UserTeamsInfiniteListProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cacheKey = `${userId}:${searchQuery}`;
  const cacheRef = useRef(new Map<string, Map<number, UserTeam[]>>());
  const requestedPageRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const pages =
      cacheRef.current.get(cacheKey) ?? new Map<number, UserTeam[]>();
    pages.set(currentPage, teams);
    cacheRef.current.set(cacheKey, pages);
    requestedPageRef.current = null;
    setIsLoading(false);
    setVersion((value) => value + 1);
  }, [cacheKey, currentPage, teams]);

  const cachedTeams = useMemo(() => {
    const pages = cacheRef.current.get(cacheKey);

    if (!pages) {
      return teams;
    }

    const seenIds = new Set<string>();

    return [...pages.entries()]
      .sort(([firstPage], [secondPage]) => firstPage - secondPage)
      .flatMap(([, pageTeams]) => pageTeams)
      .filter((membership) => {
        if (seenIds.has(membership.id)) {
          return false;
        }

        seenIds.add(membership.id);
        return true;
      });
  }, [cacheKey, teams, version]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || currentPage >= totalPages) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || requestedPageRef.current) {
          return;
        }

        const nextPage = currentPage + 1;
        requestedPageRef.current = nextPage;
        setIsLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set("teamsPage", String(nextPage));
        const query = params.toString();

        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      },
      { rootMargin: "160px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [currentPage, pathname, router, searchParams, totalPages]);

  if (cachedTeams.length === 0) {
    return <p className="py-3 text-14 text-grey-500">No teams found.</p>;
  }

  return (
    <div className="min-w-0">
      <ul className="min-w-0 divide-y divide-grey-100">
        {cachedTeams.map((membership) => {
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
