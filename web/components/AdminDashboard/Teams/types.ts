import type { TeamColumnVisibility } from "./column-visibility";
import type { TeamsSort } from "./sorting";

export type TeamStatus = "Active" | "Deleted";

export type TeamTableRow = {
  id: string;
  name: string;
  status?: TeamStatus;
  membersCount: number;
  appsCount: number;
  pendingInvitesCount: number;
  activeApiKeysCount: number;
  createdAt?: string;
};

export type TeamsTableProps = {
  columnVisibility: TeamColumnVisibility;
  data: TeamTableRow[];
  sort: TeamsSort | null;
};
