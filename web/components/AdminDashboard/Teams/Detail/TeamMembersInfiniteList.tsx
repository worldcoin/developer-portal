"use client";

import Link from "next/link";
import { useInfiniteDetailList } from "@/components/AdminDashboard/common/useInfiniteDetailList";

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
  totalPages: number;
};

export const TeamMembersInfiniteList = ({
  currentPage,
  members,
  totalPages,
}: TeamMembersInfiniteListProps) => {
  const {
    isLoading,
    items: visibleMembers,
    sentinelRef,
  } = useInfiniteDetailList({
    currentPage,
    getId: (member: TeamMember) => member.id,
    items: members,
    pageParam: "membersPage",
    totalPages,
  });

  if (visibleMembers.length === 0) {
    return <p className="py-3 text-14 text-grey-500">No members found.</p>;
  }

  return (
    <div className="min-w-0">
      <ul className="min-w-0 divide-y divide-grey-100">
        {visibleMembers.map((membership) => {
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
