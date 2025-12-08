"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { logger } from "@/lib/logger";
import {
  FormActionResult,
  GetIdentityVerificationLinkResponse,
  ParticipationStatus,
  RequestParticipationResponse,
} from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { validateAffiliateRequest } from "../../common/server/validate-affiliate-request";

export const requestParticipation = async (): Promise<FormActionResult> => {
  let teamId: string | undefined;

  try {
    const validation = await validateAffiliateRequest();

    if (!validation.success) {
      return validation.error;
    }

    teamId = validation.data.teamId;

    //TODO: add check for process.env.NEXT_SERVER_APP_BACKEND_BASE_URL and remove mocks after backend will be ready
    const shouldReturnMocks = true;

    if (shouldReturnMocks) {
      // TODO: remove mock response
      const data: RequestParticipationResponse = {
        result: {
          participationStatus: ParticipationStatus.APPROVED,
        },
      };
      return {
        success: true,
        message: "Mock participation returned",
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
    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/participation/request`;

    const response = await signedFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": teamId,
      },
    });

    const data = (await response.json()) as GetIdentityVerificationLinkResponse;

    logger.info("request participation", { response, data });

    if (!response.ok) {
      return errorFormAction({
        message: "Failed to request participation",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }

    return {
      success: true,
      message: "Participation requested successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to request participation",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
