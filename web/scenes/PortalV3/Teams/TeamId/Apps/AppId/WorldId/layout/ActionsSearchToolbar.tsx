"use client";

import { ActionsSearch } from "./ActionsSearch";

export const ActionsSearchToolbar = (props: {
  search: string;
  onSearchChange: (value: string) => void;
}) => (
  <div className="flex min-h-[52px] items-end justify-end border-b border-portal-border">
    <div className="w-full pb-3 sm:w-64">
      <ActionsSearch
        value={props.search}
        onChange={(event) => props.onSearchChange(event.target.value)}
      />
    </div>
  </div>
);
