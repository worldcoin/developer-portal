"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult, PaymentMetadata } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";

export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<FormActionResult> => {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    if (!process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT) {
      return errorFormAction({
        message: "The internal payments endpoint is not set",
        additionalInfo: { transactionId },
        app_id: appId,
        team_id: teamId,
        logLevel: "error",
      });
    }

    const signedFetch = createSignedFetcher({
      service: "execute-api",
      region: process.env.TRANSACTION_BACKEND_REGION,
    });

    let url = `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}/miniapp?miniapp-id=${appId}`;

    if (transactionId) {
      url += `&transaction-id=${transactionId}`;
    }

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to fetch transaction data",
        additionalInfo: { transactionId, response, data },
        app_id: appId,
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Transaction data fetched successfully",
      data: (data?.result?.transactions || []).sort(
        (a: PaymentMetadata, b: PaymentMetadata) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to fetch transaction data",
      error: error as Error,
      additionalInfo: { transactionId },
      app_id: appId,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
