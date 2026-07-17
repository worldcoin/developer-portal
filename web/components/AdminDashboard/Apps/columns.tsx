import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import type { AppTableRow } from "./types";

export const columns: ColumnDef<AppTableRow>[] = [
  {
    accessorKey: "name",
    header: "App",
    size: 260,
    minSize: 200,
    maxSize: 420,
    cell: ({ row }) => (
      <Link
        className="group block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        href={`/admin/apps/${row.original.id}`}
        rel="noreferrer"
        target="_blank"
      >
        <div className="truncate font-medium text-grey-900 group-hover:text-blue-500">
          {row.original.name}
        </div>
        <div className="mt-1 truncate font-mono text-12 text-grey-400">
          {row.original.id}
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "teamId",
    header: "Team ID",
    size: 200,
    minSize: 150,
    maxSize: 320,
    cell: ({ getValue }) => (
      <span
        className="block truncate font-mono text-12"
        title={getValue<string>()}
      >
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "draftMetadataName",
    header: "Draft metadata",
    size: 220,
    minSize: 160,
    maxSize: 360,
    cell: ({ getValue }) => {
      const name = getValue<string | null>();

      return (
        <span className="block truncate" title={name ?? undefined}>
          {name ?? "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "verifiedMetadataName",
    header: "Verified metadata",
    size: 220,
    minSize: 160,
    maxSize: 360,
    cell: ({ getValue }) => {
      const name = getValue<string | null>();

      return (
        <span className="block truncate" title={name ?? undefined}>
          {name ?? "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    size: 120,
    minSize: 100,
    maxSize: 160,
  },
];
