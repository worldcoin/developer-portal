"use server";

import { getAPIReviewerGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";
import { getSdk } from "../graphql/fetch-pending-affiliates.generated";

type PendingTeam = {
  id: string;
  name: string | null;
  affiliate_status: string;
  created_at: string;
};

type FetchPendingAffiliatesResult = {
  success: boolean;
  message: string;
  teams?: PendingTeam[];
};

export async function fetchPendingAffiliates(): Promise<FetchPendingAffiliatesResult> {
  try {
    const client = await getAPIReviewerGraphqlClient();
    const sdk = getSdk(client);

    const result = await sdk.FetchPendingAffiliates();

    return {
      success: true,
      message: "Fetched pending affiliates successfully",
      teams: result.teams.map((team) => ({
        id: team.id,
        name: team.name ?? null,
        affiliate_status: team.affiliate_status,
        created_at: team.created_at,
      })),
    };
  } catch (error) {
    logger.error("Error fetching pending affiliates", { error });
    return {
      success: false,
      message: "An error occurred while fetching pending affiliates",
    };
  }
}

