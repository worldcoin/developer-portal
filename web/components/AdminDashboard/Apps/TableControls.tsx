"use client";

import { ColumnSettings } from "../common/ColumnSettings";
import { FieldSearch } from "../common/FieldSearch";
import { LimitSelector } from "../common/LimitSelector";
import { ListPagination } from "../common/ListPagination";
import type { AppColumnVisibility } from "./column-visibility";
import {
  APP_COLUMN_OPTIONS,
  serializeAppColumnVisibility,
} from "./column-visibility";
import { APPS_LIMIT_OPTIONS, type AppsLimit } from "./pagination";
import { APPS_SEARCH_FIELDS, getAppsSearchVisualSegments } from "./search";

type AppsTableControlsProps = {
  appsAmount: number;
  columnVisibility: AppColumnVisibility;
  currentPage: number;
  limit: AppsLimit;
  searchQuery: string;
  totalPages: number;
};

export const AppsTableControls = ({
  appsAmount,
  columnVisibility,
  currentPage,
  limit,
  searchQuery,
  totalPages,
}: AppsTableControlsProps) => (
  <div
    aria-label="Apps table controls"
    className="grid gap-3 rounded-16 border border-grey-100 bg-grey-50/70 p-3 text-14 text-grey-500"
  >
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
      <ColumnSettings
        columnOptions={APP_COLUMN_OPTIONS}
        columnVisibility={columnVisibility}
        serializeColumnVisibility={serializeAppColumnVisibility}
      />
      <FieldSearch
        fields={APPS_SEARCH_FIELDS}
        getVisualSegments={getAppsSearchVisualSegments}
        placeholder="Search apps"
        value={searchQuery}
      />
    </div>
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <LimitSelector options={APPS_LIMIT_OPTIONS} value={limit} />
      <ListPagination
        ariaLabel="Apps table pagination"
        currentPage={currentPage}
        limit={limit}
        pageInputId="apps-page-jump"
        totalItems={appsAmount}
        totalPages={totalPages}
      />
    </div>
  </div>
);
