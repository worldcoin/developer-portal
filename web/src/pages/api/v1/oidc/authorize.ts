import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { runCors } from "src/backend/cors";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { fetchActiveJWK } from "src/backend/jwks";
import { generateOIDCJWT } from "src/backend/jwts";
import {
  OIDCResponseTypeMapping,
  OIDCScopes,
  fetchOIDCApp,
  generateOIDCCode,
} from "src/backend/oidc";
import { verifyProof } from "src/backend/verify";
import { CredentialType, OIDCResponseType } from "src/lib/types";

const InsertNullifier = gql`
  mutation SaveNullifier($object: nullifier_insert_input!) {
    insert_nullifier_one(object: $object) {
      id
      nullifier_hash
    }
  }
`;

/**
 * Authenticates a "Sign in with World ID" user with a ZKP and issues a JWT or a code (authorization code flow)
 * This endpoint is called by the Sign in with World ID page (or the app's own page if using IDKit [advanced])
 * @param req
 * @param res
 */
export default async function handleOIDCAuthorize(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (
    req.method === "OPTIONS" ||
    req.body.response_type === OIDCResponseType.JWT
  ) {
    // NOTE: Authorization code flow only should be called backend-side, no CORS (security reasons)
    // OPTIONS always returns CORS because browsers send an OPTIONS request first with no payload
    await runCors(req, res);
  }

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  for (const attr of [
    "proof", // ZKP param
    "nullifier_hash", // ZKP param
    "merkle_root", // ZKP param
    "credential_type",
    "app_id",
  ]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res, req);
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
    redirect_uri,
  } = req.body;

  if (!Object.values(CredentialType).includes(credential_type)) {
    return errorValidation(
      "invalid",
      "Invalid credential type.",
      "credential_type",
      res,
      req
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
        res,
        req
      );
    }
  }

  const scopes = decodeURIComponent(
    (scope as string | string[])?.toString()
  ).split(" ") as OIDCScopes[];
  const sanitizedScopes: OIDCScopes[] = scopes.length
    ? [
        ...new Set(
          scopes.filter((scope) => Object.values(OIDCScopes).includes(scope))
        ),
      ]
    : [OIDCScopes.OpenID];

  // ANCHOR: Check the app is valid and fetch information
  const { app, error: fetchAppError } = await fetchOIDCApp(
    app_id,
    redirect_uri ?? ""
  );
  if (!app || fetchAppError) {
    return errorResponse(
      res,
      fetchAppError?.statusCode ?? 400,
      fetchAppError?.code ?? "error",
      fetchAppError?.message ?? "Error fetching app.",
      fetchAppError?.attribute ?? "app_id"
    );
  }

  // ANCHOR: Verify redirect URI is valid
  if (
    response_types.length === 1 &&
    response_types.includes(OIDCResponseType.Code) &&
    !redirect_uri
  ) {
    return errorValidation(
      "required",
      "This attribute is required for the authorization code flow.",
      "redirect_uri",
      res,
      req
    );
  }

  if (redirect_uri && app.registered_redirect_uri !== redirect_uri) {
    return errorValidation(
      "invalid",
      "Invalid redirect URI. Redirect URIs should be preregistered.",
      "redirect_uri",
      res,
      req
    );
  }

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
        const jwk = await fetchActiveJWK();
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

  const client = await getAPIServiceClient();

  try {
    const { data: insertNullifierResult } = await client.mutate<{
      insert_nullifier_one: {
        id: "nil_c2c76cf4e599e6d1072662a52ae0abf0";
        nullifier_hash: "0x123";
      };
    }>({
      mutation: InsertNullifier,
      variables: {
        object: {
          nullifier_hash,
          merkle_root,
          credential_type,
          action_id: app.action_id,
        },
      },
    });

    if (!insertNullifierResult?.insert_nullifier_one) {
      throw new Error("Error inserting nullifier.");
    }
  } catch (error) {
    console.log(error);
  }

  res.status(200).json(response);
}
