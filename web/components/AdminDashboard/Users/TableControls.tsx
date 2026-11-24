"use client";

import { ColumnSettings } from "../common/ColumnSettings";
import { FieldSearch } from "../common/FieldSearch";
import { LimitSelector } from "../common/LimitSelector";
import { ListPagination } from "../common/ListPagination";
import type { UserColumnVisibility } from "./column-visibility";
import {
  USER_COLUMN_OPTIONS,
  serializeUserColumnVisibility,
} from "./column-visibility";
import { USERS_LIMIT_OPTIONS, type UsersLimit } from "./pagination";
import { USERS_SEARCH_FIELDS, getUsersSearchVisualSegments } from "./search";

type UsersTableControlsProps = {
  columnVisibility: UserColumnVisibility;
  currentPage: number;
  limit: UsersLimit;
  searchQuery: string;
  usersAmount: number;
  totalPages: number;
};

export const UsersTableControls = ({
  columnVisibility,
  currentPage,
  limit,
  searchQuery,
  usersAmount,
  totalPages,
}: UsersTableControlsProps) => {
  return (
    <div
      aria-label="Users table controls"
      className="grid gap-3 rounded-16 border border-grey-100 bg-grey-50/70 p-3 text-14 text-grey-500"
    >
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <ColumnSettings
          columnOptions={USER_COLUMN_OPTIONS}
          columnVisibility={columnVisibility}
          serializeColumnVisibility={serializeUserColumnVisibility}
        />
        <FieldSearch
          fields={USERS_SEARCH_FIELDS}
          getVisualSegments={getUsersSearchVisualSegments}
          placeholder="Search users"
          value={searchQuery}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LimitSelector options={USERS_LIMIT_OPTIONS} value={limit} />
        <ListPagination
          ariaLabel="Users table pagination"
          currentPage={currentPage}
          limit={limit}
          pageInputId="users-page-jump"
          totalItems={usersAmount}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};
