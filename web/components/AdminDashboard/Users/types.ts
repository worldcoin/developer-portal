import type { UserColumnVisibility } from "./column-visibility";
import type { UsersSort } from "./sorting";

export type UserTableRow = {
  id: string;
  name: string;
  email?: string | null;
  teamsCount?: number;
  createdAt?: string;
};

export type UsersTableProps = {
  columnVisibility: UserColumnVisibility;
  data: UserTableRow[];
  sort: UsersSort | null;
};
