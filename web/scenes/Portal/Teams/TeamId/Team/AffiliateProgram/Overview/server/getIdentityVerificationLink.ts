"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { headers } from "next/headers";

export interface GetIdentityVerificationLinkRequest {
  type: "kyc" | "kyb";
  redirectUri: string;
}

export interface GetIdentityVerificationLinkResponse {
  link: string;
  customerId: string;
  verificationType: "kyc" | "kyb";
  timestamp: string;
  status: "not_started" | "pending" | "success" | "failed";
  isLimitReached: boolean;
}

export const getIdentityVerificationLink = async ({
  type,
  redirectUri,
}: GetIdentityVerificationLinkRequest): Promise<FormActionResult> => {
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

    const isLocalhost = headersData.get?.("host")?.includes("localhost");

    if (isLocalhost) {
      // TODO: remove mock response
      const data: GetIdentityVerificationLinkResponse = {
        link: "https://aiprise.com/verify/mock-verification-id",
        customerId: "customer_123",
        verificationType: type,
        timestamp: new Date().toISOString(),
        status: "pending",
        isLimitReached: false,
      };
      return {
        success: true,
        message: "Mock verification link (localhost) returned",
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

    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/identity-verification/get-link`;

    const requestBody: any = { type };
    if (redirectUri) {
      requestBody.redirectUri = redirectUri;
    }

    const response = await signedFetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": `team_${teamId}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as GetIdentityVerificationLinkResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to get verification link",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }

    return {
      success: true,
      message: "Verification link retrieved successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to get verification link",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
