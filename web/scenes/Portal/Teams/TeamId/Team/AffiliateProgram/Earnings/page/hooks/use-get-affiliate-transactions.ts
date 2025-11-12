import {
  AffiliateTransactionsRequestParams,
  AffiliateTransactionsResponse,
} from "@/lib/types";
import { getAffiliateTransactions } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/server/getAffiliateTransactions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TransactionItem =
  AffiliateTransactionsResponse["result"]["transactions"][0];

export const useGetAffiliateTransactions = () => {
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const tableRowsPerPage = 5;

  const isRequestingRef = useRef(false);

  const fetchData = useCallback(
    async (
      data?: Pick<AffiliateTransactionsRequestParams, "cursor">,
      append = false,
    ) => {
      try {
        if (isRequestingRef.current) {
          console.log("Request already in progress, skipping...");
          return;
        }

        isRequestingRef.current = true;

        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const result = await getAffiliateTransactions(data);
        console.log("useGetAffiliateTransactions data: ", result, result.data);
        if (!result.success) {
          console.error("Failed to fetch data: ", result.message);
          setError(result.error);
        } else {
          const response = (result.data as AffiliateTransactionsResponse)
            .result;

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
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isRequestingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);

      // Check if we need to fetch more data for this page
      const endIndex = newPage * tableRowsPerPage;
      if (
        endIndex > allTransactions.length &&
        nextCursor &&
        !loading &&
        !loadingMore
      ) {
        fetchData({ cursor: nextCursor }, true);
      }
    },
    [allTransactions.length, nextCursor, loading, loadingMore],
  );

  // Calculate paginated transactions
  const transactions = useMemo(() => {
    const startIndex = (currentPage - 1) * tableRowsPerPage;
    return allTransactions.slice(startIndex, startIndex + tableRowsPerPage);
  }, [allTransactions, currentPage, tableRowsPerPage]);

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
