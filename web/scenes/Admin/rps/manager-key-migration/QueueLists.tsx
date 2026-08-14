"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminRpManagerKeyMigrationQueueItem } from "./types";

const QueueItem = ({ item }: { item: AdminRpManagerKeyMigrationQueueItem }) => {
  const detail = item.cleanupStatus
    ? item.lastErrorDetail
      ? `${item.cleanupStatus} — ${item.lastErrorDetail}`
      : item.cleanupStatus
    : item.updatedAt
      ? item.updatedAt.slice(0, 10)
      : undefined;

  return (
    <Link
      className="flex min-w-0 items-center justify-between gap-2 px-2 py-1.5 outline-none hover:bg-grey-0 focus-visible:ring-2 focus-visible:ring-blue-500"
      href={`/admin/rps/${item.rpId}`}
    >
      <span className="min-w-0 truncate font-mono text-12 font-medium text-grey-900">
        {item.rpId}
      </span>
      {detail && (
        <span
          className="max-w-[45%] shrink-0 truncate text-11 text-grey-500"
          title={detail}
        >
          {detail}
        </span>
      )}
    </Link>
  );
};

const QueueList = ({
  items,
  title,
  totalCount,
}: {
  items: AdminRpManagerKeyMigrationQueueItem[];
  title: string;
  totalCount: number;
}) => {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0;
  const visibleItems = useMemo(() => {
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      item.rpId.toLowerCase().includes(normalizedQuery),
    );
  }, [items, normalizedQuery]);

  return (
    <section className="grid min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] rounded-8 border border-grey-200 bg-grey-50">
      <div className="flex items-center justify-between gap-2 border-b border-grey-200 px-3 py-2">
        <h3 className="truncate text-13 font-semibold text-grey-900">
          {title}
        </h3>
        <span className="shrink-0 text-12 font-medium text-grey-500">
          {isFiltering ? visibleItems.length : totalCount}
        </span>
      </div>
      <input
        aria-label={`Filter ${title} by RP ID`}
        className="border-b border-grey-200 bg-grey-0 px-3 py-1.5 font-mono text-12 text-grey-900 outline-none placeholder:font-sans placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by RP ID"
        type="search"
        value={query}
      />
      {visibleItems.length === 0 ? (
        <p className="px-3 py-2 text-12 text-grey-500">
          {isFiltering ? "No matches" : "None"}
        </p>
      ) : (
        <div className="min-h-0 divide-y divide-grey-100 overflow-y-auto">
          {visibleItems.map((item) => (
            <QueueItem item={item} key={item.rpId} />
          ))}
        </div>
      )}
    </section>
  );
};

export const QueueLists = ({
  cleanupNeedsAttention,
  cleanupNeedsAttentionCount,
  remainingCronCandidateCount,
  remainingCronCandidates,
}: {
  cleanupNeedsAttention: AdminRpManagerKeyMigrationQueueItem[];
  cleanupNeedsAttentionCount: number;
  remainingCronCandidateCount: number;
  remainingCronCandidates: AdminRpManagerKeyMigrationQueueItem[];
}) => (
  <div className="contents">
    <QueueList
      items={remainingCronCandidates}
      title="Still to migrate"
      totalCount={remainingCronCandidateCount}
    />
    <QueueList
      items={cleanupNeedsAttention}
      title="Needs a person"
      totalCount={cleanupNeedsAttentionCount}
    />
  </div>
);
