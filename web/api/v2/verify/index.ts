import {
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  canVerifyForAction,
  nullifierHashToBigIntStr,
  verifyProof,
} from "@/api/helpers/verify";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/services/posthogClient";
import { AppErrorCodes, VerificationLevel } from "@worldcoin/idkit-core";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as atomicUpsertNullifierSdk } from "./graphql/atomic-upsert-nullifier.generated";
import { getSdk as getFetchAppActionSdk } from "./graphql/fetch-app-action.generated";

const VerificationLevelWithFace = {
  ...VerificationLevel,
  Face: "face" as const,
};

const schema = yup
  .object({
    action: yup
      .string()
      .strict()
      .nonNullable()
      .required("This attribute is required."),
    signal_hash: yup
      .string()
      .matches(/^0x[\dabcdef]+$/, "Invalid signal_hash.")
      .default(
        "0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4", // hashToField("")
      ),
    proof: yup.string().strict().required("This attribute is required."),
    nullifier_hash: yup
      .string()
      .strict()
      .matches(
        /^(0x)?[\da-fA-F]+$/,
        "Invalid nullifier_hash. Must be a hex string with optional 0x prefix.",
      )
      .required("This attribute is required."),
    merkle_root: yup.string().strict().required("This attribute is required."),
    verification_level: yup
      .string()
      .oneOf(Object.values(VerificationLevelWithFace))
      .required("This attribute is required."),
    max_age: yup
      .number()
      .integer()
      .min(3600, "Maximum root age cannot be less than 3600 seconds (1 hour).")
      .max(
        604800,
        "Maximum root age cannot be more than 604800 seconds (7 days).",
      )
      .strict()
      .optional(),
  })
  .noUnknown();

export async function POST(
  req: NextRequest,
  { params }: { params: { app_id: string } },
) {
  if (!params.app_id) {
    return errorRequiredAttribute("app_id", req);
  }

  const app_id = params.app_id?.toString();

  // Read the body as text first to avoid "Body is unusable" error
  const rawBody = await req.text();

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    logger.warn("Invalid JSON in request body", {
      error,
      app_id,
      body: rawBody,
    });

    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid JSON in request body",
      attribute: null,
      req,
      app_id,
    });
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return handleError(req);
  }

  const client = await getAPIServiceGraphqlClient();

  // Convert the nullifier hash to its integer representation for more robust comparison
  const nullifier_hash_int = nullifierHashToBigIntStr(
    parsedParams.nullifier_hash,
  );

  let appActionResponse = await getFetchAppActionSdk(client).FetchAppAction({
    app_id,
    action: parsedParams.action,
    nullifier_hash_int,
  });

  if (!appActionResponse.app.length) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "App not found. App may be no longer active.",
      attribute: null,
      req,
      app_id,
    });
  }

  const app = appActionResponse.app[0];

  if (!app.actions.length) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_action",
      detail: "Action not found.",
      attribute: "action",
      req,
      app_id,
    });
  }

  // We allow on-chain actions to be verified here, but we indicate to developers that they shouldn't be verified here
  let message = "Proof verified successfully";
  if (app.engine !== "cloud") {
    message = "This action runs on-chain and shouldn't be verified here.";
  }

  const { action, nullifier } = {
    action: app.actions[0],
    nullifier: app.actions[0]?.nullifiers?.[0],
  };

  if (action.status === "inactive") {
    return errorResponse({
      statusCode: 400,
      code: "action_inactive",
      detail: "This action is inactive.",
      attribute: "status",
      req,
      app_id,
    });
  }

  // Check so we don't verify proof if the person has already verified before and exceeded the max number of times to verify
  if (!canVerifyForAction(nullifier, action.max_verifications)) {
    // Return error response if person has already verified before and exceeded the max number of times to verify
    const errorMsg =
      action.max_verifications === 1
        ? "This person has already verified for this action."
        : `This person has already verified for this action the maximum number of times (${action.max_verifications}).`;
    return errorValidation(
      "max_verifications_reached",
      errorMsg,
      null,
      req,
      app_id,
    );
  }

  if (!action.external_nullifier) {
    return errorResponse({
      statusCode: 400,
      code: "verification_error",
      detail: "This action does not have a valid external nullifier set.",
      attribute: null,
      req,
      app_id,
    });
  }

  try {
    // ANCHOR: Verify the proof with the World ID smart contract

    const { error, success } = await verifyProof(
      {
        signal_hash: parsedParams.signal_hash,
        proof: parsedParams.proof,
        merkle_root: parsedParams.merkle_root,
        nullifier_hash: parsedParams.nullifier_hash,
        external_nullifier: action.external_nullifier,
      },
      {
        is_staging: app.is_staging,
        verification_level: parsedParams.verification_level,
        max_age: parsedParams.max_age,
      },
    );

    if (error || !success) {
      await captureEvent({
        event: "action_verify_failed",
        distinctId: action.id,
        properties: {
          action_id: action.id,
          app_id: app.id,
          environment: app.is_staging ? "staging" : "production",
          verification_level: parsedParams.verification_level,
          error: error,
        },
      });
      return errorResponse({
        statusCode: error?.statusCode || 400,
        code: error?.code || AppErrorCodes.GenericError,
        detail: error?.message || "There was an error verifying this proof.",
        attribute: error?.attribute || null,
        req,
        app_id,
      });
    }
  } catch (e: any) {
    console.warn("Error verifying proof", { error: e, app_id });
    return errorResponse({
      statusCode: 400,
      code: "verification_error",
      detail: e.message,
      attribute: null,
      req,
      app_id,
    });
  }

  try {
    const upsertResponse = await atomicUpsertNullifierSdk(
      client,
    ).AtomicUpsertNullifier({
      action_id: action.id,
      nullifier_hash: parsedParams.nullifier_hash,
      nullifier_hash_int: nullifier_hash_int,
    });

    if (!upsertResponse?.update_nullifier?.returning?.length) {
      return errorResponse({
        statusCode: 400,
        code: "verification_error",
        detail: "There was an error upserting the nullifier.",
        attribute: null,
        req,
        app_id,
      });
    }

    await captureEvent({
      event: "action_verify_success",
      distinctId: action.id,
      properties: {
        action_id: action.id,
        app_id: app.id,
        verification_level: parsedParams.verification_level,
        environment: app.is_staging ? "staging" : "production",
        type: upsertResponse.update_nullifier.returning[0].uses,
      },
    });

    return NextResponse.json(
      {
        uses: upsertResponse.update_nullifier.returning[0].uses,
        success: true,
        action: action.action ?? null,
        max_uses: action.max_verifications,
        nullifier_hash:
          upsertResponse.update_nullifier.returning[0].nullifier_hash,
        created_at: upsertResponse.update_nullifier.returning[0].created_at,
        verification_level: parsedParams.verification_level,
        message,
      },
      { status: 200 },
    );
  } catch (e: any) {
    // TODO: Currently hasura doesn't return raised exceptions well. https://github.com/hasura/graphql-engine/issues/2599
    const isMaxUsesError = e.message?.includes(
      "Maximum uses exceeded for this action",
    );

    return errorResponse({
      statusCode: 400,
      code: "verification_error",
      detail: isMaxUsesError
        ? `This action has reached its maximum number of allowed verifications.`
        : e.message,
      attribute: null,
      req,
      app_id,
    });
  }
}
