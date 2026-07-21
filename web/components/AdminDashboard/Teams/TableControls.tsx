"use client";

import { ColumnSettings } from "../common/ColumnSettings";
import { FieldSearch } from "../common/FieldSearch";
import { LimitSelector } from "../common/LimitSelector";
import { ListPagination } from "../common/ListPagination";
import type { TeamColumnVisibility } from "./column-visibility";
import {
  TEAM_COLUMN_OPTIONS,
  serializeTeamColumnVisibility,
} from "./column-visibility";
import { TEAMS_LIMIT_OPTIONS, type TeamsLimit } from "./pagination";
import { TEAMS_SEARCH_FIELDS, getTeamsSearchVisualSegments } from "./search";

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
        <ColumnSettings
          columnOptions={TEAM_COLUMN_OPTIONS}
          columnVisibility={columnVisibility}
          serializeColumnVisibility={serializeTeamColumnVisibility}
        />
        <FieldSearch
          fields={TEAMS_SEARCH_FIELDS}
          getVisualSegments={getTeamsSearchVisualSegments}
          placeholder="Search teams"
          value={searchQuery}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LimitSelector options={TEAMS_LIMIT_OPTIONS} value={limit} />
        <ListPagination
          ariaLabel="Teams table pagination"
          currentPage={currentPage}
          limit={limit}
          pageInputId="teams-page-jump"
          totalItems={teamsAmount}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};
