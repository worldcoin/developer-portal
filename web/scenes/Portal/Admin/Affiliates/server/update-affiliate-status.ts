"use server";

import { getAPIReviewerGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";

type UpdateAffiliateStatusResult = {
  success: boolean;
  message: string;
  team_id?: string;
};

export async function updateAffiliateStatus(
  teamId: string,
  status: "approved" | "rejected",
): Promise<UpdateAffiliateStatusResult> {
  try {
    const client = await getAPIReviewerGraphqlClient();

    const mutation = `
      mutation UpdateAffiliateStatus($team_id: String!, $status: String!) {
        update_affiliate_status(team_id: $team_id, status: $status) {
          success
          team_id
        }
      }
    `;

    const result = await client.request<{
      update_affiliate_status: { success: boolean; team_id: string | null };
    }>(mutation, {
      team_id: teamId,
      status,
    });

    if (!result.update_affiliate_status?.success) {
      return {
        success: false,
        message: "Failed to update affiliate status",
      };
    }

    logger.info("Affiliate status updated via admin panel", {
      team_id: teamId,
      status,
    });

    return {
      success: true,
      message: `Team ${status === "approved" ? "approved" : "rejected"} successfully`,
      team_id: teamId,
    };
  } catch (error) {
    logger.error("Error updating affiliate status", { error, teamId, status });
    return {
      success: false,
      message: "An error occurred while updating affiliate status",
    };
  }
}

