import { StatusBadge } from "./StatusBadge";
import { TeamMetric } from "./TeamMetric";
import type { TeamTableRow } from "./types";

type MobileTeamsListProps = {
  teams: TeamTableRow[];
};

export const MobileTeamsList = ({ teams }: MobileTeamsListProps) => {
  return (
    <div className="grid gap-3 lg:hidden">
      {teams.map((team) => {
        const titleId = `${team.id}-title`;

        return (
          <article
            aria-labelledby={titleId}
            key={team.id}
            className="min-w-0 overflow-hidden rounded-16 border border-grey-100 bg-grey-0 p-3 shadow-sm min-[360px]:p-4"
          >
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 min-[360px]:gap-x-3">
              <div className="min-w-0">
                <h2
                  className="truncate text-16 font-medium text-grey-900"
                  id={titleId}
                >
                  {team.name}
                </h2>
                <div className="mt-1 truncate font-mono text-12 text-grey-400">
                  {team.id}
                </div>
              </div>

              <StatusBadge status={team.status} />
            </div>

            <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 min-[320px]:grid-cols-2 min-[360px]:mt-4">
              <TeamMetric label="Members" value={team.membersCount} />
              <TeamMetric label="Apps" value={team.appsCount} />
              <TeamMetric label="Invites" value={team.pendingInvitesCount} />
              <TeamMetric label="API keys" value={team.activeApiKeysCount} />
            </dl>

            <dl className="mt-3 grid min-w-0 gap-y-1.5 min-[360px]:mt-4 min-[360px]:gap-y-2">
              <dt className="text-12 font-medium uppercase tracking-wide text-grey-400">
                Created
              </dt>
              <dd className="truncate text-14 text-grey-700">
                {team.createdAt}
              </dd>
            </dl>
          </article>
        );
      })}
    </div>
  );
};
