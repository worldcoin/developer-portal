import Link from "next/link";

import type { UserTableRow } from "./types";

type UserIdentityProps = {
  user: Pick<UserTableRow, "id" | "name">;
};

export const UserIdentity = ({ user }: UserIdentityProps) => {
  return (
    <Link
      className="group grid min-w-0 gap-y-1 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      href={`/admin/users/${user.id}`}
      rel="noreferrer"
      target="_blank"
    >
      <span
        className="truncate font-medium text-grey-900 transition-colors group-hover:text-blue-500"
        title={user.name}
      >
        {user.name}
      </span>
      <span className="truncate font-mono text-12 text-grey-400 transition-colors group-hover:text-blue-400">
        {user.id}
      </span>
    </Link>
  );
};
