import { verifyApiKey } from "@/api/helpers/auth/verify-api-key";
import { errorResponse } from "@/api/helpers/errors";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

type UserGrantCycleResponse = {
  nextGrantClaimUTCDate: string;
};

const userGrantCycleQuerySchema = yup
  .object({
    wallet_address: yup
      .string()
      .length(42)
      .required("wallet_address is required"),
    app_id: yup.string().strict().required("app_id is required"),
  })
  .noUnknown();

export const GET = async (req: NextRequest) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema: userGrantCycleQuerySchema,
    value: params,
    app_id: params?.app_id,
  });

  if (!isValid) {
    return handleError(req);
  }

  const { wallet_address, app_id } = parsedParams;

  // Verify API key
  const apiKeyResult = await verifyApiKey({
    req,
    appId: app_id,
  });

  if (!apiKeyResult.success) {
    return apiKeyResult.errorResponse;
  }

  const signedFetch = createSignedFetcher({
    service: "execute-api",
    region: process.env.TRANSACTION_BACKEND_REGION,
  });

  try {
    const res = await signedFetch(
      `${process.env.NEXT_SERVER_INTERNAL_USER_GRANT_CYCLE_ENDPOINT}?walletAddress=${wallet_address}&requiredAppId=${app_id}`,
      {
        method: "GET",
        headers: {
          "User-Agent": req.headers.get("user-agent") ?? "DevPortal/1.0",
          "Content-Type": "application/json",
        },
      },
    );

    const data = await res.json();

    if (!res.ok) {
      const isKnownErrorCode = [
        "user_not_found_for_wallet_address",
        "app_not_installed",
        "no_active_grant_cycles",
      ].includes(data?.error.code ?? "");
      console.warn("debug_logging", JSON.stringify(data, null, 2));

      const errorMessage = isKnownErrorCode
        ? data?.error.message
        : "Failed to fetch user grant cycle";
      const errorCode = isKnownErrorCode
        ? data?.error.code
        : "internal_api_error";
      const statusCode = isKnownErrorCode ? 400 : res.status;

      return errorResponse({
        statusCode,
        code: errorCode,
        detail: errorMessage,
        attribute: "user_grant_cycle",
        req,
        app_id: app_id,
        team_id: apiKeyResult.teamId,
      });
    }

    const response: UserGrantCycleResponse = data.result;

    // Success case - return the nextGrantClaimDate
    return NextResponse.json({
      success: true,
      status: 200,
      result: {
        nextGrantClaimUTCDate: response.nextGrantClaimUTCDate,
      },
    });
  } catch (error) {
    // Generic error fallback
    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Failed to fetch user grant cycle",
      attribute: "server",
      req,
      app_id: app_id,
      team_id: apiKeyResult.teamId,
    });
  }
};
