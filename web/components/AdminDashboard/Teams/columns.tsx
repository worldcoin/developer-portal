import type { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "./StatusBadge";
import { TeamIdentity } from "./TeamIdentity";
import type { TeamTableRow } from "./types";

export const columns: ColumnDef<TeamTableRow>[] = [
  {
    accessorKey: "name",
    header: "Team",
    size: 260,
    minSize: 200,
    maxSize: 420,
    cell: ({ row }) => <TeamIdentity team={row.original} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 110,
    minSize: 90,
    maxSize: 160,
    cell: ({ getValue }) => {
      const status = getValue<TeamTableRow["status"]>();

      if (!status) {
        return null;
      }

      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: "membersCount",
    header: "Members",
    size: 100,
    minSize: 80,
    maxSize: 140,
  },
  {
    accessorKey: "appsCount",
    header: "Apps",
    size: 90,
    minSize: 70,
    maxSize: 130,
  },
  {
    accessorKey: "pendingInvitesCount",
    header: "Invites",
    size: 90,
    minSize: 70,
    maxSize: 130,
  },
  {
    accessorKey: "activeApiKeysCount",
    header: "API keys",
    size: 100,
    minSize: 80,
    maxSize: 140,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    size: 120,
    minSize: 100,
    maxSize: 160,
  },
];
