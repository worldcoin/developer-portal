"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { PaymentMetadata } from "@/lib/types";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/utils";
import { createSignedFetcher } from "aws-sigv4-fetch";
export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<PaymentMetadata[]> => {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    if (!process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT) {
      errorFormAction({
        message: "getTransactionData - internal payments endpoint must be set",
        additionalInfo: { transactionId },
        app_id: appId,
        team_id: teamId,
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
      errorFormAction({
        message: "getTransactionData - failed to fetch transaction data",
        additionalInfo: { transactionId, response, data },
        app_id: appId,
        team_id: teamId,
      });
    }
    return (data?.result?.transactions || []).sort(
      (a: PaymentMetadata, b: PaymentMetadata) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  } catch (error) {
    errorFormAction({
      message: "getTransactionData - failed to fetch transaction data",
      error: error as Error,
      additionalInfo: { transactionId },
      app_id: appId,
      team_id: teamId,
    });
  }
};
