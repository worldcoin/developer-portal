import { ColumnSettings } from "./ColumnSettings";
import { LimitSelector } from "./LimitSelector";
import { TeamsPagination } from "./TeamsPagination";
import { TeamsSearch } from "./TeamsSearch";
import type { TeamColumnVisibility } from "./column-visibility";
import type { TeamsLimit } from "./pagination";

type TeamsTableControlsProps = {
  columnVisibility: TeamColumnVisibility;
  currentPage: number;
  limit: TeamsLimit;
  searchQuery: string;
  teamsAmount: number;
  totalPages: number;
};

export const TeamsTableControls = ({
  columnVisibility,
  currentPage,
  limit,
  searchQuery,
  teamsAmount,
  totalPages,
}: TeamsTableControlsProps) => {
  return (
    <div
      aria-label="Teams table controls"
      className="grid gap-3 rounded-16 border border-grey-100 bg-grey-50/70 p-3 text-14 text-grey-500"
    >
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <ColumnSettings columnVisibility={columnVisibility} />
        <TeamsSearch value={searchQuery} />
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
