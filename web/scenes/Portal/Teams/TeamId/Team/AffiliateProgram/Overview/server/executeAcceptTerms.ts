"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { AcceptTermsResponse, FormActionResult } from "@/lib/types";
import { logger } from "@/lib/logger";
import { createSignedFetcher } from "aws-sigv4-fetch";

export const executeAcceptTerms = async (): Promise<FormActionResult> => {
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
      return {
        success: true,
        message: "Mock accept terms (localhost) returned",
      };
    }

    let signedFetch = global.TransactionSignedFetcher;
    if (!signedFetch) {
      signedFetch = createSignedFetcher({
        service: "execute-api",
        region: process.env.TRANSACTION_BACKEND_REGION,
      });
    }
    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/terms/accept`;

    const response = await signedFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": teamId,
      },
      body: JSON.stringify({}),
    });

    const data = (await response.json()) as AcceptTermsResponse;

    logger.info("accepted terms", { response, data });

    if (!response.ok) {
      return errorFormAction({
        message: "Failed to accept terms",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }

    return {
      success: true,
      message: "Accept terms successfully finished",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to accept terms",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
