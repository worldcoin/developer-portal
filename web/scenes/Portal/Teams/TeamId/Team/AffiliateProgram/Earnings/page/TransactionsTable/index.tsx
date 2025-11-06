"use client";
import { Pagination } from "@/components/Pagination";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateTransactionsResponse } from "@/lib/types";
import {
  TransactionDetailsDialog,
  transactionDetailsDialogAtom,
} from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/page/TransactionsTable/TransactionDetailsDialog";
import { useAtom } from "jotai/index";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { TransactionRow } from "./TransactionRow";
import { useGetAffiliateTransactions } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/page/hooks/use-get-affiliate-transactions";

type TransactionsTableProps = ReturnType<typeof useGetAffiliateTransactions>;

export const TransactionsTable = (props: TransactionsTableProps) => {
  const {
    transactions,
    totalCount,
    currentPage,
    loading,
    loadingMore,
    handlePageChange,
  } = props;

  const [, setIsOpened] = useAtom(transactionDetailsDialogAtom);
  const [selectedTransaction, setSelectedTransaction] = useState<
    AffiliateTransactionsResponse["result"]["transactions"][0] | null
  >(null);

  if (!loading && transactions.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <Typography variant={TYPOGRAPHY.H7}>Transactions</Typography>
      {selectedTransaction && (
        <TransactionDetailsDialog
          data={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
      {loading || loadingMore ? (
        <div>
          <Skeleton height={41} />
          <Skeleton count={5} height={73} />
          <Skeleton height={63} />
        </div>
      ) : (
        <div>
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
                    key={transaction.id}
                    transaction={transaction}
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
            totalResults={totalCount}
            currentPage={currentPage}
            rowsPerPage={5}
            handlePageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};
