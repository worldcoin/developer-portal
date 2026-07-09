import { LimitSelector } from "./LimitSelector";
import { TeamsPagination } from "./TeamsPagination";
import type { TeamsLimit } from "./pagination";

type TeamsTableControlsProps = {
  currentPage: number;
  limit: TeamsLimit;
  teamsAmount: number;
  totalPages: number;
};

export const TeamsTableControls = ({
  currentPage,
  limit,
  teamsAmount,
  totalPages,
}: TeamsTableControlsProps) => {
  return (
    <div
      aria-label="Teams table controls"
      className="flex flex-col gap-3 rounded-16 border border-grey-100 bg-grey-50/70 p-3 text-14 text-grey-500 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="font-medium text-grey-900">Table controls</div>
        <div className="mt-1 text-12 text-grey-500">
          Search, filters, sorting, and page size controls will live here.
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <LimitSelector value={limit} />
        <TeamsPagination
          currentPage={currentPage}
          limit={limit}
          teamsAmount={teamsAmount}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};
