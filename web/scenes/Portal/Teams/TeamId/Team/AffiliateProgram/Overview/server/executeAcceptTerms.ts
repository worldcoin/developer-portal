"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { logger } from "@/lib/logger";
import { AcceptTermsResponse, FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { validateAffiliateRequest } from "../../common/server/validate-affiliate-request";

export const executeAcceptTerms = async (): Promise<FormActionResult> => {
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
