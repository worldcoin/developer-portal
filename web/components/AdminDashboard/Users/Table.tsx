"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { DesktopAdminTable } from "../common/DesktopAdminTable";
import { EmptyState } from "../common/EmptyState";
import { columns } from "./columns";
import { MobileUsersList } from "./MobileUsersList";
import {
  SORTABLE_USER_COLUMN_IDS,
  getEffectiveUsersSort,
  getNextUsersSort,
  serializeUsersSort,
} from "./sorting";
import type { UsersTableProps } from "./types";

export type { UserTableRow } from "./types";

export const UsersTable = ({
  columnVisibility,
  data,
  sort,
}: UsersTableProps) => {
  const table = useReactTable({
    data,
    columns,
    defaultColumn: {
      size: 150,
      minSize: 80,
      maxSize: 400,
    },
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    initialState: {
      columnPinning: {
        left: ["name"],
      },
    },
    state: {
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return <EmptyState>No users found</EmptyState>;
  }

  return (
    <>
      <MobileUsersList columnVisibility={columnVisibility} users={data} />
      <DesktopAdminTable
        ariaLabel="Scrollable users table"
        caption="Users table with email, team count, and creation date."
        getEffectiveSort={getEffectiveUsersSort}
        getNextSort={getNextUsersSort}
        isNumericColumn={(columnId) => columnId === "teamsCount"}
        isRowHeaderColumn={(columnId) => columnId === "name"}
        rows={rows}
        serializeSort={serializeUsersSort}
        sort={sort}
        sortableColumnIds={SORTABLE_USER_COLUMN_IDS}
        table={table}
      />
    </>
  );
};
