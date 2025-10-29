"use client";
import { Pagination } from "@/components/Pagination";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateTransactionsResponse } from "@/lib/types";
import { useGetAffiliateTransactions } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/page/hooks/use-get-affiliate-transactions";
import {
  TransactionDetailsDialog,
  transactionDetailsDialogAtom,
} from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/page/TransactionsTable/TransactionDetailsDialog";
import { useAtom } from "jotai/index";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { TransactionRow } from "./TransactionRow";

export const TransactionsTable = () => {
  const {
    transactions,
    totalCount,
    currentPage,
    loading,
    loadingMore,
    handlePageChange,
  } = useGetAffiliateTransactions({ limit: 100 });

  const [, setIsOpened] = useAtom(transactionDetailsDialogAtom);
  const [selectedTransaction, setSelectedTransaction] = useState<
    AffiliateTransactionsResponse["transactions"][0] | null
  >(null);

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
            {transactions.map((transaction) => (
              <TransactionRow
                transaction={transaction}
                key={transaction.id}
                onClick={() => {
                  setIsOpened(true);
                  setSelectedTransaction(transaction);
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      {loadingMore && (
        <div className="py-4 text-center text-sm text-grey-500">
          Loading transactions...
        </div>
      )}

      <Pagination
        totalResults={totalCount}
        currentPage={currentPage}
        rowsPerPage={5}
        handlePageChange={handlePageChange}
        handleRowsPerPageChange={() => {}}
      />
    </div>
  );
};
