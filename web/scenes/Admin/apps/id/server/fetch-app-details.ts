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

    const {
      actions,
      rp_registration: rpRegistrations,
      ...app
    } = data.app_by_pk;
    const draftMetadata = data.app_by_pk.draft_metadata[0] ?? null;
    const verifiedMetadata = data.app_by_pk.verified_metadata[0] ?? null;
    const currentMetadataUpdates = new Set(
      [draftMetadata?.updated_at, verifiedMetadata?.updated_at].filter(
        (updatedAt): updatedAt is string => Boolean(updatedAt),
      ),
    );
    const legacyActions = actions.map((action) => ({
      action: action.action,
      createdAt: action.created_at,
      id: action.id,
      name: action.name,
      status: action.status,
      totalUses: Number(action.nullifiers_aggregate.aggregate?.sum?.uses ?? 0),
      uniqueNullifiers: action.nullifiers_aggregate.aggregate?.count ?? 0,
    }));
    const worldId40Actions = rpRegistrations
      .flatMap((registration) =>
        registration.actions_v4.map((action) => ({
          action: action.action,
          createdAt: action.created_at,
          environment: String(action.environment),
          id: action.id,
          recordedUniqueUses: action.nullifiers_aggregate.aggregate?.count ?? 0,
          rpId: registration.rp_id,
        })),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      app,
      draftMetadata,
      legacyActions,
      latestMetadataUpdate: data.metadata_versions[0]?.updated_at ?? null,
      metadataHistory: data.metadata_versions.filter(
        (metadata) => !currentMetadataUpdates.has(metadata.updated_at),
      ),
      team: data.app_by_pk.team,
      verifiedMetadata,
      worldId40Actions,
    };
  } catch (error) {
    logger.error("Failed to fetch admin app details", { appId, error });
    throw error;
  }
};
