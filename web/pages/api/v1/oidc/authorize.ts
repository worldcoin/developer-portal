import { runCors } from "api-helpers/cors";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
  errorResponse,
} from "api-helpers/errors";
import { fetchActiveJWK } from "api-helpers/jwks";
import { fetchOIDCApp, generateOIDCCode } from "api-helpers/oidc";
import { generateOIDCJWT } from "api-helpers/jwts";
import { verifyProof } from "api-helpers/verify";
import { NextApiRequest, NextApiResponse } from "next";
import { CredentialType, OIDCResponseType } from "types";

/**
 * Authenticates a "Sign in with World ID" user with a ZKP and issues a JWT (implicit flow) or a code (authorization code flow)
 * This endpoint is called by the Sign in with World ID page (or the app's own page if using IDKit [advanced])
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // FIXME: unblock the team
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.body.response_type === OIDCResponseType.Implicit) {
    // NOTE: CORS only for the implicit flow, because the authorization code flow is called from the backend (security reasons)
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
  } = req.body;

  if (!Object.values(CredentialType).includes(credential_type)) {
    return errorValidation(
      "invalid",
      "Invalid credential type.",
      "credential_type",
      res
    );
  }

  if (
    response_type &&
    !Object.values(OIDCResponseType).includes(response_type)
  ) {
    return errorValidation(
      "invalid",
      "Invalid response type. If you are unsure, use 'implicit'.",
      "response_type",
      res
    );
  }

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

  // ANCHOR: Proof is valid, issue a JWT or code
  if (response_type === OIDCResponseType.Code) {
    // For authorization code flow, issue a code
    const code = await generateOIDCCode(app.id, nullifier_hash);
    res.status(200).json({ code });
  } else {
    // For implicit flow, issue a JWT
    const jwk = await fetchActiveJWK();
    const jwt = await generateOIDCJWT({
      app_id: app.id,
      nullifier_hash,
      credential_type,
      kid: jwk.kid,
      nonce: nonce ?? "",
      privateJwk: jwk.private_jwk,
    });
    res.status(200).json({ jwt });
  }
}
