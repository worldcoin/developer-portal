"use client";

import { ColumnSettings } from "../common/ColumnSettings";
import { FieldSearch } from "../common/FieldSearch";
import { LimitSelector } from "../common/LimitSelector";
import { ListPagination } from "../common/ListPagination";
import type { RpColumnVisibility } from "./column-visibility";
import {
  RP_COLUMN_OPTIONS,
  serializeRpColumnVisibility,
} from "./column-visibility";
import { RPS_LIMIT_OPTIONS, type RpsLimit } from "./pagination";
import { RPS_SEARCH_FIELDS, getRpsSearchVisualSegments } from "./search";

type RpsTableControlsProps = {
  columnVisibility: RpColumnVisibility;
  currentPage: number;
  limit: RpsLimit;
  rpsAmount: number;
  searchQuery: string;
  totalPages: number;
};

export const RpsTableControls = ({
  columnVisibility,
  currentPage,
  limit,
  rpsAmount,
  searchQuery,
  totalPages,
}: RpsTableControlsProps) => (
  <div
    aria-label="RPs table controls"
    className="grid gap-3 rounded-16 border border-grey-100 bg-grey-50/70 p-3 text-14 text-grey-500"
  >
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
      <ColumnSettings
        columnOptions={RP_COLUMN_OPTIONS}
        columnVisibility={columnVisibility}
        serializeColumnVisibility={serializeRpColumnVisibility}
      />
      <FieldSearch
        fields={RPS_SEARCH_FIELDS}
        getVisualSegments={getRpsSearchVisualSegments}
        placeholder="Search RPs"
        value={searchQuery}
      />
    </div>
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <LimitSelector options={RPS_LIMIT_OPTIONS} value={limit} />
      <ListPagination
        ariaLabel="RPs table pagination"
        currentPage={currentPage}
        limit={limit}
        pageInputId="rps-page-jump"
        totalItems={rpsAmount}
        totalPages={totalPages}
      />
    </div>
  </div>
);
