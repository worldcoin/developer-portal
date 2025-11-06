"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { AffiliateOverviewResponse, FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { getAffiliateOverviewMock } from "./mocks/overview";

export const getAffiliateOverview = async ({
  period,
}: {
  period: AffiliateOverviewResponse["period"];
}): Promise<FormActionResult> => {
  const path = getPathFromHeaders() || "";
  const { teams: teamId } = extractIdsFromPath(path, ["teams"]);

  try {
    if (!teamId) {
      return errorFormAction({
        message: "team id is not set",
        team_id: teamId,
        logLevel: "error",
      });
    }

    //TODO: add check for process.env.NEXT_SERVER_APP_BACKEND_BASE_URL and remove mocks after backend will be ready
    const shouldReturnMocks = false;

    if (shouldReturnMocks) {
      // TODO: remove mock response
      const data = getAffiliateOverviewMock(period);
      return {
        success: true,
        message: "Mock Affiliate overview (localhost) returned",
        data,
      };
    }

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
        "X-Dev-Portal-User-Id": `team_${teamId}`,
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
