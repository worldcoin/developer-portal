import { AffiliateMetadataResponse } from "@/lib/types";
import { atom } from "jotai";

export type AffiliateMetadataAtomValue = {
  data: AffiliateMetadataResponse["result"] | null;
  loading: boolean;
  error: unknown;
};

/** Shared cache for affiliate metadata (layout + all affiliate routes read/write via useGetAffiliateMetadata). */
export const affiliateMetadataAtom = atom<AffiliateMetadataAtomValue>({
  data: null,
  loading: true,
  error: null,
});
