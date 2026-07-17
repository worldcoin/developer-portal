import type { ColumnDef } from "@tanstack/react-table";

import { UserIdentity } from "./UserIdentity";
import type { UserTableRow } from "./types";

export const columns: ColumnDef<UserTableRow>[] = [
  {
    accessorKey: "name",
    header: "User",
    size: 260,
    minSize: 200,
    maxSize: 420,
    cell: ({ row }) => <UserIdentity user={row.original} />,
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 260,
    minSize: 180,
    maxSize: 420,
  },
  {
    accessorKey: "teamsCount",
    header: "Teams",
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
