"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import {
  FormActionResult,
  InitiateWithdrawRequest,
  InitiateWithdrawResponse,
} from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";

export const initiateWithdraw = async ({
  amountInWld,
  toWallet,
}: InitiateWithdrawRequest): Promise<FormActionResult> => {
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

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(toWallet)) {
      return errorFormAction({
        message: "Invalid wallet address format",
        team_id: teamId,
        logLevel: "error",
      });
    }

    //TODO: add check for process.env.NEXT_SERVER_APP_BACKEND_BASE_URL and remove mocks after backend will be ready
    const shouldReturnMocks = true;

    if (shouldReturnMocks) {
      // TODO: remove mock response
      const data: InitiateWithdrawResponse = {
        withdrawalId: "123e4567-e89b-12d3-a456-426614174000",
        amountInWld,
        toWallet,
        email: "a***e@example.com",
        codeExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
        status: "pending_confirmation",
      };
      return {
        success: true,
        message: "Mock withdrawal initiation (localhost) returned",
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

    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/withdraw/initiate`;

    const response = await signedFetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": `team_${teamId}`,
      },
      body: JSON.stringify({
        amountInWld,
        toWallet,
      }),
    });

    const data = (await response.json()) as InitiateWithdrawResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to initiate withdrawal",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Withdrawal initiated successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to initiate withdrawal",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
