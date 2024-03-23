import {
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "@/api/helpers/errors";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { canVerifyForAction } from "@/legacy/backend/utils";
import { fetchActionForProof, verifyProof } from "@/lib/verify";
import { captureEvent } from "@/services/posthogClient";
import { ApolloError, gql } from "@apollo/client";
import { AppErrorCodes, VerificationLevel } from "@worldcoin/idkit-core";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const schema = yup.object({
  action: yup
    .string()
    .strict()
    .nonNullable()
    .required("This attribute is required."),
  signal_hash: yup
    .string()
    .length(66)
    .matches(/^0x[\dabcdef]+$/, "Invalid signal_hash.")
    .default(
      "0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4", // hashToField("")
    ),
  proof: yup.string().strict().required("This attribute is required."),
  nullifier_hash: yup.string().strict().required("This attribute is required."),
  merkle_root: yup.string().strict().required("This attribute is required."),
  verification_level: yup
    .string()
    .oneOf(Object.values(VerificationLevel))
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
});

export async function POST(
  req: NextRequest,
  { params }: { params: { app_id: string } },
) {
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req);
  }

  if (!params.app_id) {
    return errorRequiredAttribute("app_id", req);
  }

  const client = await getAPIServiceClient();
  const data = await fetchActionForProof(
    client,
    params.app_id?.toString(),
    parsedParams.nullifier_hash,
    parsedParams.action,
  );

  if (data.error || !data.app) {
    return errorResponse({
      statusCode: data.error?.statusCode || 400,
      code: data.error?.code || "unknown_error",
      detail: data.error?.message || "There was an error verifying this proof.",
      attribute: data.error?.attribute || null,
      req,
    });
  }

  const { app } = data;
  const { action, nullifier } = app;

  if (action.status === "inactive") {
    return errorResponse({
      statusCode: 400,
      code: "action_inactive",
      detail: "This action is inactive.",
      attribute: "status",
      req,
    });
  }

  if (!canVerifyForAction(nullifier, action.max_verifications)) {
    // Return error response if person has already verified before and exceeded the max number of times to verify
    const errorMsg =
      action.max_verifications === 1
        ? "This person has already verified for this action."
        : `This person has already verified for this action the maximum number of times (${action.max_verifications}).`;
    return errorValidation("max_verifications_reached", errorMsg, null, req);
  }

  if (!action.external_nullifier) {
    return errorResponse({
      statusCode: 400,
      code: "verification_error",
      detail: "This action does not have a valid external nullifier set.",
      attribute: null,
      req,
    });
  }

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
    });
  }

  if (nullifier) {
    const updateResponse = await client.mutate({
      mutation: updateNullifierQuery,
      variables: {
        nullifier_hash: nullifier.nullifier_hash,
        uses: nullifier.uses,
      },
    });

    if (updateResponse.data.update_nullifier.affected_rows === 0) {
      return errorValidation(
        AppErrorCodes.MaxVerificationsReached,
        "This person has already verified for this particular action the maximum number of times allowed.",
        null,
        req,
      );
    }

    await captureEvent({
      event: "action_verify_success",
      distinctId: action.id,
      properties: {
        action_id: action.id,
        app_id: app.id,
        verification_level: parsedParams.verification_level,
        environment: app.is_staging ? "staging" : "production",
        type: nullifier.uses,
      },
    });

    return NextResponse.json(
      {
        success: true,
        uses: nullifier.uses + 1,
        action: action.action ?? null,
        created_at: nullifier.created_at,
        max_uses: action.max_verifications,
        nullifier_hash: nullifier.nullifier_hash,
      },
      { status: 200 },
    );
  } else {
    try {
      const insertResponse = await client.mutate({
        mutation: insertNullifierQuery,
        variables: {
          action_id: action.id,
          nullifier_hash: parsedParams.nullifier_hash,
        },
      });

      if (
        insertResponse.data.insert_nullifier_one.nullifier_hash !==
        parsedParams.nullifier_hash
      ) {
        return errorResponse({
          statusCode: 400,
          code: "verification_error",
          detail:
            "There was an error inserting the nullifier. Please try again.",
          attribute: null,
          req,
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
          type: "unique",
        },
      });

      return NextResponse.json(
        {
          uses: 1,
          success: true,
          action: action.action ?? null,
          max_uses: action.max_verifications,
          nullifier_hash:
            insertResponse.data.insert_nullifier_one.nullifier_hash,
          created_at: insertResponse.data.insert_nullifier_one.created_at,
          verification_level: parsedParams.verification_level,
        },
        { status: 200 },
      );
    } catch (e) {
      if (
        (e as ApolloError)?.graphQLErrors?.[0]?.extensions?.code ==
        "constraint-violation"
      ) {
        return errorValidation(
          AppErrorCodes.MaxVerificationsReached,
          "This person has already verified for this particular action the maximum number of times allowed.",
          null,
          req,
        );
      }

      throw e;
    }
  }
}

const insertNullifierQuery = gql`
  mutation InsertNullifier($action_id: String!, $nullifier_hash: String!) {
    insert_nullifier_one(
      object: { action_id: $action_id, nullifier_hash: $nullifier_hash }
    ) {
      created_at
      nullifier_hash
    }
  }
`;

const updateNullifierQuery = gql`
  mutation UpdateNullifierUses($nullifier_hash: String!, $uses: Int!) {
    update_nullifier(
      where: { uses: { _eq: $uses }, nullifier_hash: { _eq: $nullifier_hash } }
      _inc: { uses: 1 }
    ) {
      affected_rows
    }
  }
`;
