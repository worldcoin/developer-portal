import Link from "next/link";

import { MobileAdminList } from "../common/MobileAdminList";
import type { UserColumnVisibility } from "./column-visibility";
import { UserMetric } from "./UserMetric";
import type { UserTableRow } from "./types";

type MobileUsersListProps = {
  columnVisibility: UserColumnVisibility;
  users: UserTableRow[];
};

export const MobileUsersList = ({
  columnVisibility,
  users,
}: MobileUsersListProps) => {
  const hasVisibleMetrics =
    columnVisibility.email || columnVisibility.teamsCount;

  return (
    <MobileAdminList
      data={users}
      renderCard={(user) => {
        const titleId = `${user.id}-title`;

        return (
          <article
            aria-labelledby={titleId}
            key={user.id}
            className="min-w-0 overflow-hidden rounded-16 border border-grey-100 bg-grey-0 p-3 shadow-sm min-[360px]:p-4"
          >
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 min-[360px]:gap-x-3">
              <Link
                className="group min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                href={`/admin/users/${user.id}`}
                rel="noreferrer"
                target="_blank"
              >
                <h2
                  className="truncate text-16 font-medium text-grey-900 transition-colors group-hover:text-blue-500"
                  id={titleId}
                >
                  {user.name}
                </h2>
                <div className="mt-1 truncate font-mono text-12 text-grey-400 transition-colors group-hover:text-blue-400">
                  {user.id}
                </div>
              </Link>
            </div>

            {hasVisibleMetrics && (
              <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 min-[320px]:grid-cols-2 min-[360px]:mt-4">
                {columnVisibility.email && user.email && (
                  <UserMetric label="Email" value={user.email} />
                )}
                {columnVisibility.teamsCount && (
                  <UserMetric label="Teams" value={user.teamsCount ?? 0} />
                )}
              </dl>
            )}

            {columnVisibility.createdAt && user.createdAt && (
              <dl className="mt-3 grid min-w-0 gap-y-1.5 min-[360px]:mt-4 min-[360px]:gap-y-2">
                <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                  Created
                </dt>
                <dd className="truncate text-14 text-grey-700">
                  {user.createdAt}
                </dd>
              </dl>
            )}
          </article>
        );
      }}
    />
  );
};
