"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getTransactionSignedFetch } from "@/api/helpers/signed-fetch";
import { logger } from "@/lib/logger";
import { AcceptTermsResponse, FormActionResult } from "@/lib/types";
import { validateAffiliateRequest } from "../../common/server/validate-affiliate-request";

export const executeAcceptTerms = async (): Promise<FormActionResult> => {
  let teamId: string | undefined;

  try {
    const validation = await validateAffiliateRequest();

    if (!validation.success) {
      return validation.error;
    }

    teamId = validation.data.teamId;

    const signedFetch = getTransactionSignedFetch();
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
