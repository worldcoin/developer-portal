"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getTransactionSignedFetch } from "@/api/helpers/signed-fetch";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult, PaymentMetadata } from "@/lib/types";
import { getSdk as getAppModeSdk } from "@/scenes/common/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page/graphql/server/get-app-mode.generated";

type TransactionDataResult = FormActionResult & {
  kind?: "external-app";
};

const getIsExternalApp = async (appId: string) => {
  try {
    const { app } = await getAppModeSdk(
      await getAPIServiceGraphqlClient(),
    ).GetAppMode({ id: appId });

    const meta = app[0]?.verified_app_metadata[0] ?? app[0]?.app_metadata[0];
    return meta?.app_mode === "external";
  } catch (error) {
    logger.error("Failed to fetch app mode", { error, app_id: appId });
    return false;
  }
};

export const getTransactionData = async (
  appId: string,
  transactionId?: string,
): Promise<TransactionDataResult> => {
  const path = (await getPathFromHeaders()) || "";
  const { teams: teamId } = extractIdsFromPath(path, ["teams"]);

  // This function is also a standalone server action, so it must authorize
  // every request before either the service-role mode query or payments fetch.
  if (!(await getIsUserAllowedToReadApp(appId))) {
    return errorFormAction({
      message: "User is not allowed to access this app",
      app_id: appId,
      team_id: teamId,
      logLevel: "error",
    });
  }

  // External apps have no Mini App payments. Return a page-level state instead
  // of calling the payments endpoint, which can only fail for these apps.
  if (await getIsExternalApp(appId)) {
    return {
      success: true,
      message: "Transactions are unavailable for external apps",
      kind: "external-app",
      data: [],
    };
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
