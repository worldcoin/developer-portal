export type TeamStatus = "Active" | "Deleted";

export type TeamTableRow = {
  id: string;
  name: string;
  status: TeamStatus;
  membersCount: number;
  appsCount: number;
  pendingInvitesCount: number;
  activeApiKeysCount: number;
  createdAt: string;
};

export type TeamsTableProps = {
  data?: TeamTableRow[];
};
