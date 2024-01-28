"use client";
import { TableComponent } from "@/components/Table";
import { useState } from "react";
import { ActionRow } from "./ActionRow";

// Example of how to use this component
export const ListActions = (props: { actions: any }) => {
  const { actions } = props;
  const headers = [<span key={0}>Name</span>, <span key={1}>Uses</span>, null];
  const totalResults = actions.length;
  const rowsPerPageOptions = [10, 20]; // Rows per page options
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // const rows = actions.map((action: any, index: number) => {
  //   return ActionRow({ action: action, key: index });
  // });

  // REMOVE TEST ONLY
  const tempActions = new Array(20)
    .fill(null)
    .map((_, index) => ({ ...actions[0], name: `Action ${index}` }));
  const paginatedActions = tempActions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const rows = paginatedActions.map((action: any, index: number) => {
    return ActionRow({ action: action, key: index });
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  return (
    <div className="max-w-[1180px] w-full max-h-72 overflow-auto">
      <TableComponent
        headers={headers}
        rows={rows}
        totalResults={tempActions.length} // TODO: Change this back to total length
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
};
