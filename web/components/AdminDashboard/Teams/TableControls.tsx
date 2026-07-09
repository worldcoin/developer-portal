import { ColumnSettings } from "./ColumnSettings";
import { LimitSelector } from "./LimitSelector";
import { TeamsPagination } from "./TeamsPagination";
import type { TeamColumnVisibility } from "./column-visibility";
import type { TeamsLimit } from "./pagination";

type TeamsTableControlsProps = {
  columnVisibility: TeamColumnVisibility;
  currentPage: number;
  limit: TeamsLimit;
  teamsAmount: number;
  totalPages: number;
};

export const TeamsTableControls = ({
  columnVisibility,
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
      <ColumnSettings columnVisibility={columnVisibility} />

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
