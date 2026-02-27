"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import {
  Auth0SessionUser,
  FormActionResult,
  PaymentMetadata,
} from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { createSignedFetcher } from "aws-sigv4-fetch";

export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<FormActionResult> => {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (!user) {
    return errorFormAction({
      message: "User is not authenticated",
      app_id: appId,
      team_id: teamId,
      logLevel: "error",
    });
  }

  const isTeamMember = user?.hasura?.memberships?.some(
    (membership) => membership.team?.id === teamId,
  );

  if (!isTeamMember) {
    return errorFormAction({
      message: "User is not a member of this team",
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

    let signedFetch = global.TransactionSignedFetcher;
    if (!signedFetch) {
      signedFetch = createSignedFetcher({
        service: "execute-api",
        region: process.env.TRANSACTION_BACKEND_REGION,
      });
    }

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
