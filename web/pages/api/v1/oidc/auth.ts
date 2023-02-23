import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorValidation,
  errorResponse,
} from "api-helpers/errors";
import { fetchOIDCApp } from "api-helpers/oidc";
import { verifyProof } from "api-helpers/verify";
import { NextApiRequest, NextApiResponse } from "next";
import { CredentialType, OIDCResponseType } from "types";

/**
 * Authenticates a Sign in with World ID user with a ZKP and issues a JWT (implicit flow) or a code (authorization code flow)
 * This endpoint is called by the Sign in with World ID page (or the app's own page if using IDKit [advanced])
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of [
    "proof", // ZKP param
    "nullifier_hash", // ZKP param
    "merkle_root", // ZKP param
    "nonce", // `signal` in ZKP world
    "credential_type",
    "response_type",
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

  if (!Object.values(OIDCResponseType).includes(response_type)) {
    return errorValidation(
      "invalid",
      "Invalid response type. Use a valid OIDC response type.",
      "response_type",
      res
    );
  }

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

  const { error: verifyError } = await verifyProof(
    {
      proof,
      nullifier_hash,
      merkle_root,
      signal: nonce,
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
}
