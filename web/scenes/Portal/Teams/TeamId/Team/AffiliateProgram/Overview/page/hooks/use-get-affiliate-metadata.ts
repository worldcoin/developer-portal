"use client";

import { AffiliateMetadataResponse } from "@/lib/types";
import { affiliateMetadataAtom } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/affiliate-metadata-atom";
import { getAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateMetadata";
import { useAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";

let inflightFetch: Promise<
  AffiliateMetadataResponse["result"] | null
> | null = null;

async function fetchAffiliateMetadataDeduped(): Promise<
  AffiliateMetadataResponse["result"] | null
> {
  if (inflightFetch) {
    return inflightFetch;
  }

  inflightFetch = (async () => {
    const result = await getAffiliateMetadata();
    if (!result.success) {
      console.error("Failed to fetch data: ", result.message);
      toast.error("Failed to fetch metadata. Please try later.");
      return null;
    }
    return (result.data as AffiliateMetadataResponse).result;
  })().finally(() => {
    inflightFetch = null;
  });

  return inflightFetch;
}

/**
 * Subscribes to shared affiliate metadata atom and loads/refetches into it.
 * Call `refetch()` after mutations (e.g. accept terms) so layout guards stay in sync.
 */
export const useGetAffiliateMetadata = (options?: { skip?: boolean }) => {
  const pathname = usePathname();
  const [{ data, loading, error }, setState] = useAtom(affiliateMetadataAtom);

  const fetchData = useCallback(async () => {
    setState((prev) => {
      const hasCached = prev.data != null;
      return {
        ...prev,
        error: null,
        loading: hasCached ? prev.loading : true,
      };
    });

    const next = await fetchAffiliateMetadataDeduped();

    if (next == null) {
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
      return null;
    }

    setState({
      data: next,
      loading: false,
      error: null,
    });
    return next;
  }, [setState]);

  useEffect(() => {
    if (options?.skip) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    void fetchData();
  }, [options?.skip, fetchData, pathname, setState]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
