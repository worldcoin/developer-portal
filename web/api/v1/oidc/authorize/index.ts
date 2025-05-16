import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { fetchActiveJWK } from "@/api/helpers/jwks";
import { generateOIDCJWT } from "@/api/helpers/jwts";
import {
  OIDCErrorCodes,
  OIDCResponseTypeMapping,
  OIDCScopes,
  checkFlowType,
  fetchOIDCApp,
  generateOIDCCode,
} from "@/api/helpers/oidc";
import { corsHandler } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { verifyProof } from "@/api/helpers/verify";
import { Nullifier_Constraint } from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { OIDCFlowType, OIDCResponseType } from "@/lib/types";
import { captureEvent } from "@/services/posthogClient";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { hashToField } from "@worldcoin/idkit-core/hashing";
import { createHash } from "crypto";
import { toBeHex } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getNullifierSdk } from "./graphql/fetch-nullifier.generated";
import { getSdk as getUpsertNullifierSdk } from "./graphql/upsert-nullifier.generated";

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

const corsMethods = ["POST", "OPTIONS"];
/**
 * Authenticates a "Sign in with World ID" user with a ZKP and issues a JWT or a code (authorization code flow)
 * This endpoint is called by the Sign in with World ID page (or the app's own page if using IDKit [advanced])
 */
export async function POST(req: NextRequest) {
  const redis = global.RedisClient;

  if (!redis) {
    return corsHandler(
      errorResponse({
        statusCode: 500,
        code: "internal_server_error",
        detail: "Redis client not found",
        attribute: "server",
        req,
      }),
      corsMethods,
    );
  }

  let app_id: string | undefined;

  try {
    const body = await req.json();
    const { isValid, parsedParams, handleError } = await validateRequestSchema({
      schema,
      value: body,
    });

    if (!isValid) {
      return handleError(req);
    }

    app_id = parsedParams.app_id;

    const {
      proof,
      nullifier_hash,
      merkle_root,
      signal,
      verification_level,
      response_type,
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
        return corsHandler(
          errorResponse({
            statusCode: 400,
            code: OIDCErrorCodes.UnsupportedResponseType,
            detail: `Invalid response type: ${response_type}.`,
            attribute: "response_type",
            req,
            app_id,
          }),
          corsMethods,
        );
      }
    }

    if (code_challenge && code_challenge_method !== "S256") {
      return corsHandler(
        errorResponse({
          statusCode: 400,
          code: OIDCErrorCodes.InvalidRequest,
          detail: `Invalid code_challenge_method: ${code_challenge_method}.`,
          attribute: "code_challenge_method",
          req,
          app_id,
        }),
        corsMethods,
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
      return corsHandler(
        errorResponse({
          statusCode: 400,
          code: OIDCErrorCodes.InvalidScope,
          detail: `The ${OIDCScopes.OpenID} scope is always required.`,
          attribute: "scope",
          req,
          app_id,
        }),
        corsMethods,
      );
    }

    // ANCHOR: Check the app is valid and fetch information
    const { app, error: fetchAppError } = await fetchOIDCApp(
      app_id,
      redirect_uri,
    );
    if (!app || fetchAppError) {
      return corsHandler(
        errorResponse({
          statusCode: fetchAppError?.statusCode ?? 400,
          code: fetchAppError?.code ?? "error",
          detail: fetchAppError?.message ?? "Error fetching app.",
          attribute: fetchAppError?.attribute ?? "app_id",
          req,
          app_id,
        }),
        corsMethods,
      );
    }

    // ANCHOR: Verify redirect URI is valid
    if (app.registered_redirect_uri !== redirect_uri) {
      return corsHandler(
        errorResponse({
          statusCode: 400,
          code: OIDCErrorCodes.InvalidRedirectURI,
          detail: "Invalid redirect URI.",
          attribute: "redirect_uri",
          req,
          app_id,
        }),
        corsMethods,
      );
    }

    // Anchor: Check the proof hasn't been replayed
    const hashedProof = createHash("sha256").update(proof).digest("hex");
    const proofKey = `oidc:proof:${hashedProof}`;
    const isProofReplayed = await redis.get(proofKey);

    if (isProofReplayed) {
      return corsHandler(
        errorResponse({
          statusCode: 400,
          code: "invalid_proof",
          detail: "This proof has already been used. Please try again",
          attribute: "proof",
          req,
          app_id,
        }),
        corsMethods,
      );
    }

    // Set the proof before continuing with other operations
    await redis.set(proofKey, "1", "EX", 5400);

    // For OIDC we should always hash the signal now.
    const signalHash = toBeHex(hashToField(signal).hash as bigint);

    // ANCHOR: Verify the zero-knowledge proof
    const { error: verifyError } = await verifyProof(
      {
        proof,
        nullifier_hash,
        merkle_root,
        signal_hash: signalHash,
        external_nullifier: app.external_nullifier,
      },
      {
        is_staging: app.is_staging,
        verification_level,
        max_age: 3600, // require that root be less than 1 hour old
      },
    );

    if (verifyError) {
      return corsHandler(
        errorResponse({
          statusCode: verifyError.statusCode ?? 400,
          code: verifyError.code ?? "invalid_proof",
          detail:
            verifyError.message ??
            "Verification request error. Please try again.",
          attribute: verifyError.attribute,
          req,
          app_id,
        }),
        corsMethods,
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
            kid: jwk.kid,
            kms_id: jwk.kms_id ?? "",
          });
        }

        response[response_type as keyof typeof OIDCResponseTypeMapping] = jwt;
      }
    }

    const client = await getAPIServiceGraphqlClient();
    const nullifierSdk = getNullifierSdk(client);
    const upsertNullifierSdk = getUpsertNullifierSdk(client);

    let hasNullifier: boolean = false;

    try {
      const fetchNullifierResult = await nullifierSdk.Nullifier({
        nullifier_hash,
      });

      if (!fetchNullifierResult?.nullifier) {
        logger.warn("Error fetching nullifier.", {
          fetchNullifierResult: fetchNullifierResult ?? {},
          app_id,
        });
        hasNullifier = false;
      }
      hasNullifier = Boolean(fetchNullifierResult.nullifier?.[0]?.id);
    } catch (error) {
      // Temp Fix to reduce on call alerts
      logger.warn("Query error nullifier.", {
        nullifier_hash,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        app_id,
      });
    }

    if (!hasNullifier) {
      try {
        const { insert_nullifier_one } =
          await upsertNullifierSdk.UpsertNullifier({
            object: {
              nullifier_hash,
              action_id: app.action_id,
            },
            on_conflict: {
              constraint: Nullifier_Constraint.NullifierPkey,
            },
          });

        if (!insert_nullifier_one) {
          logger.error("Error inserting nullifier.", {
            insert_nullifier_one: insert_nullifier_one ?? {},
            app_id,
          });
        }
      } catch (error) {
        logger.error("Generic Error inserting nullifier", {
          req,
          error,
          app_id,
        });
      }
    }

    await captureEvent({
      event: "world_id_sign_in_success",
      distinctId: app.id,
      properties: {
        verification_level: verification_level,
      },
    });

    return corsHandler(NextResponse.json(response, { status: 200 }), [
      "POST",
      "OPTIONS",
    ]);
  } catch (error) {
    // Handle any unexpected errors
    logger.error("Unexpected error in OIDC authorize", {
      error,
      app_id,
    });

    return corsHandler(
      errorResponse({
        statusCode: 500,
        code: "internal_server_error",
        detail: "An unexpected error occurred",
        attribute: "server",
        req,
        app_id,
      }),
      corsMethods,
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
