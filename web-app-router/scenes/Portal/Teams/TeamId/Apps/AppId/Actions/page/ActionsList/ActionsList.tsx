"use client";
import { Button } from "@/components/Button";
import { Table } from "@/components/Table";
import { Body } from "@/components/Table/Body";
import { Footer } from "@/components/Table/Footer";
import { Header } from "@/components/Table/Header";
import { useMemo, useState } from "react";

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
      <Button type="button" key={1} className="rotate-90 w-full">
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
      <Button type="button" key={2} className="rotate-90 w-full">
        ...
      </Button>,
    ],

    // ... more rows
  ];

  const [totalResults, setTotalResults] = useState(rows.length); // Total number of results
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Rows per page
  const rowsPerPageOptions = [10, 20, 50]; // Rows per page options

  const handlePageChange = (page: number) => {
    // Logic to handle page change
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rowsPerPage: number) => {
    // Logic to handle rows per page change
    setRowsPerPage(rowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const setRowsToDisplay = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return rows.slice(startIndex, endIndex);
  }, [currentPage, rowsPerPage, rows]);

  return (
    <div className="flex items-center justify-center w-[700px]">
      <Table
        footer={
          <Footer
            totalResults={totalResults}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            handlePageChange={handlePageChange}
            handleRowsPerPageChange={handleRowsPerPageChange}
          />
        }
      >
        <Header headers={headers} />
        <Body rows={setRowsToDisplay} />
      </Table>
    </div>
  );
};
