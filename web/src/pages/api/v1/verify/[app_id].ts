import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "src/backend/errors";

import { getAPIServiceClient } from "src/backend/graphql";
import { canVerifyForAction, validateRequestSchema } from "src/backend/utils";
import { fetchActionForProof, verifyProof } from "src/backend/verify";
import { CredentialType } from "src/lib/types";
import * as yup from "yup";

const schema = yup.object({
  action: yup
    .string()
    .strict()
    .nonNullable()
    .defined("This attribute is required."),
  signal: yup
    .string()
    .strict()
    .nonNullable()
    .defined("This attribute is required."),
  proof: yup.string().strict().required("This attribute is required."),
  nullifier_hash: yup.string().strict().required("This attribute is required."),
  merkle_root: yup.string().strict().required("This attribute is required."),
  credential_type: yup
    .string()
    .required("This attribute is required.")
    .oneOf(Object.values(CredentialType)),
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

  // ANCHOR: Check if the action has a limit of verifications and if the person would exceed it
  if (action.action !== "") {
    // NOTE: If `action != ""`, action is NOT for Sign in with World ID
    if (!canVerifyForAction(nullifier, action.max_verifications)) {
      // Return error response if person has already verified before and exceeded the max number of times to verify
      const errorMsg =
        action.max_verifications === 1
          ? "This person has already verified for this action."
          : `This person has already verified for this action the maximum number of times (${action.max_verifications}).`;
      return errorValidation("already_verified", errorMsg, null, res, req);
    }
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
      credential_type: parsedParams.credential_type,
    }
  );
  if (error || !success) {
    return errorResponse(
      res,
      error?.statusCode || 400,
      error?.code || "unknown_error",
      error?.message || "There was an error verifying this proof.",
      error?.attribute || null,
      req
    );
  }

  if (nullifier) {
    const updateResponse = await client.query({
      query: updateNullifierQuery,
      variables: {
        nullifier_hash: nullifier.nullifier_hash,
        uses: nullifier.uses,
      },
    });

    if (updateResponse.data.update_nullifier.affected_rows === 0) {
      return errorValidation(
        "already_verified",
        "This person has already verified for this action.",
        null,
        res,
        req
      );
    }

    res.status(200).json({
      success: true,
      action: action.action ?? null,
      created_at: nullifier.created_at,
      nullifier_hash: nullifier.nullifier_hash,
    });
  } else {
    const insertResponse = await client.query({
      query: insertNullifierQuery,
      variables: {
        action_id: action.id,
        nullifier_hash: parsedParams.nullifier_hash,
        credential_type: parsedParams.credential_type,
      },
    });

    res.status(200).json({
      success: true,
      action: action.action ?? null,
      nullifier_hash: insertResponse.data.insert_nullifier_one.nullifier_hash,
      created_at: insertResponse.data.insert_nullifier_one.created_at,
    });
  }
}

const insertNullifierQuery = gql`
  mutation InsertNullifier(
    $action_id: String!
    $nullifier_hash: String!
    $credential_type: String!
  ) {
    insert_nullifier_one(
      object: {
        action_id: $action_id
        nullifier_hash: $nullifier_hash
        credential_type: $credential_type
      }
    ) {
      created_at
      nullifier_hash
      credential_type
    }
  }
`;

const updateNullifierQuery = gql`
  mutation UpdateNullifierUses($nullifier_hash: String!, $uses: Int!) {
    update_nullifier(
      where: {
        where: {
          uses: { _eq: $uses }
          nullifier_hash: { _eq: $nullifier_hash }
        }
      }
      _inc: { uses: 1 }
    ) {
      affected_rows
    }
  }
`;
