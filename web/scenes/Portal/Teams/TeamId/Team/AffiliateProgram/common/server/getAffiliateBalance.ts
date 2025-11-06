"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { AffiliateBalanceResponse, FormActionResult } from "@/lib/types";
import { affiliateBalanceMock } from "./mocks/balance";
import { appBackendFetcher } from "@/lib/app-backend-fetcher";

export const getAffiliateBalance = async (): Promise<FormActionResult> => {
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
      const data = affiliateBalanceMock;
      return {
        success: true,
        message: "Mock Affiliate overview (localhost) returned",
        data,
      };
    }

    let url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/affiliate/balance`;
    const response = await appBackendFetcher(url, {
      method: "GET",
      teamId,
    });

    const data = (await response.json()) as AffiliateBalanceResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to fetch affiliate balance",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Affiliate balance fetched successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to fetch affiliate balance",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
