"use client";
import { TableComponent } from "@/components/Table";
import { useState } from "react";
import { ActionRow } from "./ActionRow";

// Example of how to use this component
export const ListActions = (props: { actions: any }) => {
  const { actions } = props;
  const headers = [<span key={0}>Name</span>, <span key={1}>Uses</span>, null];

  const rows = actions.map((action: any, index: number) => {
    return ActionRow({ action: action, key: index });
  });
  const totalResults = actions.length;
  const rowsPerPageOptions = [10, 20, 50]; // Rows per page options

  const handlePageChange = (page: number) => {
    // Logic to handle page change
  };

  const handleRowsPerPageChange = (rowsPerPage: number) => {
    // Logic to handle rows per page change
  };

  return (
    <div className="flex items-center justify-center w-full max-w-[1180px]">
      <TableComponent
        headers={headers}
        rows={rows}
        totalResults={totalResults}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
};
