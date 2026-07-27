import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { RpModeBadge, RpStatusBadge } from "./StatusBadge";
import type { RpTableRow } from "./types";

export const columns: ColumnDef<RpTableRow>[] = [
  {
    accessorKey: "rpId",
    header: "RP",
    size: 220,
    minSize: 180,
    maxSize: 360,
    cell: ({ row }) => (
      <Link
        className="group block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        href={`/admin/rps/${row.original.rpId}`}
        rel="noreferrer"
        target="_blank"
      >
        <div className="truncate font-mono text-13 font-medium text-grey-900 group-hover:text-blue-500">
          {row.original.rpId}
        </div>
      </Link>
    ),
  },
  {
    id: "appId",
    accessorKey: "appName",
    header: "App",
    size: 220,
    minSize: 160,
    maxSize: 360,
    cell: ({ row }) => (
      <Link
        className="group block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        href={`/admin/apps/${row.original.appId}`}
        rel="noreferrer"
        target="_blank"
      >
        <div className="truncate font-medium text-grey-900 group-hover:text-blue-500">
          {row.original.appName}
        </div>
        <div className="mt-1 truncate font-mono text-12 text-grey-400">
          {row.original.appId}
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "mode",
    header: "Mode",
    size: 140,
    minSize: 120,
    maxSize: 180,
    cell: ({ row }) => <RpModeBadge mode={row.original.mode} />,
  },
  {
    accessorKey: "status",
    header: "Production status",
    size: 160,
    minSize: 140,
    maxSize: 220,
    cell: ({ row }) => <RpStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "stagingStatus",
    header: "Staging status",
    size: 160,
    minSize: 140,
    maxSize: 220,
    cell: ({ row }) => <RpStatusBadge status={row.original.stagingStatus} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    size: 120,
    minSize: 100,
    maxSize: 160,
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
    accessorKey: "signerAddress",
    header: "Signer",
    size: 200,
    minSize: 150,
    maxSize: 320,
    cell: ({ getValue }) => {
      const value = getValue<string | null | undefined>();

      return (
        <span
          className="block truncate font-mono text-12"
          title={value ?? undefined}
        >
          {value ?? "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "operationHash",
    header: "Operation hash",
    size: 200,
    minSize: 150,
    maxSize: 320,
    cell: ({ getValue }) => {
      const value = getValue<string | null | undefined>();

      return (
        <span
          className="block truncate font-mono text-12"
          title={value ?? undefined}
        >
          {value ?? "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "stagingOperationHash",
    header: "Staging operation hash",
    size: 200,
    minSize: 150,
    maxSize: 320,
    cell: ({ getValue }) => {
      const value = getValue<string | null | undefined>();

      return (
        <span
          className="block truncate font-mono text-12"
          title={value ?? undefined}
        >
          {value ?? "—"}
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
