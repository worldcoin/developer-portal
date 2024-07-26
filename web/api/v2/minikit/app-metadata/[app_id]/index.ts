import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { parseLocale } from "@/lib/languages";
import { formatAppMetadata } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as fetchApiKeySdk } from "./graphql/fetch-api-key.generated";
import { getSdk as getAppMetadataSdk } from "./graphql/get-app-metadata.generated";

export const GET = async (
  req: NextRequest,
  { params }: { params: { app_id: string } },
) => {
  const apiKey = req.headers.get("authorization")?.split(" ")[1];
  const appId = params.app_id;

  if (!apiKey) {
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      detail: "API key is required.",
      attribute: "api_key",
      req,
    });
  }

  if (!appId) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "App ID is required.",
      attribute: "app_id",
      req,
    });
  }

  const keyValue = apiKey.replace(/^api_/, "");
  const base64ApiKey = Buffer.from(keyValue, "base64").toString("utf8");
  const [id, secret] = base64ApiKey.split(":");
  const serviceClient = await getAPIServiceGraphqlClient();

  const { api_key_by_pk } = await fetchApiKeySdk(serviceClient).FetchAPIKey({
    id,
    appId: appId,
  });

  if (!api_key_by_pk) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "API key not found.",
      attribute: "api_key",
      req,
    });
  }

  if (!api_key_by_pk.is_active) {
    return errorResponse({
      statusCode: 400,
      code: "api_key_inactive",
      detail: "API key is inactive.",
      attribute: "api_key",
      req,
    });
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === appId)) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_app",
      detail: "API key is not valid for this app.",
      attribute: "api_key",
      req,
    });
  }

  const isAPIKeyValid = verifyHashedSecret(
    api_key_by_pk.id,
    secret,
    api_key_by_pk.api_key,
  );

  if (!isAPIKeyValid) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_api_key",
      detail: "API key is not valid.",
      attribute: "api_key",
      req,
    });
  }

  const client = await getAPIServiceGraphqlClient();

  const headers = req.headers;
  const locale = parseLocale(headers.get("x-accept-language") ?? "");

  // Return the metadata
  const { app_metadata } = await getAppMetadataSdk(client).GetAppMetadata({
    app_id: appId,
    locale,
  });

  if (!app_metadata || app_metadata.length === 0) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ...formatAppMetadata(app_metadata[0], [], locale),
      hero_image_url: null,
      showcase_img_urls: null,
      logo_img_url: null,
    },
    {
      status: 200,
    },
  );
};
