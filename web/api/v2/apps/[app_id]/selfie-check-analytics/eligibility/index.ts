import { isSelfieCheckAnalyticsEnabledForApp } from "@/api/helpers/selfie-check-analytics/eligibility";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { appIdRegex } from "@/lib/schema";
import { Auth0SessionUser } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const errorResponse = ({
  attribute = null,
  code,
  detail,
  status,
}: {
  attribute?: string | null;
  code: string;
  detail: string;
  status: number;
}) =>
  NextResponse.json(
    { code, detail, attribute },
    { status, headers: NO_STORE_HEADERS },
  );

/**
 * Reports whether the app is in the analytics rollout. Never touches S3:
 * eligibility controls access and navigation, metrics responses control only
 * the contents of the metrics view.
 */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ app_id: string }> },
) {
  const { app_id: appId } = await props.params;

  if (!appIdRegex.test(appId)) {
    return errorResponse({
      status: 400,
      code: "invalid_app_id",
      detail: "Invalid app ID.",
      attribute: "app_id",
    });
  }

  let session;
  try {
    session = await auth0.getSession();
  } catch (error) {
    logger.error("Failed to authenticate analytics eligibility request", {
      dependency: "auth0",
      appId,
      failureClass:
        error instanceof Error ? error.name : "UnknownAuthenticationError",
      error,
    });
    return errorResponse({
      status: 503,
      code: "temporarily_unavailable",
      detail: "Eligibility is temporarily unavailable.",
    });
  }

  const user = session?.user as Auth0SessionUser["user"] | undefined;
  if (!user?.hasura?.id) {
    return errorResponse({
      status: 401,
      code: "unauthenticated",
      detail: "You must be logged in.",
    });
  }

  let hasAppAccess: boolean;
  try {
    hasAppAccess = await getIsUserAllowedToReadApp(appId);
  } catch (error) {
    logger.error("Failed to authorize analytics eligibility request", {
      dependency: "hasura",
      appId,
      failureClass:
        error instanceof Error ? error.name : "UnknownAuthorizationError",
      error,
    });
    return errorResponse({
      status: 503,
      code: "temporarily_unavailable",
      detail: "Eligibility is temporarily unavailable.",
    });
  }

  if (!hasAppAccess) {
    return errorResponse({
      status: 404,
      code: "not_found",
      detail: "App not found.",
    });
  }

  const isEligible = await isSelfieCheckAnalyticsEnabledForApp(appId);

  return NextResponse.json(
    { isEligible },
    {
      status: 200,
      headers: { "Cache-Control": "private, max-age=60", Vary: "Cookie" },
    },
  );
}
