import {
  AffiliateTransactionsRequestParams,
  AffiliateTransactionsResponse,
} from "@/lib/types";
import { getAffiliateTransactions } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/server/getAffiliateTransactions";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  const fetchData = useCallback(
    async (cursor?: string, append = false) => {
      const fetchParams = {
        ...params,
        cursor: cursor || params?.cursor,
        limit: params?.limit || 100,
      };

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await getAffiliateTransactions(fetchParams);
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
        setError(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [params],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load more when navigating to a page that needs more data
  useEffect(() => {
    const endIndex = currentPage * rowsPerPage;
    if (endIndex > allTransactions.length && nextCursor && !loadingMore) {
      fetchData(nextCursor, true);
    }
  }, [currentPage, allTransactions.length, nextCursor, loadingMore, fetchData]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

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
