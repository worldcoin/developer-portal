import "server-only";

import { getAPIServiceGraphqlClient } from "./graphql";
import {
  type FetchReviewerLiveMetadataQuery,
  getSdk,
} from "./graphql/fetch-reviewer-live-metadata.generated";

export type ReviewerLiveMetadata =
  FetchReviewerLiveMetadataQuery["app_metadata"][number];

/**
 * Exact-app, published-listing lookup for the admin reviewer projection.
 * The caller must derive appId from an authenticated review submission.
 */
export const fetchReviewerLiveMetadata = async (
  appId: string,
): Promise<ReviewerLiveMetadata | null> => {
  const client = await getAPIServiceGraphqlClient();
  const result = await getSdk(client).FetchReviewerLiveMetadata({ appId });
  return result.app_metadata[0] ?? null;
};
