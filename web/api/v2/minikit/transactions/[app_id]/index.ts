import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { TransactionMetadata } from "@/lib/types";
import { createSignedFetcher } from "aws-sigv4-fetch";
import { NextRequest } from "next/server";
import { getSdk as fetchApiKeySdk } from "../../common/graphql/fetch-api-key.generated";

export const GET = async (
  req: NextRequest,
  { params: routeParams }: { params: { app_id: string } },
) => {
  const api_key = req.headers.get("authorization")?.split(" ")[1];

  if (!api_key) {
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      detail: "API key is required.",
      attribute: "api_key",
      req,
    });
  }

  const appId = routeParams.app_id;
  const keyValue = api_key.replace(/^api_/, "");
  const base64ApiKey = Buffer.from(keyValue, "base64").toString("utf8");
  const [id, secret] = base64ApiKey.split(":");
  const serviceClient = await getAPIServiceGraphqlClient();

  const { api_key_by_pk } = await fetchApiKeySdk(serviceClient).FetchAPIKey({
    id,
    appId,
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

  const signedFetch = createSignedFetcher({
    service: "execute-api",
    region: process.env.TRANSACTION_BACKEND_REGION,
  });

  const res = await signedFetch(
    `${process.env.NEXT_SERVER_INTERNAL_PAYMENTS_ENDPOINT}?miniapp-id=${appId}`,
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
    console.warn("Error fetching transaction", data);

    let errorMessage;
    if (data && data.error) {
      errorMessage = data.error.message;
    } else {
      errorMessage = "Unknown error";
    }

    return errorResponse({
      statusCode: res.status,
      code: data.error.code ?? "internal_api_error",
      detail: "Transaction fetch to backend failed",
      attribute: "transaction",
      req,
    });
  }

  return (data?.result?.transactions || []).sort(
    (a: TransactionMetadata, b: TransactionMetadata) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
};
