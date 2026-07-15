import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";

import { getSdk } from "../../graphql/server/fetch-admin-app-details.generated";

export const fetchAdminAppDetails = async (appId: string) => {
  const client = await getInternalDashboardGraphqlClient();

  try {
    const data = await getSdk(client).FetchAdminAppDetails({ appId });

    if (!data.app_by_pk) {
      return null;
    }

    return {
      app: data.app_by_pk,
      draftMetadata: data.app_by_pk.draft_metadata[0] ?? null,
      metadataVersions: data.metadata_versions,
      team: data.app_by_pk.team,
      verifiedMetadata: data.app_by_pk.verified_metadata[0] ?? null,
    };
  } catch (error) {
    logger.error("Failed to fetch admin app details", { appId, error });
    throw error;
  }
};
