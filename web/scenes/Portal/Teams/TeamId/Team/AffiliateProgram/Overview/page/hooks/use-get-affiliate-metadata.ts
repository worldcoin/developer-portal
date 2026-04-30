"use client";

import { AffiliateMetadataResponse } from "@/lib/types";
import { affiliateMetadataAtom } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/affiliate-metadata-atom";
import { getAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateMetadata";
import { useAtomValue, useSetAtom } from "jotai";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";

/** Which team's metadata was last written to `affiliateMetadataAtom` (shared across hook instances). */
let lastAppliedMetadataTeamId: string | null = null;

async function loadAffiliateMetadata(): Promise<
  AffiliateMetadataResponse["result"] | null
> {
  const result = await getAffiliateMetadata();
  if (!result.success) {
    console.error("Failed to fetch data: ", result.message);
    toast.error("Failed to fetch metadata. Please try later.");
    return null;
  }
  return (result.data as AffiliateMetadataResponse).result;
}

/**
 * Subscribes to shared affiliate metadata atom and loads/refetches into it.
 * Call `refetch()` after mutations (e.g. accept terms) so layout guards stay in sync.
 */
export const useGetAffiliateMetadata = (options?: { skip?: boolean }) => {
  const pathname = usePathname();
  const params = useParams();
  const teamId = params?.teamId as string | undefined;

  const teamIdRef = useRef(teamId);
  teamIdRef.current = teamId;

  const { data, loading, error } = useAtomValue(affiliateMetadataAtom);
  const setState = useSetAtom(affiliateMetadataAtom);

  const fetchData = useCallback(async () => {
    const requestTeamId = teamId;
    if (!requestTeamId) {
      return null;
    }

    const isTeamChange =
      lastAppliedMetadataTeamId != null &&
      lastAppliedMetadataTeamId !== requestTeamId;

    setState((prev) => {
      const hasStaleForSameTeam = Boolean(!isTeamChange && prev.data != null);
      return {
        ...prev,
        // Drop another team's row so layout guards do not run on stale data while loading.
        data: isTeamChange ? null : prev.data,
        error: null,
        // If we already show metadata for this team, keep loading false so AffiliateProgram/layout
        // does not return null and unmount children — remount re-runs this effect and loops fetches.
        loading: hasStaleForSameTeam ? false : true,
      };
    });

    const next = await loadAffiliateMetadata();

    if (teamIdRef.current !== requestTeamId) {
      return null;
    }

    if (next == null) {
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
      return null;
    }

    lastAppliedMetadataTeamId = requestTeamId;

    setState({
      data: next,
      loading: false,
      error: null,
    });
    return next;
  }, [setState, teamId]);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    if (options?.skip || !teamId) {
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
      return;
    }

    void fetchDataRef.current();
    // Intentionally omit `fetchData`: `useCallback` identity + atom updates can retrigger this
    // effect every render and cause a fetch loop. Ref always points at the latest fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- teamId/pathname/skip are the real triggers
  }, [options?.skip, pathname, teamId]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
