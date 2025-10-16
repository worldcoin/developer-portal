"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { AffiliateOverviewResponse, FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import {headers} from "next/headers";

export const getAffiliateOverview = async (): Promise<FormActionResult> => {
  const headersData = await headers();
  const path = getPathFromHeaders() || "";
  const { teams: teamId } = extractIdsFromPath(path, ["teams"]);
  console.log('path', teamId)

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
    const requestHost =
      typeof headers !== "undefined"
        ? headersData.get?.("host")
        : typeof globalThis !== "undefined" && globalThis?.process?.env?.HOST;

    const isLocalhost =
      (typeof requestHost === "string" &&
        (requestHost.includes("localhost") || requestHost.includes("127.0.0.1"))) ||
      (process.env.NEXT_SERVER_APP_BACKEND_BASE_URL?.includes("localhost") ||
        process.env.NEXT_SERVER_APP_BACKEND_BASE_URL?.includes("127.0.0.1"));

    if (isLocalhost) {
      const data: AffiliateOverviewResponse = {
        period: "week",
        verifications: {
          total: 145,
          orb: 100,
          nfc: 45,
          periods: [
            {
              start: "2025-10-01T00:00:00Z",
              end: "2025-10-02T00:00:00Z",
              count: 25,
              orb: 18,
              nfc: 7,
            },
            {
              start: "2025-10-02T00:00:00Z",
              end: "2025-10-03T00:00:00Z",
              count: 30,
              orb: 20,
              nfc: 10,
            },
            {
              start: "2025-10-03T00:00:00Z",
              end: "2025-10-04T00:00:00Z",
              count: 18,
              orb: 12,
              nfc: 6,
            },
            {
              start: "2025-10-04T00:00:00Z",
              end: "2025-10-05T00:00:00Z",
              count: 20,
              orb: 14,
              nfc: 6,
            },
            {
              start: "2025-10-05T00:00:00Z",
              end: "2025-10-06T00:00:00Z",
              count: 15,
              orb: 10,
              nfc: 5,
            },
            {
              start: "2025-10-06T00:00:00Z",
              end: "2025-10-07T00:00:00Z",
              count: 22,
              orb: 14,
              nfc: 8,
            },
            {
              start: "2025-10-07T00:00:00Z",
              end: "2025-10-08T00:00:00Z",
              count: 15,
              orb: 12,
              nfc: 3,
            },
            // ... more periods as needed for local development
          ],
        },
        earnings: null as any, // set to null as requested
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

    let url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/overview`;

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": `team_${teamId}`,
      },
    });

    const data = (await response.json()) as AffiliateOverviewResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to fetch affiliate overview",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Affiliate overview fetched successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to fetch affiliate overview",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
