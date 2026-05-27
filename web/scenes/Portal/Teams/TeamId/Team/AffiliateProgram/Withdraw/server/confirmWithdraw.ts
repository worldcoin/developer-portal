"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { getTransactionSignedFetch } from "@/api/helpers/signed-fetch";
import {
  ConfirmWithdrawRequest,
  ConfirmWithdrawResponse,
  FormActionResult,
} from "@/lib/types";
import { validateAffiliateRequest } from "../../common/server/validate-affiliate-request";

export const confirmWithdraw = async ({
  emailConfirmationCode,
}: ConfirmWithdrawRequest): Promise<FormActionResult> => {
  let teamId: string | undefined;

  try {
    const validation = await validateAffiliateRequest();

    if (!validation.success) {
      return validation.error;
    }

    teamId = validation.data.teamId;

    // Validate OTP code format
    if (!/^\d{6}$/.test(emailConfirmationCode)) {
      return errorFormAction({
        message: "Invalid OTP code format",
        team_id: teamId,
        logLevel: "error",
      });
    }

    const signedFetch = getTransactionSignedFetch();
    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/withdraw/confirm`;

    const response = await signedFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "DevPortal/1.0",
        "X-Dev-Portal-User-Id": teamId,
      },
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
