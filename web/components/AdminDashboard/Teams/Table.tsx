"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { columns } from "./columns";
import { DesktopTeamsTable } from "./DesktopTeamsTable";
import { EmptyState } from "./EmptyState";
import { MobileTeamsList } from "./MobileTeamsList";
import type { TeamsTableProps } from "./types";

export type { TeamTableRow } from "./types";

export const TeamsTable = ({ columnVisibility, data }: TeamsTableProps) => {
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
    return <EmptyState />;
  }

  return (
    <>
      <MobileTeamsList columnVisibility={columnVisibility} teams={data} />
      <DesktopTeamsTable table={table} rows={rows} />
    </>
  );
};
