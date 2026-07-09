import { LimitSelector } from "./LimitSelector";
import type { TeamsLimit } from "./pagination";

type TeamsTableControlsProps = {
  limit: TeamsLimit;
};

export const TeamsTableControls = ({ limit }: TeamsTableControlsProps) => {
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
        <div className="text-12 font-medium uppercase tracking-wide text-grey-400">
          Pagination
        </div>
      </div>
    </div>
  );
};
