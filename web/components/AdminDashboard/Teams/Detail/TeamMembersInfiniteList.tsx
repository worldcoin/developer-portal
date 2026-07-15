"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type TeamMember = {
  id: string;
  role: string;
  user: {
    email?: string | null;
    id: string;
    name: string;
  };
  user_id: string;
};

type TeamMembersInfiniteListProps = {
  currentPage: number;
  members: TeamMember[];
  searchQuery: string;
  teamId: string;
  totalPages: number;
};

export const TeamMembersInfiniteList = ({
  currentPage,
  members,
  searchQuery,
  teamId,
  totalPages,
}: TeamMembersInfiniteListProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cacheKey = `${teamId}:${searchQuery}`;
  const cacheRef = useRef(new Map<string, Map<number, TeamMember[]>>());
  const requestedPageRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const pages =
      cacheRef.current.get(cacheKey) ?? new Map<number, TeamMember[]>();
    pages.set(currentPage, members);
    cacheRef.current.set(cacheKey, pages);
    requestedPageRef.current = null;
    setIsLoading(false);
    setVersion((value) => value + 1);
  }, [cacheKey, currentPage, members]);

  const cachedMembers = useMemo(() => {
    const pages = cacheRef.current.get(cacheKey);

    if (!pages) {
      return members;
    }

    const seenIds = new Set<string>();

    return [...pages.entries()]
      .sort(([firstPage], [secondPage]) => firstPage - secondPage)
      .flatMap(([, pageMembers]) => pageMembers)
      .filter((member) => {
        if (seenIds.has(member.id)) {
          return false;
        }

        seenIds.add(member.id);
        return true;
      });
  }, [cacheKey, members, version]);

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
        params.set("membersPage", String(nextPage));
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

  if (cachedMembers.length === 0) {
    return <p className="py-3 text-14 text-grey-500">No members found.</p>;
  }

  return (
    <div className="min-w-0">
      <ul className="min-w-0 divide-y divide-grey-100">
        {cachedMembers.map((membership) => {
          const name = membership.user.name.trim();
          const primaryLabel =
            name || membership.user.email || membership.user.id;
          const secondaryLabel = name
            ? membership.user.email ?? membership.user.id
            : membership.user.id;

          return (
            <li className="min-w-0 py-3 first:pt-0" key={membership.id}>
              <Link
                className="block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                href={`/admin/users/${membership.user.id}`}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-14 font-medium text-grey-900 hover:text-blue-500">
                    {primaryLabel}
                  </p>
                  <span className="text-grey-600 shrink-0 rounded-full bg-grey-100 px-2 py-0.5 text-11 font-medium">
                    {membership.role}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-12 text-grey-400">
                  {secondaryLabel}
                </p>
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
