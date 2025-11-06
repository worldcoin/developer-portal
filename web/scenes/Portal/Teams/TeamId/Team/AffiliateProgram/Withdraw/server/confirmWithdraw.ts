"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import {
  ConfirmWithdrawRequest,
  ConfirmWithdrawResponse,
  FormActionResult,
} from "@/lib/types";
import { appBackendFetcher } from "@/lib/app-backend-fetcher";

export const confirmWithdraw = async ({
  emailConfirmationCode,
}: ConfirmWithdrawRequest): Promise<FormActionResult> => {
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

    // Validate OTP code format
    if (!/^\d{6}$/.test(emailConfirmationCode)) {
      return errorFormAction({
        message: "Invalid OTP code format",
        team_id: teamId,
        logLevel: "error",
      });
    }

    //TODO: add check for process.env.NEXT_SERVER_APP_BACKEND_BASE_URL and remove mocks after backend will be ready
    const shouldReturnMocks = false;

    if (shouldReturnMocks) {
      // TODO: remove mock response
      const data: ConfirmWithdrawResponse = {
        amountInWld: "50000000000000000000",
        estimatedCompletionTime: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(), // 24 hours from now
        newAvailableBalance: "10000000000000000000",
        toWalletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      };
      return {
        success: true,
        message: "Mock withdrawal confirmation (localhost) returned",
        data,
      };
    }

    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/affiliate/withdraw/confirm`;

    const response = await appBackendFetcher(url, {
      method: "POST",
      teamId,
      body: JSON.stringify({
        emailConfirmationCode,
      }),
    });

    const data = (await response.json()) as ConfirmWithdrawResponse;
    if (!response.ok) {
      return errorFormAction({
        message: "Failed to confirm withdrawal",
        additionalInfo: { response, data },
        team_id: teamId,
        logLevel: "error",
      });
    }
    return {
      success: true,
      message: "Withdrawal confirmed successfully",
      data,
    };
  } catch (error) {
    return errorFormAction({
      message: "Failed to confirm withdrawal",
      error: error as Error,
      team_id: teamId,
      logLevel: "error",
    });
  }
};
