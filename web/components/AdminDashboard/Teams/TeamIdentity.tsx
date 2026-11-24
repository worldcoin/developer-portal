import Link from "next/link";

import type { TeamTableRow } from "./types";

type TeamIdentityProps = {
  team: Pick<TeamTableRow, "id" | "name">;
};

export const TeamIdentity = ({ team }: TeamIdentityProps) => {
  return (
    <Link
      className="group grid min-w-0 gap-y-1 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      href={`/admin/teams/${team.id}`}
      rel="noreferrer"
      target="_blank"
    >
      <span
        className="truncate font-medium text-grey-900 transition-colors group-hover:text-blue-500"
        title={team.name}
      >
        {team.name}
      </span>
      <span className="truncate font-mono text-12 text-grey-400 transition-colors group-hover:text-blue-400">
        {team.id}
      </span>
    </Link>
  );
};
