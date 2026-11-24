"use client";

import { FieldSearch } from "@/components/AdminDashboard/common/FieldSearch";

const memberSearchFields = [
  { field: "id", examples: ["id:user_"], type: "string" as const },
  { field: "name", examples: ['name:"Jane Doe"'], type: "string" as const },
  { field: "email", examples: ["email:example.com"], type: "string" as const },
  { field: "role", examples: ["role:OWNER"], type: "string" as const },
];

type TeamMembersPanelControlsProps = {
  searchQuery: string;
};

export const TeamMembersPanelControls = ({
  searchQuery,
}: TeamMembersPanelControlsProps) => (
  <FieldSearch
    fields={memberSearchFields}
    getVisualSegments={(query) => [{ type: "text", value: query }]}
    pageParam="membersPage"
    placeholder="Search members"
    queryParam="membersQuery"
    value={searchQuery}
  />
);
