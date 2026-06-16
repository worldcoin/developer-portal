import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { isValidRpId } from "@/api/helpers/rp-utils";
import { appIdRegex } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getAppStatusSdk } from "./graphql/get-app-status.generated";

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=5, stale-if-error=300",
};

type AppStatusResponse = {
  verified: boolean;
};

function isValidAppStatusId(id: string) {
  return isValidRpId(id) || appIdRegex.test(id);
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const id = params.id;

  if (!isValidAppStatusId(id)) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_id",
      detail: "Invalid id format. Expected app_id or rp_id.",
      attribute: "id",
      req,
    });
  }

  const client = await getAPIServiceGraphqlClient();
  const sdk = getAppStatusSdk(client);

  if (!isValidRpId(id)) {
    const { app_by_pk: app } = await sdk.GetAppStatusByAppId({
      app_id: id,
    });

    if (!app) {
      return errorResponse({
        statusCode: 404,
        code: "not_found",
        detail: "App not found.",
        attribute: "id",
        req,
      });
    }

    const responseBody: AppStatusResponse = {
      verified: app.verified_app_metadata.length > 0,
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: PUBLIC_CACHE_HEADERS,
    });
  }

  const response = await sdk.GetAppStatusByRpId({ rp_id: id });

  const registration = response.rp_registration[0];

  if (!registration) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "RP registration not found.",
      attribute: "id",
      req,
    });
  }

  const responseBody: AppStatusResponse = {
    verified: registration.app.verified_app_metadata.length > 0,
  };

  return NextResponse.json(responseBody, {
    status: 200,
    headers: PUBLIC_CACHE_HEADERS,
  });
}
