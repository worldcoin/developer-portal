"use client";

import {
  APPS_SEARCH_FIELDS,
  getAppsSearchVisualSegments,
} from "@/components/AdminDashboard/Apps/search";
import { FieldSearch } from "@/components/AdminDashboard/common/FieldSearch";

type UserAppsPanelControlsProps = {
  searchQuery: string;
};

export const UserAppsPanelControls = ({
  searchQuery,
}: UserAppsPanelControlsProps) => (
  <FieldSearch
    fields={APPS_SEARCH_FIELDS.filter((field) => field.field !== "team")}
    getVisualSegments={getAppsSearchVisualSegments}
    pageParam="appsPage"
    placeholder="Search apps"
    queryParam="appsQuery"
    value={searchQuery}
  />
);
