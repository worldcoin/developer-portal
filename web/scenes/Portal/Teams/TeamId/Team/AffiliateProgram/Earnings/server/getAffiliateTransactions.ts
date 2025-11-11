"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import {
  AffiliateTransactionsRequestParams,
  AffiliateTransactionsResponse,
  FormActionResult,
} from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import {
  firstMockTransactionsPage,
  secondMockTransactionsPage,
  thirdMockTransactionsPage,
} from "./mocks/mock-transactions";
import { logger } from "@/lib/logger";

export const getAffiliateTransactions = async (
  params?: AffiliateTransactionsRequestParams,
): Promise<FormActionResult> => {
  logger.info("getAffiliateTransactions");
  const path = getPathFromHeaders() || "";
  const { teams: teamId } = extractIdsFromPath(path, ["teams"]);
  logger.info("getAffiliateTransactions", {
    teamId,
  });

  try {
    if (!teamId) {
      logger.info("getAffiliateTransactions exit");
      return errorFormAction({
        message: "team id is not set",
        team_id: teamId,
        logLevel: "error",
      });
    }

    //TODO: add check for process.env.NEXT_SERVER_APP_BACKEND_BASE_URL and remove mocks after backend will be ready
    const shouldReturnMocks = false;

    if (shouldReturnMocks) {
      // TODO: remove mock response
      let data: AffiliateTransactionsResponse = {
        result: {
          transactions: [],
          paginationMeta: { totalCount: 11, nextCursor: null },
        },
      };

      if (!params?.cursor) {
        logger.info("return first page");
        data = firstMockTransactionsPage;
      }

      if (params?.cursor === "2") {
        logger.info("return second page");
        data = secondMockTransactionsPage;
      }

      if (params?.cursor === "3") {
        logger.info("return third page");
        data = thirdMockTransactionsPage;
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

    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/transactions/history`;

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
