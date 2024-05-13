"use client";

import { Pagination } from "@/components/Pagination";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { TransactionMetadata } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { TransactionRow } from "./TransactionRow";

type TransactionsTableProps = {
  transactionData: TransactionMetadata[];
};
export const TransactionsTable = async (props: TransactionsTableProps) => {
  const { transactionData } = props;

  const rowsPerPageOptions = [10, 25, 50]; // Rows per page options
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
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
    <div>
      <div className="flex w-full items-center justify-end">
        <div className="grid w-full gap-y-6">
          <div className="mt-6 flex items-center justify-start gap-x-2">
            <Typography variant={TYPOGRAPHY.H7}>Transactions</Typography>
          </div>

          <div className="no-scrollbar w-full overflow-auto">
            <div className="grid md:grid-cols-[auto_auto_min-content]">
              <div className="text-left text-xs font-[400] text-grey-400 max-md:flex max-md:justify-between md:contents md:[&>*]:border-b md:[&>*]:border-grey-100">
                <div className="py-3 pr-2 max-md:pl-5">Amount</div>
                <div className="px-2 py-3 max-md:pr-5">Reference ID</div>
                <div className="py-3 pl-2 max-md:hidden max-md:px-4">
                  Transaction Hash
                </div>
                <div className="px-2 py-3 max-md:pr-5">From</div>
                <div className="px-2 py-3 max-md:pr-5">To</div>
                <div className="px-2 py-3 max-md:pr-5">Timestamp</div>
                <div className="px-2 py-3 max-md:pr-5">Status</div>
              </div>

              <div className="max-md:grid max-md:gap-y-2 md:contents">
                {paginatedTransactions.map((transaction, index) => (
                  <TransactionRow transaction={transaction} key={index} />
                ))}
              </div>
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
        </div>
      </div>
    </div>
  );
};
