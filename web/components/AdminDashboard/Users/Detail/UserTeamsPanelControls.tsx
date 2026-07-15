"use client";

import { FieldSearch } from "@/components/AdminDashboard/common/FieldSearch";

const teamSearchFields = [
  { field: "id", examples: ["id:team_"], type: "string" as const },
  { field: "name", examples: ['name:"My team"'], type: "string" as const },
  { field: "role", examples: ["role:OWNER"], type: "string" as const },
  {
    field: "status",
    examples: ["status:active", "status:deleted"],
    type: "string" as const,
  },
];

type UserTeamsPanelControlsProps = {
  searchQuery: string;
};

export const UserTeamsPanelControls = ({
  searchQuery,
}: UserTeamsPanelControlsProps) => (
  <FieldSearch
    fields={teamSearchFields}
    getVisualSegments={(query) => [{ type: "text", value: query }]}
    pageParam="teamsPage"
    placeholder="Search teams"
    queryParam="teamsQuery"
    value={searchQuery}
  />
);
