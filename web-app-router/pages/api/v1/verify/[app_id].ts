import { ApolloError, gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "@/legacy/backend/errors";

import { getAPIServiceClient } from "@/legacy/backend/graphql";
import { canVerifyForAction, validateRequestSchema } from "@/legacy/backend/utils";
import { fetchActionForProof, verifyProof } from "@/legacy/backend/verify";
import {
  AppErrorCodes,
  CredentialType,
  VerificationLevel,
} from "@worldcoin/idkit-core";
import * as yup from "yup";
import { captureEvent } from "@/legacy/services/posthogClient";

const schema = yup.object({
  action: yup
    .string()
    .strict()
    .nonNullable()
    .defined("This attribute is required."),
  signal: yup.string().default(""),
  proof: yup.string().strict().required("This attribute is required."),
  nullifier_hash: yup.string().strict().required("This attribute is required."),
  merkle_root: yup.string().strict().required("This attribute is required."),
  verification_level: yup
    .string()
    .oneOf(Object.values(VerificationLevel))
    .when("credential_type", {
      is: undefined,
      then: (verification_level) =>
        verification_level.required(
          "`verification_level` required unless deprecated `credential_type` is used."
        ),
    }),
  credential_type: yup.string().oneOf(Object.values(CredentialType)),
});

export default async function handleVerify(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // NOTE: Lack of CORS headers, because this endpoint should not be called from the frontend (security reasons)
  if (!req.method || !["POST"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  if (!req.query.app_id) {
    return errorRequiredAttribute("app_id", res, req);
  }

  const client = await getAPIServiceClient();
  const data = await fetchActionForProof(
    client,
    req.query.app_id?.toString(),
    parsedParams.nullifier_hash,
    parsedParams.action
  );

  if (data.error || !data.app) {
    return errorResponse(
      res,
      data.error?.statusCode || 400,
      data.error?.code || "unknown_error",
      data.error?.message || "There was an error verifying this proof.",
      data.error?.attribute || null,
      req
    );
  }

  const { app } = data;
  const { action, nullifier } = app;

  if (action.status === "inactive") {
    return errorResponse(
      res,
      400,
      "action_inactive",
      "This action is inactive.",
      "status",
      req
    );
  }

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
      res,
      req
    );
  }

  if (!action.external_nullifier) {
    return errorResponse(
      res,
      400,
      "verification_error",
      "This action does not have a valid external nullifier set.",
      null,
      req
    );
  }

  // NOTE: Backwards compatibility support for CredentialType
  const verification_level =
    parsedParams.verification_level ||
    (parsedParams.credential_type === CredentialType.Orb
      ? VerificationLevel.Orb
      : VerificationLevel.Device);

  // ANCHOR: Verify the proof with the World ID smart contract
  const { error, success } = await verifyProof(
    {
      signal: parsedParams.signal,
      proof: parsedParams.proof,
      merkle_root: parsedParams.merkle_root,
      nullifier_hash: parsedParams.nullifier_hash,
      external_nullifier: action.external_nullifier,
    },
    {
      is_staging: app.is_staging,
      verification_level,
    }
  );
  if (error || !success) {
    await captureEvent({
      event: "action_verify_failed",
      distinctId: app.id,
      properties: {
        action_id: action.id,
        error: error,
      },
    });
    return errorResponse(
      res,
      error?.statusCode || 400,
      error?.code || AppErrorCodes.GenericError,
      error?.message || "There was an error verifying this proof.",
      error?.attribute || null,
      req
    );
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
        res,
        req
      );
    }

    res.status(200).json({
      success: true,
      uses: nullifier.uses + 1,
      action: action.action ?? null,
      created_at: nullifier.created_at,
      max_uses: action.max_verifications,
      nullifier_hash: nullifier.nullifier_hash,
    });
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
        return errorResponse(
          res,
          400,
          "verification_error",
          "There was an error inserting the nullifier. Please try again.",
          null,
          req
        );
      }
      await captureEvent({
        event: "action_verify_success",
        distinctId: app.id,
        properties: {
          action_id: action.id,
          error: error,
        },
      });
      res.status(200).json({
        uses: 1,
        success: true,
        action: action.action ?? null,
        max_uses: action.max_verifications,
        nullifier_hash: insertResponse.data.insert_nullifier_one.nullifier_hash,
        created_at: insertResponse.data.insert_nullifier_one.created_at,
        verification_level,
      });
    } catch (e) {
      if (
        (e as ApolloError)?.graphQLErrors?.[0]?.extensions?.code ==
        "constraint-violation"
      ) {
        return errorValidation(
          AppErrorCodes.MaxVerificationsReached,
          "This person has already verified for this particular action the maximum number of times allowed.",
          null,
          res,
          req
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
