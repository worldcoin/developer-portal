"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { AffiliateOverviewResponse, FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { validateAffiliateRequest } from "./validate-affiliate-request";

export const getAffiliateOverview = async ({
  period,
}: {
  period: AffiliateOverviewResponse["result"]["period"];
}): Promise<FormActionResult> => {
  let teamId: string | undefined;

  try {
    const validation = await validateAffiliateRequest();

    if (!validation.success) {
      return validation.error;
    }

    teamId = validation.data.teamId;

    let signedFetch = global.TransactionSignedFetcher;
    if (!signedFetch) {
      signedFetch = createSignedFetcher({
        service: "execute-api",
        region: process.env.TRANSACTION_BACKEND_REGION,
      });
    }

    let url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/overview${period ? `?period=${period}` : ""}`;

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": teamId,
      },
    });

    const data = (await response.json()) as AffiliateOverviewResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to fetch affiliate overview",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Affiliate overview fetched successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to fetch affiliate overview",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
