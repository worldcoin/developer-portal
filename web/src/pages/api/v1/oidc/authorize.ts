import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { runCors } from "src/backend/cors";
import {
  errorNotAllowed,
  errorResponse,
  errorValidation,
} from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { fetchActiveJWK } from "src/backend/jwks";
import { generateOIDCJWT } from "src/backend/jwts";
import {
  OIDCErrorCodes,
  OIDCResponseTypeMapping,
  OIDCScopes,
  fetchOIDCApp,
  generateOIDCCode,
} from "src/backend/oidc";
import { validateRequestSchema } from "src/backend/utils";
import { verifyProof } from "src/backend/verify";
import { logger } from "src/lib/logger";
import { CredentialType, OIDCResponseType } from "src/lib/types";
import * as yup from "yup";

const InsertNullifier = gql`
  mutation SaveNullifier($object: nullifier_insert_input!) {
    insert_nullifier_one(object: $object) {
      id
      nullifier_hash
    }
  }
`;

// NOTE: This endpoint should only be called from Sign in with Worldcoin, params follow World ID conventions. Sign in with Worldcoin handles OIDC requests.
const schema = yup.object({
  proof: yup.string().required("This attribute is required."),
  nullifier_hash: yup.string().required("This attribute is required."),
  merkle_root: yup.string().required("This attribute is required."),
  credential_type: yup
    .string()
    .required("This attribute is required.")
    .oneOf(Object.values(CredentialType)),
  app_id: yup.string().required("This attribute is required."),
  signal: yup.string(), // `signal` in the context of World ID; `nonce` in the context of OIDC
  scope: yup.string().required("The openid scope is always required."),
  response_type: yup.string().required("This attribute is required."),
  redirect_uri: yup.string().required("This attribute is required."),
  code_challenge: yup.string(),
  code_challenge_method: yup.string(),
});
type Body = yup.InferType<typeof schema>;

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

  const { isValid, parsedParams } = await validateRequestSchema<Body>({
    req,
    res,
    schema,
  });

  if (!isValid || !parsedParams) return;

  const {
    proof,
    nullifier_hash,
    merkle_root,
    signal,
    credential_type,
    response_type,
    app_id,
    scope,
    redirect_uri,
    code_challenge,
    code_challenge_method,
  } = parsedParams;

  const response_types = decodeURIComponent(
    (response_type as string | string[]).toString()
  ).split(" ");

  for (const response_type of response_types) {
    if (!Object.keys(OIDCResponseTypeMapping).includes(response_type)) {
      return errorValidation(
        OIDCErrorCodes.UnsupportedResponseType,
        `Invalid response type: ${response_type}.`,
        "response_type",
        res,
        req
      );
    }
  }

  if (code_challenge && code_challenge_method !== "S256") {
    return errorValidation(
      OIDCErrorCodes.InvalidRequest,
      `Invalid code_challenge_method: ${code_challenge_method}.`,
      "code_challenge_method",
      res,
      req
    );
  }

  const scopes = decodeURIComponent(
    (scope as string | string[])?.toString()
  ).split(" ") as OIDCScopes[];
  const sanitizedScopes: OIDCScopes[] = scopes.length
    ? [
        ...new Set(
          // NOTE: Invalid scopes are ignored per spec (3.1.2.1)
          scopes.filter((scope) => Object.values(OIDCScopes).includes(scope))
        ),
      ]
    : [];

  if (!sanitizedScopes.length || !sanitizedScopes.includes(OIDCScopes.OpenID)) {
    return errorValidation(
      OIDCErrorCodes.InvalidScope,
      `The ${OIDCScopes.OpenID} scope is always required.`,
      "scope",
      res,
      req
    );
  }

  // ANCHOR: Check the app is valid and fetch information
  const { app, error: fetchAppError } = await fetchOIDCApp(
    app_id,
    redirect_uri
  );
  if (!app || fetchAppError) {
    return errorResponse(
      res,
      fetchAppError?.statusCode ?? 400,
      fetchAppError?.code ?? "error",
      fetchAppError?.message ?? "Error fetching app.",
      fetchAppError?.attribute ?? "app_id",
      req
    );
  }

  // ANCHOR: Verify redirect URI is valid
  if (app.registered_redirect_uri !== redirect_uri) {
    return errorValidation(
      OIDCErrorCodes.InvalidRedirectURI,
      "Invalid redirect URI.",
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
      signal: signal ?? "",
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
      verifyError.attribute,
      req
    );
  }

  // ANCHOR: Proof is valid, issue relevant codes
  const response = {} as { code?: string; id_token?: string; token?: string };

  if (response_types.includes(OIDCResponseType.Code)) {
    response.code = await generateOIDCCode(
      app.id,
      nullifier_hash,
      credential_type,
      sanitizedScopes,
      code_challenge,
      code_challenge_method ?? "S256"
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
          nonce: signal,
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
        id: string;
        nullifier_hash: string;
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
      logger.error("Error inserting nullifier.", insertNullifierResult ?? {});
    }
  } catch (error) {
    logger.error("Error inserting nullifier", { req, error });
  }

  res.status(200).json(response);
}
