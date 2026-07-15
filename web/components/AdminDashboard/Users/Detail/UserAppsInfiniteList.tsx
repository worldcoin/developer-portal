"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type UserApp = {
  deleted_at?: string | null;
  draft_metadata: Array<{ name: string; verification_status: string }>;
  id: string;
  name: string;
  team: { id: string; name: string };
  verified_metadata: Array<{ name: string; verified_at?: string | null }>;
};

type UserAppsInfiniteListProps = {
  apps: UserApp[];
  currentPage: number;
  searchQuery: string;
  totalPages: number;
  userId: string;
};

export const UserAppsInfiniteList = ({
  apps,
  currentPage,
  searchQuery,
  totalPages,
  userId,
}: UserAppsInfiniteListProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cacheKey = `${userId}:${searchQuery}`;
  const cacheRef = useRef(new Map<string, Map<number, UserApp[]>>());
  const requestedPageRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const pages =
      cacheRef.current.get(cacheKey) ?? new Map<number, UserApp[]>();
    pages.set(currentPage, apps);
    cacheRef.current.set(cacheKey, pages);
    requestedPageRef.current = null;
    setIsLoading(false);
    setVersion((value) => value + 1);
  }, [apps, cacheKey, currentPage]);

  const cachedApps = useMemo(() => {
    const pages = cacheRef.current.get(cacheKey);

    if (!pages) {
      return apps;
    }

    const seenIds = new Set<string>();

    return [...pages.entries()]
      .sort(([firstPage], [secondPage]) => firstPage - secondPage)
      .flatMap(([, pageApps]) => pageApps)
      .filter((app) => {
        if (seenIds.has(app.id)) {
          return false;
        }

        seenIds.add(app.id);
        return true;
      });
  }, [apps, cacheKey, version]);

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
        params.set("appsPage", String(nextPage));
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

  if (cachedApps.length === 0) {
    return <p className="py-3 text-14 text-grey-500">No apps found.</p>;
  }

  return (
    <div className="min-w-0">
      <ul className="min-w-0 divide-y divide-grey-100">
        {cachedApps.map((app) => (
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
                {app.team.name} ·{" "}
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
