"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { AffiliateBalanceResponse, FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { headers } from "next/headers";

export const getAffiliateBalance = async (): Promise<FormActionResult> => {
  const path = getPathFromHeaders() || "";
  const { teams: teamId } = extractIdsFromPath(path, ["teams"]);

  try {
    if (!teamId) {
      return errorFormAction({
        message: "team id is not set",
        team_id: teamId,
        logLevel: "error",
      });
    }

    if (!process.env.NEXT_SERVER_APP_BACKEND_BASE_URL) {
      return errorFormAction({
        message: "The app backend base url env is not set",
        team_id: teamId,
        logLevel: "error",
      });
    }

    // If the request host is localhost, return a mock object. Otherwise fetch as normal.
    const isLocalhost = headers().get?.("host")?.includes("localhost");

    if (isLocalhost) {
      // TODO: remove mock response
      const data: AffiliateBalanceResponse = {
        availableBalance: "50000000000000000000", // 50 WLD (can withdraw)
        pendingBalance: "4000000000000000000", // 4 WLD (waiting 24h)
        totalEarned: "100000000000000000000", // 100 WLD (lifetime)
        lastAccumulatedAt: "2025-10-06T10:00:00Z",
        minimumWithdrawal: "10000000000000000000", // 10 WLD minimum
      };
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
        "X-Dev-Portal-User-Id": `team_${teamId}`,
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
