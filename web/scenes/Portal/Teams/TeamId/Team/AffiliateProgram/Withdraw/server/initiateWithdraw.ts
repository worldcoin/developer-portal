"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getTransactionSignedFetch } from "@/api/helpers/signed-fetch";
import {
  FormActionResult,
  InitiateWithdrawRequest,
  InitiateWithdrawResponse,
} from "@/lib/types";
import { validateAffiliateRequest } from "../../common/server/validate-affiliate-request";

export const initiateWithdraw = async ({
  amountInWld,
}: InitiateWithdrawRequest): Promise<FormActionResult> => {
  let teamId: string | undefined;

  try {
    const validation = await validateAffiliateRequest();

    if (!validation.success) {
      return validation.error;
    }

    teamId = validation.data.teamId;

    const signedFetch = getTransactionSignedFetch();

    const url = `${process.env.NEXT_SERVER_APP_BACKEND_BASE_URL}/internal/v1/affiliate/withdraw/initiate`;

    const response = await signedFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
        "X-Dev-Portal-User-Id": teamId,
      },
      body: JSON.stringify({
        amountInWld,
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
