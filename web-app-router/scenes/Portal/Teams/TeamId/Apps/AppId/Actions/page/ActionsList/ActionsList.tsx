"use client";
import { Button } from "@/components/Button";
import { TableComponent } from "@/components/Table";
import { useState } from "react";

// TODO: Example of how to use this component
export const ActionsList = () => {
  const headers = [
    <span key={0}>Name</span>,
    <span key={0}>Uses</span>,
    <span key={2}>Location</span>,
    null,
  ];

  const rows = [
    [
      <div key={1}>
        <div className="text-grey-900 text-sm">Test Action</div>
        <div className="text-grey-500 text-xs">test-action</div>
      </div>,
      <span key={1}>30</span>,
      <span key={1}>New York</span>,
      <Button type="button" key={1} className="rotate-90">
        ...
      </Button>,
    ],
    [
      <div key={2}>
        <div className="text-grey-900 text-sm">New Action</div>
        <div className="text-grey-500 text-xs">new-action</div>
      </div>,
      <span key={2}>25</span>,
      <span key={2}>London</span>,
      <Button type="button" key={2} className="rotate-90">
        ...
      </Button>,
    ],
    // ... more rows
  ];

  const [totalResults, setTotalResults] = useState(2); // Total number of results
  const rowsPerPageOptions = [10, 20, 50]; // Rows per page options

  const handlePageChange = (page: number) => {
    // Logic to handle page change
  };

  const handleRowsPerPageChange = (rowsPerPage: number) => {
    // Logic to handle rows per page change
  };

  return (
    <div className="flex items-center justify-center w-[700px]">
      <TableComponent
        headers={headers}
        rows={rows}
        totalResults={totalResults}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        currentPage={1}
      />
    </div>
  );
};
