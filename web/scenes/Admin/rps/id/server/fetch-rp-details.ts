import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";

import { getSdk } from "../../graphql/server/fetch-admin-rp-details.generated";

export const fetchAdminRpDetails = async (rpId: string) => {
  const client = await getInternalDashboardGraphqlClient();

  try {
    const data = await getSdk(client).FetchAdminRpDetails({ rpId });

    if (!data.rp_registration_by_pk) {
      return null;
    }

    return {
      app: data.rp_registration_by_pk.app,
      rp: data.rp_registration_by_pk,
      team: data.rp_registration_by_pk.app.team,
    };
  } catch (error) {
    logger.error("Failed to fetch admin RP details", { error, rpId });
    throw error;
  }
};
