import { runCors } from "api-helpers/cors";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
  errorResponse,
} from "api-helpers/errors";
import { fetchActiveJWK } from "api-helpers/jwks";
import {
  fetchOIDCApp,
  generateOIDCCode,
  OIDCResponseTypeMapping,
  OIDCScopes,
} from "api-helpers/oidc";
import { generateOIDCJWT } from "api-helpers/jwts";
import { verifyProof } from "api-helpers/verify";
import { NextApiRequest, NextApiResponse } from "next";
import { CredentialType, OIDCResponseType } from "types";
import { JWK_ALG_OIDC } from "consts";

/**
 * Authenticates a "Sign in with World ID" user with a ZKP and issues a JWT or a code (authorization code flow)
 * This endpoint is called by the Sign in with World ID page (or the app's own page if using IDKit [advanced])
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (
    req.method === "OPTIONS" ||
    req.body.response_type === OIDCResponseType.Code
  ) {
    // NOTE: Authorization code flow only should be called backend-side, no CORS (security reasons)
    // OPTIONS always returns CORS because browsers send an OPTIONS request first with no payload
    await runCors(req, res);
  }

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of [
    "proof", // ZKP param
    "nullifier_hash", // ZKP param
    "merkle_root", // ZKP param
    "credential_type",
    "app_id",
  ]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  const {
    proof,
    nullifier_hash,
    merkle_root,
    nonce,
    credential_type,
    response_type,
    app_id,
    scope,
  } = req.body;

  if (!Object.values(CredentialType).includes(credential_type)) {
    return errorValidation(
      "invalid",
      "Invalid credential type.",
      "credential_type",
      res
    );
  }

  const response_types = decodeURIComponent(
    (response_type as string | string[]).toString()
  ).split(" ");

  for (const response_type of response_types) {
    if (!Object.keys(OIDCResponseTypeMapping).includes(response_type)) {
      return errorValidation(
        "invalid",
        `Invalid response type: ${response_type}.`,
        "response_type",
        res
      );
    }
  }

  // TODO: Validate scopes (min openid, not unsupported scopes, remove duplicates, sort?)
  const scopes = decodeURIComponent(
    (scope as string | string[])?.toString()
  ).split(" ") as OIDCScopes[];
  const sanitizedScopes: OIDCScopes[] = scopes.length ? scopes : ["openid"];

  // ANCHOR: Check the app is valid and fetch information
  const { app, error: fetchAppError } = await fetchOIDCApp(app_id);
  if (!app || fetchAppError) {
    return errorResponse(
      res,
      fetchAppError?.statusCode ?? 400,
      fetchAppError?.code ?? "error",
      fetchAppError?.message ?? "Error fetching app.",
      fetchAppError?.attribute ?? "app_id"
    );
  }

  // TODO: For authorization code, we need to check the redirect URI is valid

  // ANCHOR: Verify the zero-knowledge proof
  const { error: verifyError } = await verifyProof(
    {
      proof,
      nullifier_hash,
      merkle_root,
      signal: nonce ?? "",
      external_nullifier: app.external_nullifier,
    },
    {
      is_staging: app.is_staging,
      contract_address: app.contract_address,
      credential_type,
    }
  );
  if (verifyError) {
    return errorResponse(
      res,
      verifyError.statusCode ?? 400,
      verifyError.code ?? "invalid_proof",
      verifyError.message ?? "Verification request error. Please try again.",
      verifyError.attribute
    );
  }

  // ANCHOR: Proof is valid, issue relevant codes
  const response = {} as { code?: string; id_token?: string; token?: string };

  if (response_types.includes(OIDCResponseType.Code)) {
    response.code = await generateOIDCCode(
      app.id,
      nullifier_hash,
      credential_type,
      sanitizedScopes
    );
  }

  let jwt: string | undefined;
  for (const response_type of response_types) {
    if (
      OIDCResponseTypeMapping[
        response_type as keyof typeof OIDCResponseTypeMapping
      ] === OIDCResponseType.JWT
    ) {
      if (!jwt) {
        const jwk = await fetchActiveJWK(JWK_ALG_OIDC);
        jwt = await generateOIDCJWT({
          app_id: app.id,
          nullifier_hash,
          credential_type,
          nonce: nonce ?? "",
          scope: sanitizedScopes,
          ...jwk,
        });
      }
      response[response_type as keyof typeof OIDCResponseTypeMapping] = jwt;
    }
  }

  res.status(200).json(response);
}
