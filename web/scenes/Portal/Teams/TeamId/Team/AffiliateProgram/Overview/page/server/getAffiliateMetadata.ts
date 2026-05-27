"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getTransactionSignedFetch } from "@/api/helpers/signed-fetch";
import { AffiliateMetadataResponse, FormActionResult } from "@/lib/types";
import { validateAffiliateRequest } from "../../../common/server/validate-affiliate-request";

export const getAffiliateMetadata = async (): Promise<FormActionResult> => {
  let teamId: string | undefined;

  try {
    const validation = await validateAffiliateRequest();

    if (!validation.success) {
      return validation.error;
    }

    teamId = validation.data.teamId;

    const signedFetch = getTransactionSignedFetch();

    let url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/metadata`;

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": teamId,
      },
    });

    const data = (await response.json()) as AffiliateMetadataResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to fetch affiliate metadata",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Affiliate metadata fetched successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to fetch affiliate metadata",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
