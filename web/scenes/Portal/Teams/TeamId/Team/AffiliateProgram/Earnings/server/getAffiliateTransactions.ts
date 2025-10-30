"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import {
  AffiliateTransactionsRequestParams,
  AffiliateTransactionsResponse,
  FormActionResult,
} from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { headers } from "next/headers";

export const getAffiliateTransactions = async (
  params?: AffiliateTransactionsRequestParams,
): Promise<FormActionResult> => {
  const headersData = headers();
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
    const isLocalhost = true;

    if (isLocalhost) {
      // TODO: remove mock response
      let data: AffiliateTransactionsResponse = {
        transactions: [],
        paginationMeta: { totalCount: 11, nextCursor: null },
      };

      if (!params?.cursor) {
        data = {
          transactions: [
            // Mock 11 transactions, mix: affiliateAccumulation and affiliateWithdrawal
            {
              id: "tx_1",
              date: "2025-10-07T10:30:00Z",
              type: "affiliateAccumulationOrb",
              status: "pending",
              amount: {
                inWLD: "2000000000000000000", // 2 WLD in wei
                inCurrency: 2.0,
              },
            },
            {
              id: "tx_2",
              date: "2025-10-06T14:12:23Z",
              type: "affiliateAccumulationNfc",
              status: "mined",
              amount: {
                inWLD: "3500000000000000000", // 3.5 WLD
                inCurrency: 3.5,
              },
            },
            {
              id: "tx_3",
              date: "2025-10-05T09:21:33Z",
              type: "affiliateWithdrawal",
              status: "mined",
              amount: {
                inWLD: "1000000000000000000", // 1 WLD
                inCurrency: 1.0,
              },
              walletAddress: "0x1234567890123456789012345678901234567890",
              transactionHash: "0xabc123def45678900001",
              network: "worldchain",
            },
            {
              id: "tx_4",
              date: "2025-10-04T20:45:55Z",
              type: "affiliateAccumulationOrb",
              status: "failed",
              amount: {
                inWLD: "2500000000000000000", // 2.5 WLD
                inCurrency: 2.5,
              },
            },
            {
              id: "tx_5",
              date: "2025-10-03T22:11:40Z",
              type: "affiliateWithdrawal",
              status: "pending",
              amount: {
                inWLD: "1200000000000000000", // 1.2 WLD
                inCurrency: 1.2,
              },
              walletAddress: "0x1234567890123456789012345678901234567890",
              transactionHash: "0xbeefbeefbeefbeefbeef",
              network: "worldchain",
            },
          ],
          paginationMeta: {
            totalCount: 11,
            nextCursor: "2",
          },
        };
      }

      if (params?.cursor === "2") {
        data = {
          transactions: [
            {
              id: "tx_6",
              date: "2025-10-02T16:48:00Z",
              type: "affiliateAccumulationNfc",
              status: "mined",
              amount: {
                inWLD: "3000000000000000000", // 3 WLD
                inCurrency: 3.0,
              },
            },
            {
              id: "tx_7",
              date: "2025-10-01T17:05:22Z",
              type: "affiliateWithdrawal",
              status: "mined",
              amount: {
                inWLD: "900000000000000000", // 0.9 WLD
                inCurrency: 0.9,
              },
              walletAddress: "0x1234567890123456789012345678901234567890",
              transactionHash: "0xfeedfeedfeedfeedfeed",
              network: "worldchain",
            },
            {
              id: "tx_8",
              date: "2025-09-30T07:29:37Z",
              type: "affiliateAccumulationOrb",
              status: "pending",
              amount: {
                inWLD: "1800000000000000000", // 1.8 WLD
                inCurrency: 1.8,
              },
            },
            {
              id: "tx_9",
              date: "2025-09-29T13:49:41Z",
              type: "affiliateAccumulationNfc",
              status: "mined",
              amount: {
                inWLD: "2200000000000000000", // 2.2 WLD
                inCurrency: 2.2,
              },
            },
            {
              id: "tx_10",
              date: "2025-09-28T19:19:00Z",
              type: "affiliateWithdrawal",
              status: "failed",
              amount: {
                inWLD: "1600000000000000000", // 1.6 WLD
                inCurrency: 1.6,
              },
              walletAddress: "0x1234567890123456789012345678901234567890",
              transactionHash: "0xdeaddeaddeaddeaddead",
              network: "worldchain",
            },
          ],
          paginationMeta: {
            totalCount: 11,
            nextCursor: "3",
          },
        };
      }

      if (params?.cursor === "3") {
        data = {
          transactions: [
            {
              id: "tx_11",
              date: "2025-09-27T11:30:22Z",
              type: "affiliateAccumulationOrb",
              status: "mined",
              amount: {
                inWLD: "2600000000000000000", // 2.6 WLD
                inCurrency: 2.6,
              },
            },
          ],
          paginationMeta: {
            totalCount: 11,
            nextCursor: null,
          },
        };
      }

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

    const searchParams = Object.entries(params ?? {})
      .filter(([_, v]) => v !== undefined && v !== null)
      .reduce((acc, [k, v]) => {
        acc.append(k, String(v));
        return acc;
      }, new URLSearchParams());

    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": `team_${teamId}`,
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
