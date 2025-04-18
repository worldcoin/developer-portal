import { runCors } from "@/legacy/backend/cors";
import {
  errorNotAllowed,
  errorResponse,
  errorValidation,
} from "@/legacy/backend/errors";
import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { fetchActiveJWK } from "@/legacy/backend/jwks";
import { generateOIDCJWT } from "@/legacy/backend/jwts";
import {
  OIDCErrorCodes,
  OIDCResponseTypeMapping,
  OIDCScopes,
  checkFlowType,
  fetchOIDCApp,
  generateOIDCCode,
} from "@/legacy/backend/oidc";
import { validateRequestSchema } from "@/legacy/backend/utils";
import { verifyProof } from "@/legacy/backend/verify";
import { OIDCFlowType, OIDCResponseType } from "@/legacy/lib/types";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/services/posthogClient";
import { gql } from "@apollo/client";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { createHash } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";

const UpsertNullifier = gql`
  mutation UpsertNullifier(
    $object: nullifier_insert_input!
    $on_conflict: nullifier_on_conflict!
  ) {
    insert_nullifier_one(object: $object, on_conflict: $on_conflict) {
      id
      nullifier_hash
    }
  }
`;

const Nullifier = gql`
  query Nullifier($nullifier_hash: String!) {
    nullifier(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
      id
    }
  }
`;

// NOTE: This endpoint should only be called from Sign in with Worldcoin, params follow World ID conventions. Sign in with Worldcoin handles OIDC requests.
const schema = yup.object({
  proof: yup.string().strict().required("This attribute is required."),
  nullifier_hash: yup.string().strict().required("This attribute is required."),
  merkle_root: yup.string().strict().required("This attribute is required."),
  verification_level: yup
    .string()
    .oneOf(Object.values(VerificationLevel))
    .required("This attribute is required."),
  app_id: yup.string().strict().required("This attribute is required."),
  signal: yup // `signal` in the context of World ID; `nonce` in the context of OIDC
    .string()
    .ensure()
    .when("response_type", {
      is: (response_type: string) =>
        !["code", "code token"].includes(response_type),
      then: (nonce) =>
        nonce.required(
          "`nonce` required for all response types except `code` and `code token`.",
        ),
    }), // NOTE: nonce is required for all response types except `code` and `code token`
  code_challenge: yup.string(),
  code_challenge_method: yup.string(),
  scope: yup.string().strict().required("The openid scope is always required."),
  response_type: yup.string().strict().required("This attribute is required."),
  redirect_uri: yup.string().strict().required("This attribute is required."),
});

/**
 * Authenticates a "Sign in with World ID" user with a ZKP and issues a JWT or a code (authorization code flow)
 * This endpoint is called by the Sign in with World ID page (or the app's own page if using IDKit [advanced])
 * @param req
 * @param res
 */
export default async function handleOIDCAuthorize(
  req: NextApiRequest,
  res: NextApiResponse,
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

  const redis = global.RedisClient;

  if (!redis) {
    return errorResponse(
      res,
      500,
      "internal_server_error",
      "Redis client not found",
      "server",
      req,
    );
  }

  try {
    const { isValid, parsedParams, handleError } = await validateRequestSchema({
      schema,
      value: req.body,
    });

    if (!isValid) {
      return handleError(req, res);
    }

    const {
      proof,
      nullifier_hash,
      merkle_root,
      signal,
      verification_level,
      response_type,
      app_id,
      scope,
      redirect_uri,
      code_challenge,
      code_challenge_method,
    } = parsedParams;

    const response_types = decodeURIComponent(
      (response_type as string | string[]).toString(),
    ).split(" ");

    for (const response_type of response_types) {
      if (!Object.keys(OIDCResponseTypeMapping).includes(response_type)) {
        return errorValidation(
          OIDCErrorCodes.UnsupportedResponseType,
          `Invalid response type: ${response_type}.`,
          "response_type",
          res,
          req,
        );
      }
    }

    if (code_challenge && code_challenge_method !== "S256") {
      return errorValidation(
        OIDCErrorCodes.InvalidRequest,
        `Invalid code_challenge_method: ${code_challenge_method}.`,
        "code_challenge_method",
        res,
        req,
      );
    }

    const scopes = decodeURIComponent(
      (scope as string | string[])?.toString(),
    ).split(" ") as OIDCScopes[];
    const sanitizedScopes: OIDCScopes[] = scopes.length
      ? [
          ...new Set(
            // NOTE: Invalid scopes are ignored per spec (3.1.2.1)
            scopes.filter((scope) => Object.values(OIDCScopes).includes(scope)),
          ),
        ]
      : [];

    if (
      !sanitizedScopes.length ||
      !sanitizedScopes.includes(OIDCScopes.OpenID)
    ) {
      return errorValidation(
        OIDCErrorCodes.InvalidScope,
        `The ${OIDCScopes.OpenID} scope is always required.`,
        "scope",
        res,
        req,
      );
    }

    // ANCHOR: Check the app is valid and fetch information
    const { app, error: fetchAppError } = await fetchOIDCApp(
      app_id,
      redirect_uri,
    );
    if (!app || fetchAppError) {
      return errorResponse(
        res,
        fetchAppError?.statusCode ?? 400,
        fetchAppError?.code ?? "error",
        fetchAppError?.message ?? "Error fetching app.",
        fetchAppError?.attribute ?? "app_id",
        req,
      );
    }

    // ANCHOR: Verify redirect URI is valid
    if (app.registered_redirect_uri !== redirect_uri) {
      return errorValidation(
        OIDCErrorCodes.InvalidRedirectURI,
        "Invalid redirect URI.",
        "redirect_uri",
        res,
        req,
      );
    }

    // Anchor: Check the proof hasn't been replayed
    const hashedProof = createHash("sha256").update(proof).digest("hex");
    const proofKey = `oidc:proof:${hashedProof}`;
    const isProofReplayed = await redis.get(proofKey);

    if (isProofReplayed) {
      return errorResponse(
        res,
        400,
        "invalid_proof",
        "This proof has already been used. Please try again",
        "proof",
        req,
      );
    }

    // Set the proof before continuing with other operations
    await redis.set(proofKey, "1", "EX", 5400);

    // ANCHOR: Verify the zero-knowledge proof
    const { error: verifyError } = await verifyProof(
      {
        proof,
        nullifier_hash,
        merkle_root,
        signal,
        external_nullifier: app.external_nullifier,
      },
      {
        is_staging: app.is_staging,
        verification_level,
        max_age: 3600, // require that root be less than 1 hour old
      },
    );

    if (verifyError) {
      return errorResponse(
        res,
        verifyError.statusCode ?? 400,
        verifyError.code ?? "invalid_proof",
        verifyError.message ?? "Verification request error. Please try again.",
        verifyError.attribute,
        req,
      );
    }

    // ANCHOR: Proof is valid, issue relevant codes
    const response = {} as { code?: string; id_token?: string; token?: string };

    if (response_types.includes(OIDCResponseType.Code)) {
      const shouldStoreSignal =
        checkFlowType(response_types) === OIDCFlowType.AuthorizationCode &&
        signal;

      response.code = await generateOIDCCode(
        app.id,
        nullifier_hash,
        verification_level,
        sanitizedScopes,
        redirect_uri,
        code_challenge,
        code_challenge_method,
        shouldStoreSignal ? signal : null,
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
            verification_level,
            nonce: signal,
            scope: sanitizedScopes,
            ...jwk,
          });
        }

        response[response_type as keyof typeof OIDCResponseTypeMapping] = jwt;
      }
    }

    const client = await getAPIServiceClient();

    let hasNullifier: boolean = false;

    try {
      const fetchNullifierResult = await client.query<{
        nullifier: {
          id: string;
        }[];
      }>({
        query: Nullifier,
        variables: {
          nullifier_hash,
        },
      });

      if (!fetchNullifierResult?.data?.nullifier) {
        logger.warn("Error fetching nullifier.", fetchNullifierResult ?? {});
        hasNullifier = false;
      }
      hasNullifier = Boolean(fetchNullifierResult.data.nullifier?.[0]?.id);
    } catch (error) {
      // Temp Fix to reduce on call alerts
      logger.warn("Query error nullifier.", {
        nullifier_hash,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    if (!hasNullifier) {
      try {
        const { data: insertNullifierResult } = await client.mutate<{
          insert_nullifier_one: {
            id: string;
            nullifier_hash: string;
          };
        }>({
          mutation: UpsertNullifier,
          variables: {
            object: {
              nullifier_hash,
              action_id: app.action_id,
            },
            on_conflict: {
              constraint: "nullifier_pkey",
            },
          },
        });

        if (!insertNullifierResult?.insert_nullifier_one) {
          logger.error(
            "Error inserting nullifier.",
            insertNullifierResult ?? {},
          );
        }
      } catch (error) {
        logger.error("Generic Error inserting nullifier", { req, error });
      }
    }

    await captureEvent({
      event: "world_id_sign_in_success",
      distinctId: app.id,
      properties: {
        verification_level: verification_level,
      },
    });

    res.status(200).json(response);
  } catch (error) {
    // Handle any unexpected errors
    logger.error("Unexpected error in OIDC authorize", { error });

    // If we haven't sent a response yet, send a generic error
    if (!res.writableEnded) {
      return errorResponse(
        res,
        500,
        "internal_server_error",
        "An unexpected error occurred",
        "server",
        req,
      );
    }
  }
}
