import { errorOIDCResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { fetchActiveJWK } from "@/api/helpers/jwks";
import { generateOIDCJWT } from "@/api/helpers/jwts";
import { authenticateOIDCEndpoint } from "@/api/helpers/oidc";
import { corsHandler } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getDeleteAuthCodeSdk } from "./graphql/delete-auth-code.generated";
import { getSdk as getFetchRedirectCountSdk } from "./graphql/fetch-redirect-count.generated";

const corsMethods = ["POST", "OPTIONS"];
const schema = yup
  .object({
    grant_type: yup.string().default("authorization_code"),
    code: yup.string().strict().required("This attribute is required."),
    redirect_uri: yup.string().notRequired(),
    client_id: yup.string().notRequired(),
    client_secret: yup.string().notRequired(),
    code_verifier: yup.string().notRequired(),
  })
  .noUnknown();

export async function POST(req: NextRequest) {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/x-www-form-urlencoded")
  ) {
    const sanitizedContentType = req.headers
      .get("content-type")
      ?.replace(/\n|\r/g, "");
    console.warn("Invalid content type", sanitizedContentType);
    return errorOIDCResponse(
      400,
      "invalid_request",
      "Invalid content type. Only application/x-www-form-urlencoded is supported.",
      null,
      req,
    );
  }

  // ANCHOR: Authenticate the request
  let authToken = req.headers.get("authorization");

  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  const body = Object.fromEntries(params.entries());
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    console.log("Invalid request", parsedParams);
    return handleError(req);
  }

  const {
    grant_type,
    code,
    redirect_uri,
    client_id,
    client_secret,
    code_verifier,
  } = parsedParams;

  if (!authToken) {
    // Attempt to get the credentials in the request body
    if (client_id && client_secret) {
      authToken = `Basic ${Buffer.from(
        `${client_id}:${client_secret}`,
      ).toString("base64")}`;
    }
  }

  if (!authToken) {
    const response = errorOIDCResponse(
      401,
      "unauthorized_client",
      "Please provide your app authentication credentials.",
      null,
      req,
    );
    return code_verifier ? corsHandler(response, corsMethods) : response;
  }

  let app_id: string | null;
  app_id = await authenticateOIDCEndpoint(authToken);

  if (!app_id) {
    const response = errorOIDCResponse(
      401,
      "unauthorized_client",
      "Invalid authentication credentials",
      null,
      req,
    );
    return code_verifier ? corsHandler(response, corsMethods) : response;
  }

  const client = await getAPIServiceGraphqlClient();
  const deleteAuthCodeSdk = getDeleteAuthCodeSdk(client);
  const fetchRedirectCountSdk = getFetchRedirectCountSdk(client);
  const now = new Date().toISOString();
  const deleteAuthCodeResult = await deleteAuthCodeSdk.DeleteAuthCode({
    auth_code: code,
    app_id,
    now,
  });

  if (
    !deleteAuthCodeResult?.delete_auth_code ||
    !deleteAuthCodeResult.delete_auth_code.returning.length
  ) {
    const response = errorOIDCResponse(
      400,
      "invalid_grant",
      "Invalid authorization code.",
      null,
      req,
      app_id,
    );
    return code_verifier ? corsHandler(response, corsMethods) : response;
  }

  const authCode = deleteAuthCodeResult.delete_auth_code.returning[0];

  if (!redirect_uri) {
    const redirectCountResult =
      await fetchRedirectCountSdk.FetchRedirectCountQuery({
        app_id,
      });
    if (
      redirectCountResult?.action?.[0]?.redirect_count &&
      redirectCountResult?.action[0].redirect_count > 1
    ) {
      const response = errorOIDCResponse(
        400,
        "invalid_request",
        "Missing redirect URI.",
        "redirect_uri",
        req,
        app_id,
      );
      return code_verifier ? corsHandler(response, corsMethods) : response;
    }
  } else if (authCode.redirect_uri !== redirect_uri) {
    const response = errorOIDCResponse(
      400,
      "invalid_request",
      "Invalid redirect URI.",
      "redirect_uri",
      req,
      app_id,
    );
    return code_verifier ? corsHandler(response, corsMethods) : response;
  }

  if (authCode.code_challenge) {
    if (!code_verifier) {
      const response = errorOIDCResponse(
        400,
        "invalid_request",
        "Missing code verifier.",
        "code_verifier",
        req,
        app_id,
      );
      return code_verifier ? corsHandler(response, corsMethods) : response;
    }

    // We only support S256 method
    if (!verifyChallenge(authCode.code_challenge, code_verifier)) {
      await deleteAuthCodeSdk.DeleteAuthCode({
        auth_code: code,
        app_id,
        now,
      });

      const response = errorOIDCResponse(
        400,
        "invalid_request",
        "Invalid code verifier.",
        "code_verifier",
        req,
        app_id,
      );
      return code_verifier ? corsHandler(response, corsMethods) : response;
    }
  } else {
    if (code_verifier) {
      const response = errorOIDCResponse(
        400,
        "invalid_request",
        "Code verifier was not expected.",
        "code_verifier",
        req,
        app_id,
      );
      return code_verifier ? corsHandler(response, corsMethods) : response;
    }
  }

  const jwk = await fetchActiveJWK();
  const token = await generateOIDCJWT({
    app_id,
    nullifier_hash: authCode.nullifier_hash,
    verification_level: authCode.verification_level as VerificationLevel,
    kid: jwk.kid,
    kms_id: jwk.kms_id ?? "",
    scope: authCode.scope,
    nonce: authCode.nonce || undefined,
  });

  const response = NextResponse.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
    scope: authCode.scope?.join(" ") || "",
    id_token: token,
  });

  return code_verifier ? corsHandler(response, corsMethods) : response;
}

const verifyChallenge = (challenge: string, verifier: string) => {
  const hashedVerifier = createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return timingSafeEqual(Buffer.from(challenge), Buffer.from(hashedVerifier));
};

export async function OPTIONS(req: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
