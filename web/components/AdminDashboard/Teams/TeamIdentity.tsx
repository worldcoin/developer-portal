import type { TeamTableRow } from "./types";

type TeamIdentityProps = {
  team: Pick<TeamTableRow, "id" | "name">;
};

export const TeamIdentity = ({ team }: TeamIdentityProps) => {
  return (
    <div className="grid min-w-0 gap-y-1">
      <span className="truncate font-medium text-grey-900" title={team.name}>
        {team.name}
      </span>
      <span className="truncate font-mono text-12 text-grey-400">
        {team.id}
      </span>
    </div>
  );
};
