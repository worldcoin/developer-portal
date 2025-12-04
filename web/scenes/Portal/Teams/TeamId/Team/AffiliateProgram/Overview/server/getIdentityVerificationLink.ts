"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { logger } from "@/lib/logger";
import {
  FormActionResult,
  GetIdentityVerificationLinkRequest,
  GetIdentityVerificationLinkResponse,
} from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { validateAffiliateRequest } from "../../common/server/validate-affiliate-request";

export const getIdentityVerificationLink = async ({
  redirectUri,
}: Pick<
  GetIdentityVerificationLinkRequest,
  "redirectUri"
>): Promise<FormActionResult> => {
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
    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/identity-verification/verification-link`;
    // NOTE: set kyb because app backend doesn't if it's kyc or kyb
    const requestBody = { type: "kyb", redirectUri };

    const response = await signedFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": teamId,
      },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as GetIdentityVerificationLinkResponse;

    logger.info("verification link", { response, data });

    if (!response.ok) {
      return errorFormAction({
        message: "Failed to get verification link",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }

    return {
      success: true,
      message: "Verification link retrieved successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to get verification link",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
