"use client";

import { Pagination } from "@/components/Pagination";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateTransactionsResponse } from "@/lib/types";
import { useGetAffiliateTransactions } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/hooks/use-get-affiliate-transactions";
import {
  TransactionDetailsDialog,
  transactionDetailsDialogAtom,
} from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/TransactionsTable/TransactionDetailsDialog";
import { useAtom } from "jotai/index";
import { useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { TransactionRow } from "./TransactionRow";

export const TransactionsTable = () => {
  const { data, loading } = useGetAffiliateTransactions();
  const [_, setIsOpened] = useAtom(transactionDetailsDialogAtom);
  const [selectedTransaction, setSelectedTransaction] = useState<
    AffiliateTransactionsResponse[0] | null
  >(null);

  const transactionData = data || [];

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

  console.log("transactionData", data, loading);
  const paginatedTransactions = useMemo(() => {
    if (!transactionData) {
      return [];
    }

    let filteredTransactions = transactionData;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return filteredTransactions.slice(startIndex, endIndex);
  }, [transactionData, currentPage, rowsPerPage]);

  if (loading) {
    return (
      <div>
        <Skeleton height={41} />
        <Skeleton count={5} height={75} />
      </div>
    );
  }

  return (
    <div>
      {selectedTransaction && (
        <TransactionDetailsDialog
          data={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
      <div className="no-scrollbar overflow-auto">
        <table className="w-full table-auto overflow-scroll">
          <thead className="text-left text-xs font-[400] text-grey-400 md:[&>*]:border-b md:[&>*]:border-grey-100">
            <tr>
              <th className="min-w-[150px] border-b border-grey-200 px-2 py-3">
                <Typography variant={TYPOGRAPHY.R5}>Reward</Typography>
              </th>
              <th className="min-w-[100px] border-b border-grey-200 px-2 py-3 text-right">
                <Typography variant={TYPOGRAPHY.R5}>Amount</Typography>
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedTransactions.map((transaction, index) => (
              <TransactionRow
                transaction={transaction}
                key={index}
                index={index}
                onClick={() => {
                  setIsOpened(true);
                  setSelectedTransaction(transaction);
                }}
              />
            ))}
          </tbody>
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
