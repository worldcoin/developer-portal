"use client";

import { Pagination } from "@/components/Pagination";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { PaymentMetadata } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { TransactionRow } from "./TransactionRow";

type TransactionsTableProps = {
  transactionData: PaymentMetadata[];
};
export const TransactionsTable = (props: TransactionsTableProps) => {
  const { transactionData } = props;

  const rowsPerPageOptions = [10, 25, 50]; // Rows per page options
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResultsCount, setTotalResultsCount] = useState(
    transactionData.length,
  );

  useEffect(() => {
    setTotalResultsCount(transactionData.length);
  }, [transactionData]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const paginatedTransactions = useMemo(() => {
    if (!transactionData) {
      return [];
    }

    let filteredTransactions = transactionData;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return filteredTransactions.slice(startIndex, endIndex);
  }, [transactionData, currentPage, rowsPerPage]);

  return (
    <div className="py-5">
      <div className="no-scrollbar overflow-auto">
        <table className="w-full min-w-[700px] table-auto overflow-scroll">
          <thead className="text-left text-xs font-[400] text-grey-400 md:[&>*]:border-b md:[&>*]:border-grey-100">
            <tr>
              <th className="border-b border-grey-200 px-2 py-3">
                <Typography variant={TYPOGRAPHY.R5}>Amount</Typography>
              </th>
              <th className="border-b border-grey-200 px-2 py-3">
                <Typography variant={TYPOGRAPHY.R5}>Reference Id</Typography>
              </th>
              <th className="border-b border-grey-200 px-2 py-3">
                <Typography variant={TYPOGRAPHY.R5}>
                  Transaction Hash
                </Typography>
              </th>
              <th className="border-b border-grey-200 px-2 py-3">
                <Typography variant={TYPOGRAPHY.R5}>From</Typography>
              </th>
              <th className="border-b"></th>
              <th className="border-b border-grey-200 px-2 py-3">
                <Typography variant={TYPOGRAPHY.R5}>To</Typography>
              </th>
              <th className="border-b border-grey-200 px-2 py-3">
                <Typography variant={TYPOGRAPHY.R5}>Timestamp</Typography>
              </th>
              <th className="border-b border-grey-200 px-2 py-3">
                <Typography variant={TYPOGRAPHY.R5}>Status</Typography>
              </th>
            </tr>
          </thead>

          {paginatedTransactions.map((transaction, index) => (
            <TransactionRow
              transaction={transaction}
              key={index}
              index={index}
            />
          ))}
        </table>
      </div>

      <Pagination
        totalResults={totalResultsCount}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        handlePageChange={handlePageChange}
        handleRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
};
