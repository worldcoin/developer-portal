"use client";
import { TableComponent } from "@/components/Table";
import { useMemo, useState } from "react";
import { VerifiedRow } from "./VerifiedRow";

export type NullifierItem = {
  id: string;
  updated_at: any;
  nullifier_hash: string;
  uses?: number | null | undefined;
};

// Example of how to use this component
export const VerifiedTable = (props: { nullifiers: NullifierItem[] }) => {
  const { nullifiers } = props;
  const headers = [
    <span key={0}>Human</span>,
    <span key={1}>Uses</span>,
    <span key={2}>Time</span>,
  ];
  const rowsPerPageOptions = [10, 20]; // Rows per page options
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResultsCount, setTotalResultsCount] = useState(nullifiers.length);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const actionsToRender = useMemo(() => {
    if (!nullifiers) {
      return [];
    }

    let filteredNullifiers = nullifiers;

    setTotalResultsCount(filteredNullifiers.length);

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedNullifiers = filteredNullifiers.slice(startIndex, endIndex);

    return paginatedNullifiers.map(
      (nullifier: NullifierItem, index: number) => {
        return VerifiedRow({ nullifier: nullifier, key: index });
      }
    );
  }, [nullifiers, currentPage, rowsPerPage]);

  return (
    <div className="flex items-center justify-end w-full">
      <div className="w-full grid gap-y-6">
        <div className="flex justify-start items-center gap-x-2">
          <h1 className="text-lg text-grey-900 font-[550]">Verified humans</h1>
          <p className="bg-grey-100 w-8 py-1 text-center rounded-xl text-xs">
            {nullifiers.length}
          </p>
        </div>
        <div className="w-full max-h-[400px] overflow-auto">
          <TableComponent
            headers={headers}
            rows={actionsToRender}
            totalResults={totalResultsCount}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            currentPage={currentPage}
          />
        </div>
      </div>
    </div>
  );
};
