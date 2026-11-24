"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { DesktopAdminTable } from "../common/DesktopAdminTable";
import { EmptyState } from "../common/EmptyState";
import { columns } from "./columns";
import { MobileTeamsList } from "./MobileTeamsList";
import {
  SORTABLE_TEAM_COLUMN_IDS,
  getEffectiveTeamsSort,
  getNextTeamsSort,
  serializeTeamsSort,
} from "./sorting";
import type { TeamsTableProps } from "./types";

export type { TeamTableRow } from "./types";

export const TeamsTable = ({
  columnVisibility,
  data,
  sort,
}: TeamsTableProps) => {
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
    return <EmptyState>No teams found</EmptyState>;
  }

  return (
    <>
      <MobileTeamsList columnVisibility={columnVisibility} teams={data} />
      <DesktopAdminTable
        ariaLabel="Scrollable teams table"
        caption="Teams table with status, member count, app count, pending invites, active API keys, and creation date."
        getEffectiveSort={getEffectiveTeamsSort}
        getNextSort={getNextTeamsSort}
        isNumericColumn={(columnId) =>
          [
            "membersCount",
            "appsCount",
            "pendingInvitesCount",
            "activeApiKeysCount",
          ].includes(columnId)
        }
        isRowHeaderColumn={(columnId) => columnId === "name"}
        rows={rows}
        serializeSort={serializeTeamsSort}
        sort={sort}
        sortableColumnIds={SORTABLE_TEAM_COLUMN_IDS}
        table={table}
      />
    </>
  );
};
