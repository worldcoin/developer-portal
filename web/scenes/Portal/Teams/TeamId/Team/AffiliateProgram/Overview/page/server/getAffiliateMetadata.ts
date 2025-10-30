"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { AffiliateMetadataResponse, FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { headers } from "next/headers";

export const getAffiliateMetadata = async (): Promise<FormActionResult> => {
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
      const data: AffiliateMetadataResponse = {
        inviteCode: "AFFLT12",
        identityVerificationStatus: "approved",
        identityVerifiedAt: "2025-09-01T10:00:00Z",
        verificationType: "kyc",
        totalInvites: 150,
        pendingInvites: 5, // Applied code, but not verified
        verifiedInvites: {
          total: 145,
          orb: 100, // ORB verifications
          nfc: 45, // NFC verifications
        },
        totalEarnings: {
          total: "290000000000000000000", // Total WLD earned
          orb: "200000000000000000000", // From ORB verifications
          nfc: "90000000000000000000", // From NFC verifications
        },
        rewards: {
          orb: {
            // $0.50 tier
            CO: { asset: "USD", amount: 0.5 }, // Colombia
            GT: { asset: "USD", amount: 0.5 }, // Guatemala
            PE: { asset: "USD", amount: 0.5 }, // Peru
            PH: { asset: "USD", amount: 0.5 }, // Philippines
            ID: { asset: "USD", amount: 0.5 }, // Indonesia
            TH: { asset: "USD", amount: 0.5 }, // Thailand

            // $1.00 tier
            BR: { asset: "USD", amount: 1 }, // Brazil
            CL: { asset: "USD", amount: 1 }, // Chile
            MX: { asset: "USD", amount: 1 }, // Mexico
            CR: { asset: "USD", amount: 1 }, // Costa Rica
            MY: { asset: "USD", amount: 1 }, // Malaysia
            PA: { asset: "USD", amount: 1 }, // Panama
            AR: { asset: "USD", amount: 1 }, // Argentina

            // $1.50 tier
            AT: { asset: "USD", amount: 1.5 }, // Austria
            DE: { asset: "USD", amount: 1.5 }, // Germany
            GB: { asset: "USD", amount: 1.5 }, // United Kingdom
            JP: { asset: "USD", amount: 1.5 }, // Japan
            KR: { asset: "USD", amount: 1.5 }, // South Korea
            PL: { asset: "USD", amount: 1.5 }, // Poland
            SG: { asset: "USD", amount: 1.5 }, // Singapore
            TW: { asset: "USD", amount: 1.5 }, // Taiwan
            US: { asset: "USD", amount: 1.5 }, // United States
          },
          nfc: {
            Global: { asset: "USD", amount: 1 },
          },
        },
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

    let url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/metadata`;

    const response = await signedFetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": `team_${teamId}`,
      },
    });

    const data = (await response.json()) as AffiliateMetadataResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to fetch affiliate metadata",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Affiliate metadata fetched successfully",
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
