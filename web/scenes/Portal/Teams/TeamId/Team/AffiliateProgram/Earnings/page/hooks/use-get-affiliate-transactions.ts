import {
  AffiliateTransactionsRequestParams,
  AffiliateTransactionsResponse,
} from "@/lib/types";
import { getAffiliateTransactions } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/server/getAffiliateTransactions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firstMockTransactionsPageFailed } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/server/mocks/mock-transactions";

type TransactionItem = AffiliateTransactionsResponse["transactions"][0];

export const useGetAffiliateTransactions = (
  params?: AffiliateTransactionsRequestParams,
) => {
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const isRequestingRef = useRef(false);

  const fetchData = useCallback(
    async (data?: AffiliateTransactionsRequestParams, append = false) => {
      console.log("fetchData");

      try {
        if (isRequestingRef.current) {
          console.log("Request already in progress, skipping...");
          return;
        }

        isRequestingRef.current = true;

        // Add loading states
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const result = await getAffiliateTransactions(data);
        if (!result.success) {
          console.error("Failed to fetch data: ", result.message);
          setError(result.error);
        } else {
          const response = result.data as AffiliateTransactionsResponse;

          if (append) {
            setAllTransactions((prev) => [...prev, ...response.transactions]);
          } else {
            setAllTransactions(response.transactions);
            setCurrentPage(1); // Reset to first page on new data
          }

          setTotalCount(response.paginationMeta.totalCount);
          setNextCursor(response.paginationMeta.nextCursor);
        }
      } catch (err) {
        console.error(err);
        setError(err);
        setTotalCount(
          firstMockTransactionsPageFailed.paginationMeta.totalCount,
        );
        setAllTransactions(firstMockTransactionsPageFailed.transactions);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isRequestingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(params);
  }, [params?.cursor, params?.limit, params?.currency]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);

      // Check if we need to fetch more data for this page
      const endIndex = newPage * rowsPerPage;
      if (
        endIndex > allTransactions.length &&
        nextCursor &&
        !loading &&
        !loadingMore
      ) {
        fetchData({ cursor: nextCursor, limit: 100 }, true);
      }
    },
    [allTransactions.length, nextCursor, loading, loadingMore],
  );

  // Calculate paginated transactions
  const transactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return allTransactions.slice(startIndex, startIndex + rowsPerPage);
  }, [allTransactions, currentPage, rowsPerPage]);

  return {
    transactions,
    totalCount,
    currentPage,
    hasMore: !!nextCursor,
    loading,
    loadingMore,
    error,
    handlePageChange,
  };
};
