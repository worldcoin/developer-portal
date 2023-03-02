import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorValidation,
} from "../../../../backend/errors";

import { getAPIServiceClient } from "src/backend/graphql";
import { canVerifyForAction } from "src/backend/utils";
import { fetchActionForProof, verifyProof } from "src/backend/verify";
import { CredentialType } from "types";

export default async function handleVerify(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // NOTE: Lack of CORS headers, because this endpoint should not be called from the frontend (security reasons)
  if (!req.method || !["POST"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of [
    "proof",
    "nullifier_hash",
    "merkle_root",
    "credential_type",
  ]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  if (!req.query.app_id) {
    return errorRequiredAttribute("app_id", res);
  }

  if (req.body.action === null || req.body.action === undefined) {
    return errorRequiredAttribute("action", res);
  }

  if (req.body.signal === null || req.body.signal === undefined) {
    return errorRequiredAttribute("signal", res);
  }

  if (!Object.values(CredentialType).includes(req.body.credential_type)) {
    return errorValidation(
      "invalid",
      "Invalid credential type.",
      "credential_type",
      res
    );
  }

  const client = await getAPIServiceClient();
  const data = await fetchActionForProof(
    client,
    req.query.app_id?.toString(),
    req.body.nullifier_hash,
    req.body.action
  );

  if (data.error || !data.app) {
    return errorResponse(
      res,
      data.error?.statusCode || 400,
      data.error?.code || "unknown_error",
      data.error?.message || "There was an error verifying this proof.",
      data.error?.attribute || null
    );
  }

  const { app } = data;
  const { action } = app;

  // ANCHOR: Check if the action has a limit of verifications and if the person would exceed it
  if (action.action !== "") {
    // NOTE: If `action != ""`, action is NOT for Sign in with World ID
    if (!canVerifyForAction(action.nullifiers, action.max_verifications)) {
      // Return error response if person has already verified before and exceeded the max number of times to verify
      const errorMsg =
        action.max_verifications === 1
          ? "This person has already verified for this action."
          : `This person has already verified for this action the maximum number of times (${action.max_verifications}).`;
      return errorValidation("already_verified", errorMsg, null, res);
    }
  }

  if (!action.external_nullifier) {
    return errorResponse(
      res,
      400,
      "verification_error",
      "This action does not have a valid external nullifier set."
    );
  }

  // ANCHOR: Verify the proof with the World ID smart contract
  const { error, success } = await verifyProof(
    {
      signal: req.body.signal,
      proof: req.body.proof,
      merkle_root: req.body.merkle_root,
      nullifier_hash: req.body.nullifier_hash,
      external_nullifier: action.external_nullifier,
    },
    {
      contract_address: data.contractAddress,
      is_staging: app.is_staging,
      credential_type: req.body.credential_type as CredentialType,
    }
  );
  if (error || !success) {
    return errorResponse(
      res,
      error?.statusCode || 400,
      error?.code || "unknown_error",
      error?.message || "There was an error verifying this proof.",
      error?.attribute || null
    );
  }

  const insertNullifierQuery = gql`
    mutation InsertNullifier(
      $nullifier_hash: String!
      $action_id: String!
      $merkle_root: String
    ) {
      insert_nullifier_one(
        object: {
          nullifier_hash: $nullifier_hash
          merkle_root: $merkle_root
          action_id: $action_id
        }
      ) {
        nullifier_hash
        created_at
      }
    }
  `;
  const insertResponse = await client.query({
    query: insertNullifierQuery,
    variables: {
      nullifier_hash: req.body.nullifier_hash,
      action_id: action.id,
      merkle_root: req.body.merkle_root,
    },
  });

  res.status(200).json({
    success: true,
    action_id: action.id ?? null,
    nullifier_hash: insertResponse.data.insert_nullifier_one.nullifier_hash,
    created_at: insertResponse.data.insert_nullifier_one.created_at,
  });
}
