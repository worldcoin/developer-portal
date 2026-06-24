"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getTransactionSignedFetch } from "@/api/helpers/signed-fetch";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult, PaymentMetadata } from "@/lib/types";

export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<FormActionResult> => {
  const path = (await getPathFromHeaders()) || "";
  const { teams: teamId } = extractIdsFromPath(path, ["teams"]);

  // Authorize against the database. The session cookie's `memberships` is
  // refreshed from client-triggered requests and must not be trusted to gate
  // access to another tenant's payment/transaction data.
  if (!(await getIsUserAllowedToReadApp(appId))) {
    return errorFormAction({
      message: "User is not allowed to access this app",
      app_id: appId,
      team_id: teamId,
      logLevel: "error",
    });
  }

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

    const signedFetch = getTransactionSignedFetch();

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
