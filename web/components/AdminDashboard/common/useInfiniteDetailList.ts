"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAdminSearchParamsPatch } from "./SearchParamsController";

type InfiniteDetailListOptions<T> = {
  currentPage: number;
  getId: (item: T) => string;
  items: T[];
  pageParam: string;
  totalPages: number;
};

export const useInfiniteDetailList = <T>({
  currentPage,
  getId,
  items,
  pageParam,
  totalPages,
}: InfiniteDetailListOptions<T>) => {
  const patchSearchParams = useAdminSearchParamsPatch();
  const searchParams = useSearchParams();
  const requestedPageRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    requestedPageRef.current = null;
    setIsLoading(false);
  }, [currentPage, items]);

  useEffect(() => {
    const requestedPage = searchParams.get(pageParam);

    if (requestedPage && requestedPage !== String(currentPage)) {
      patchSearchParams({ [pageParam]: String(currentPage) });
    }
  }, [currentPage, pageParam, patchSearchParams, searchParams]);

  const uniqueItems = useMemo(() => {
    const seenIds = new Set<string>();

    return items.filter((item) => {
      const id = getId(item);

      if (seenIds.has(id)) {
        return false;
      }

      seenIds.add(id);
      return true;
    });
  }, [getId, items]);

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
        patchSearchParams({ [pageParam]: String(nextPage) });
      },
      { rootMargin: "160px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [currentPage, pageParam, patchSearchParams, totalPages]);

  return { isLoading, items: uniqueItems, sentinelRef };
};
