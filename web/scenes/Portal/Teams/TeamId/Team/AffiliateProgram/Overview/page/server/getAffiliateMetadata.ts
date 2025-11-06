"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import {
  AffiliateMetadataResponse,
  FormActionResult,
  IdentityVerificationStatus,
} from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";

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

    //TODO: add check for process.env.NEXT_SERVER_APP_BACKEND_BASE_URL and remove mocks after backend will be ready
    const shouldReturnMocks = true;

    if (shouldReturnMocks) {
      // TODO: remove mock response
      const data: AffiliateMetadataResponse = {
        inviteCode: "AFFLT12",
        identityVerificationStatus: IdentityVerificationStatus.SUCCESS,
        identityVerifiedAt: "2025-09-01T10:00:00Z",
        verificationType: "kyc",
        totalInvites: 528,
        pendingInvites: 5, // Applied code, but not verified
        verifiedInvites: {
          total: 528,
          orb: 317, // ORB verifications
          nfc: 211, // NFC verifications
        },
        totalEarnings: {
          total: "290000000000000000000", // Total WLD earned
          orb: "200000000000000000000", // From ORB verifications
          nfc: "90000000000000000000", // From NFC verifications
        },
        rewards: {
          orb: {
            // $1.00 tier
            CO: { asset: "USD", amount: 1 }, // Colombia
            GT: { asset: "USD", amount: 1 }, // Guatemala
            PE: { asset: "USD", amount: 1 }, // Peru
            PH: { asset: "USD", amount: 1 }, // Philippines
            TH: { asset: "USD", amount: 1 }, // Thailand

            // $2.00 tier
            BR: { asset: "USD", amount: 2 }, // Brazil
            CL: { asset: "USD", amount: 2 }, // Chile
            EC: { asset: "USD", amount: 2 }, // Ecuador
            MX: { asset: "USD", amount: 2 }, // Mexico
            CR: { asset: "USD", amount: 2 }, // Costa Rica
            MY: { asset: "USD", amount: 2 }, // Malaysia
            PA: { asset: "USD", amount: 2 }, // Panama
            AR: { asset: "USD", amount: 2 }, // Argentina

            // $3.00 tier
            AT: { asset: "USD", amount: 3 }, // Austria
            DE: { asset: "USD", amount: 3 }, // Germany
            GB: { asset: "USD", amount: 3 }, // United Kingdom
            JP: { asset: "USD", amount: 3 }, // Japan
            KR: { asset: "USD", amount: 3 }, // South Korea
            PL: { asset: "USD", amount: 3 }, // Poland
            SG: { asset: "USD", amount: 3 }, // Singapore
            TW: { asset: "USD", amount: 3 }, // Taiwan
            US: { asset: "USD", amount: 3 }, // United States
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
