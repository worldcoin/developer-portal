"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { AffiliateBalanceResponse, FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { affiliateBalanceMock } from "./mocks/balance";
import { validateAffiliateRequest } from "./validate-affiliate-request";

export const getAffiliateBalance = async (): Promise<FormActionResult> => {
  const validation = await validateAffiliateRequest();
  
  if (!validation.success) {
    return validation.error;
  }

  const { teamId } = validation.data;

  try {
    //TODO: add check for process.env.NEXT_SERVER_APP_BACKEND_BASE_URL and remove mocks after backend will be ready
    const shouldReturnMocks = true;

    if (shouldReturnMocks) {
      // TODO: remove mock response
      const data = affiliateBalanceMock;
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

    let url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/balance`;

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": teamId,
      },
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
