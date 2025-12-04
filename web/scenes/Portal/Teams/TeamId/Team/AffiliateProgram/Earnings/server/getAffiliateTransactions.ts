"use server";

import { errorFormAction } from "@/api/helpers/errors";
import {
  AffiliateTransactionsRequestParams,
  AffiliateTransactionsResponse,
  FormActionResult,
} from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { validateAffiliateRequest } from "../../common/server/validate-affiliate-request";

export const getAffiliateTransactions = async (
  params?: Pick<AffiliateTransactionsRequestParams, "cursor">,
): Promise<FormActionResult> => {
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

    const reqParams: AffiliateTransactionsRequestParams = {
      cursor: params?.cursor,
      pageSize: 100,
      currency: "USD",
    };

    const searchParams = Object.entries(reqParams)
      .filter(([_, v]) => v !== undefined && v !== null)
      .reduce((acc, [k, v]) => {
        acc.append(k, String(v));
        return acc;
      }, new URLSearchParams());

    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/transactions/history?${searchParams.toString()}`;

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": teamId,
      },
    });

    const data = (await response.json()) as AffiliateTransactionsResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to fetch affiliate transactions",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Affiliate transactions fetched successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to fetch affiliate transactions",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
