"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { AffiliateMetadataResponse, FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { validateAffiliateRequest } from "../../../common/server/validate-affiliate-request";

export const getAffiliateMetadata = async (): Promise<FormActionResult> => {
  const validation = await validateAffiliateRequest();

  if (!validation.success) {
    return validation.error;
  }

  const { teamId } = validation.data;

  try {
    let signedFetch = global.TransactionSignedFetcher;
    if (!signedFetch) {
      signedFetch = createSignedFetcher({
        service: "execute-api",
        region: process.env.TRANSACTION_BACKEND_REGION,
      });
    }

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
